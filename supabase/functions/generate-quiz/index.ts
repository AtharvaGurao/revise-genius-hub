import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PDF metadata and file path
    let pdfTitles = 'the selected documents';
    let pdfBase64 = '';
    
    if (scope === 'selected' && pdfIds && pdfIds.length > 0) {
      // Get PDF metadata
      const { data: pdfs, error: pdfError } = await supabase
        .from('pdfs')
        .select('title, file_path')
        .in('id', pdfIds);
      
      if (pdfError) throw new Error(`Failed to fetch PDF: ${pdfError.message}`);
      if (!pdfs || pdfs.length === 0) throw new Error('PDF not found');
      
      pdfTitles = pdfs.map(p => p.title).join(', ');
      const pdfFilePath = pdfs[0].file_path;

      // Download PDF from storage
      const { data: pdfBlob, error: downloadError } = await supabase.storage
        .from('pdfs')
        .download(pdfFilePath);
      
      if (downloadError) throw new Error(`Failed to download PDF: ${downloadError.message}`);
      if (!pdfBlob) throw new Error('PDF file is empty');

      // Convert PDF to base64
      const arrayBuffer = await pdfBlob.arrayBuffer();
      pdfBase64 = base64Encode(arrayBuffer);
      
      console.log('PDF downloaded and converted to base64, size:', pdfBase64.length);
    }

    if (!pdfBase64) {
      throw new Error('No PDF content available. Please select a PDF.');
    }

    // Create prompt based on question types
    const questionTypePrompts: Record<string, string> = {
      MCQ: 'Multiple Choice Questions with 4 options each',
      SAQ: 'Short Answer Questions (2-3 sentences)',
      LAQ: 'Long Answer Questions (paragraph format)'
    };

    const selectedTypes = types.map((t: string) => questionTypePrompts[t]).join(', ');
    
    // Use tool calling for structured output with PDF as multimodal input
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
            content: 'You are an expert question generator. You create exam-style questions based ONLY on the provided document content. Never use external knowledge or make assumptions beyond what is explicitly stated in the document.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `TASK: Generate ${count} questions STRICTLY based on the content in the PDF document. Types needed: ${selectedTypes}

CRITICAL RULES:
- Use ONLY information from the PDF document provided
- Do NOT use any external knowledge or information
- Questions and answers must be directly verifiable from the document content
- If the content doesn't support ${count} questions, generate as many as possible from available content

For MCQs: Provide question, 4 options, correct answer (index 0-3), explanation citing the document, and topic.
For SAQs: Provide question, model answer (2-3 sentences from document), and topic.
For LAQs: Provide question, comprehensive answer (paragraph from document), and topic.

Each question must include a topic field identifying the subject area from the document content.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${pdfBase64}`
                }
              }
            ]
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
    console.log('AI Response:', JSON.stringify(result, null, 2));

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
      JSON.stringify({ questions }),
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
