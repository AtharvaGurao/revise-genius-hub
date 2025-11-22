import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pdfIds, scope, types, count } = await req.json();

    if (!types || types.length === 0) {
      throw new Error('Question types are required');
    }

    // Get environment variables
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const PINECONE_API_KEY = Deno.env.get('PINECONE_API_KEY');
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    if (!PINECONE_API_KEY) throw new Error('PINECONE_API_KEY not configured');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PDF metadata
    let pdfTitle = 'NCERT textbooks';
    let pdfFileName = '';
    
    if (scope === 'selected' && pdfIds && pdfIds.length > 0) {
      const { data: pdfs } = await supabase
        .from('pdfs')
        .select('title, file_path')
        .in('id', pdfIds);
      
      if (pdfs && pdfs.length > 0) {
        pdfTitle = pdfs.map(p => p.title).join(', ');
        // Extract filename from file_path (e.g., "user_id/filename.pdf" -> "filename.pdf")
        pdfFileName = pdfs[0].file_path.split('/').pop() || '';
        console.log('PDF Title:', pdfTitle);
        console.log('PDF File Name:', pdfFileName);
      }
    }

    // Step 1: Create embedding for the query using OpenAI
    console.log('Creating query embedding...');
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: `Generate quiz questions about: ${pdfTitle}`,
        dimensions: 512
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error('Embedding API error:', errorText);
      throw new Error('Failed to create query embedding');
    }

    const embeddingData = await embeddingResponse.json();
    const queryVector = embeddingData.data[0].embedding;
    console.log('Query vector created, dimensions:', queryVector.length);

    // Step 2: Query Pinecone for relevant chunks
    console.log('Querying Pinecone...');
    const pineconeUrl = 'https://smartrag-lprvf87.svc.aped-4627-b74a.pinecone.io/query';
    
    const pineconeQuery: any = {
      vector: queryVector,
      topK: 15,
      includeMetadata: true
    };
    console.log('🔍 DIAGNOSTIC MODE: Querying Pinecone WITHOUT filter to inspect metadata');
    console.log('PDF File Name (will check later):', pdfFileName);

    // DIAGNOSTIC: Temporarily removed filter to inspect metadata structure
    // if (pdfFileName) {
    //   pineconeQuery.filter = {
    //     'file-name': { '$eq': pdfFileName }
    //   };
    //   console.log('Filtering by file-name:', pdfFileName);
    // }

    const pineconeResponse = await fetch(pineconeUrl, {
      method: 'POST',
      headers: {
        'Api-Key': PINECONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pineconeQuery),
    });

    if (!pineconeResponse.ok) {
      const errorText = await pineconeResponse.text();
      console.error('Pinecone error:', pineconeResponse.status, errorText);
      
      // Fallback to title-based generation if Pinecone fails
      console.log('Falling back to title-based generation...');
      return await generateWithTitleOnly(pdfTitle, types, count, LOVABLE_API_KEY, corsHeaders);
    }

    const pineconeData = await pineconeResponse.json();
    const matches = pineconeData.matches || [];
    console.log(`Retrieved ${matches.length} chunks from Pinecone`);

    // DIAGNOSTIC: Log first 3 chunks to discover metadata structure
    if (matches.length > 0) {
      console.log('\n========================================');
      console.log('🔬 DIAGNOSTIC: Pinecone Metadata Structure');
      console.log('========================================\n');
      
      matches.slice(0, 3).forEach((match: any, idx: number) => {
        console.log(`\n--- CHUNK ${idx + 1} ---`);
        console.log('ID:', match.id);
        console.log('Score:', match.score);
        console.log('Metadata Keys:', Object.keys(match.metadata || {}));
        console.log('Full Metadata:');
        console.log(JSON.stringify(match.metadata, null, 2));
        console.log('---\n');
      });
      
      console.log('========================================\n');
    }

    if (matches.length === 0) {
      console.log('No chunks found, falling back to title-based generation...');
      return await generateWithTitleOnly(pdfTitle, types, count, LOVABLE_API_KEY, corsHeaders);
    }

    // Step 3: Build context from chunks
    const context = matches
      .map((match: any, idx: number) => {
        const pageNum = match.metadata?.['loc.lines.from'] || 
                       match.metadata?.page || 
                       'unknown';
        const text = match.metadata?.text || '';
        return `[Chunk ${idx + 1}, Page ${pageNum}]\n${text}`;
      })
      .join('\n\n');

    console.log('Built context from chunks, length:', context.length);

    // Step 4: Generate questions with Gemini using actual content
    const questionTypePrompts: Record<string, string> = {
      MCQ: 'Multiple Choice Questions with 4 options each',
      SAQ: 'Short Answer Questions (2-3 sentences)',
      LAQ: 'Long Answer Questions (paragraph format)'
    };

    const selectedTypes = types.map((t: string) => questionTypePrompts[t]).join(', ');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert exam question generator. Generate high-quality questions based ONLY on the provided content. Do not use external knowledge.'
          },
          {
            role: 'user',
            content: `Generate ${count} questions based on the following content from "${pdfTitle}". 
Types needed: ${selectedTypes}

CONTENT FROM PDF:
${context}

INSTRUCTIONS:
- Base questions ONLY on the content above
- For MCQs: Provide question, 4 options (A, B, C, D), correct answer, explanation, and topic
- For SAQs: Provide question, model answer (2-3 sentences), and topic
- For LAQs: Provide question, comprehensive answer (1 paragraph), and topic
- Each question must include a topic field identifying the subject area
- Include page references in explanations when possible
- Make questions exam-relevant and test understanding of the content`
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'generate_questions',
              description: 'Generate quiz questions in structured format',
              parameters: {
                type: 'object',
                properties: {
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        type: { type: 'string', enum: ['MCQ', 'SAQ', 'LAQ'] },
                        question: { type: 'string' },
                        topic: { type: 'string' },
                        choices: {
                          type: 'array',
                          items: { type: 'string' }
                        },
                        answerKey: { type: 'number' },
                        explanation: { type: 'string' }
                      },
                      required: ['id', 'type', 'question', 'topic', 'explanation']
                    }
                  }
                },
                required: ['questions']
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'generate_questions' } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const result = await aiResponse.json();
    console.log('AI Response received');

    // Extract questions from tool call
    const toolCall = result.choices[0].message.tool_calls?.[0];
    let questions = [];

    if (toolCall?.function?.arguments) {
      const args = typeof toolCall.function.arguments === 'string' 
        ? JSON.parse(toolCall.function.arguments)
        : toolCall.function.arguments;
      questions = args.questions || [];
    }

    console.log('Generated questions:', questions.length);

    return new Response(
      JSON.stringify({ 
        questions,
        source: 'pinecone',
        chunksUsed: matches.length 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error: any) {
    console.error('Generate quiz error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Fallback function for title-based generation
async function generateWithTitleOnly(
  pdfTitle: string, 
  types: string[], 
  count: number, 
  LOVABLE_API_KEY: string,
  corsHeaders: Record<string, string>
) {
  const questionTypePrompts: Record<string, string> = {
    MCQ: 'Multiple Choice Questions with 4 options each',
    SAQ: 'Short Answer Questions (2-3 sentences)',
    LAQ: 'Long Answer Questions (paragraph format)'
  };

  const selectedTypes = types.map((t: string) => questionTypePrompts[t]).join(', ');
  
  const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are an expert exam question generator for students.'
        },
        {
          role: 'user',
          content: `You are generating quiz questions for a student studying from "${pdfTitle}".
This appears to be an NCERT textbook or educational material. Generate ${count} exam-style questions.

Types needed: ${selectedTypes}

IMPORTANT: 
- If the title suggests a specific subject (like physics, chemistry, biology, mathematics), generate questions from that subject
- Make questions relevant to typical NCERT curriculum topics for that subject
- The PDF title may be a code name - infer the subject from context (e.g., "keph" likely refers to physics)
- Do NOT generate generic questions about unrelated subjects
- Focus on science and mathematics topics appropriate for secondary/senior secondary education

For MCQs: Provide question, 4 options (A, B, C, D), correct answer, explanation, and topic.
For SAQs: Provide question, model answer (2-3 sentences), and topic.
For LAQs: Provide question, comprehensive answer (1 paragraph), and topic.

Each question must include a topic field identifying the subject area.`
        }
      ],
      tools: [
        {
          type: 'function',
          function: {
            name: 'generate_questions',
            description: 'Generate quiz questions in structured format',
            parameters: {
              type: 'object',
              properties: {
                questions: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      type: { type: 'string', enum: ['MCQ', 'SAQ', 'LAQ'] },
                      question: { type: 'string' },
                      topic: { type: 'string' },
                      choices: {
                        type: 'array',
                        items: { type: 'string' }
                      },
                      answerKey: { type: 'number' },
                      explanation: { type: 'string' }
                    },
                    required: ['id', 'type', 'question', 'topic', 'explanation']
                  }
                }
              },
              required: ['questions']
            }
          }
        }
      ],
      tool_choice: { type: 'function', function: { name: 'generate_questions' } }
    }),
  });

  const result = await aiResponse.json();
  const toolCall = result.choices[0].message.tool_calls?.[0];
  let questions = [];

  if (toolCall?.function?.arguments) {
    const args = typeof toolCall.function.arguments === 'string' 
      ? JSON.parse(toolCall.function.arguments)
      : toolCall.function.arguments;
    questions = args.questions || [];
  }

  return new Response(
    JSON.stringify({ 
      questions,
      source: 'title-fallback',
      message: 'Questions generated from title only (no PDF content found in Pinecone)'
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
