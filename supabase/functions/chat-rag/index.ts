import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate embedding for query
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  console.log('Generating embedding for query...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 768, // Match database vector dimension
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Embedding generation failed:', response.status, errorText);
    throw new Error(`Embedding generation failed: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log('Embedding generated successfully');
  return result.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { conversationId, query, pdfId } = await req.json();
    console.log('Chat RAG request:', { conversationId, pdfId, queryLength: query?.length });

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured. Please contact support.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get conversation history
    const { data: messages } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(10);

    // Generate embedding for the query
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(query, LOVABLE_API_KEY);
    } catch (embeddingError) {
      console.error('Failed to generate embedding:', embeddingError);
      return new Response(
        JSON.stringify({ error: 'Failed to process query. Please try again.' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Search for relevant chunks using vector similarity
    const { data: relevantChunks, error: searchError } = await supabase
      .rpc('search_pdf_chunks', {
        query_embedding: queryEmbedding,
        match_threshold: 0.7,
        match_count: 5,
        filter_pdf_id: pdfId || null,
      });

    if (searchError) {
      console.error('Search error:', searchError);
    }

    // Build context from relevant chunks
    let contextText = '';
    if (relevantChunks && relevantChunks.length > 0) {
      contextText = '\n\nRelevant context from the PDF:\n';
      relevantChunks.forEach((chunk: any, idx: number) => {
        contextText += `\n[Source ${idx + 1}, Page ${chunk.page_number}]:\n"${chunk.chunk_text}"\n`;
      });
    }

    // Get PDF title if specified
    let pdfTitle = '';
    if (pdfId) {
      const { data: pdfData } = await supabase
        .from('pdfs')
        .select('title')
        .eq('id', pdfId)
        .single();
      
      if (pdfData) {
        pdfTitle = pdfData.title;
      }
    }

    // Build conversation history for AI
    const conversationHistory = messages?.map(msg => ({
      role: msg.role,
      content: msg.content
    })) || [];

    // System prompt with RAG instructions
    const systemPrompt = `You are an AI tutor specializing in helping Indian students with their studies.

${pdfTitle ? `You are answering questions about the PDF: "${pdfTitle}".` : ''}

CRITICAL CITATION RULES:
1. ALWAYS cite your sources when using information from the provided context
2. Use this EXACT format for citations: "According to p. X: '[2-3 line quote from source]'"
3. The page number X must match the page_number from the context provided
4. Quote must be EXACTLY as written in the source text (2-3 lines maximum)
5. If multiple sources support your answer, cite each one separately
6. If no relevant context is provided, clearly state you need more information from the PDF

Example citation format:
"According to p. 23: 'Photosynthesis is the process by which green plants use sunlight to synthesize nutrients from carbon dioxide and water. This process involves the green pigment chlorophyll.'"

${contextText}

Provide clear, accurate answers based ONLY on the context provided above. Always include proper citations.`;

    // Stream response from Lovable AI
    console.log('Calling Lovable AI Gateway...');
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
            content: systemPrompt
          },
          ...conversationHistory,
          {
            role: 'user',
            content: query
          }
        ],
        stream: true,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
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
      return new Response(
        JSON.stringify({ error: `AI service error: ${aiResponse.status}` }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('Streaming AI response...');

    // Return the stream directly to client
    return new Response(aiResponse.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error: any) {
    console.error('Chat RAG error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
