import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces with page tracking
function chunkText(text: string, pageNumber: number, chunkSize = 500): Array<{text: string, page: number}> {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks: Array<{text: string, page: number}> = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk) {
      chunks.push({ text: currentChunk.trim(), page: pageNumber });
      currentChunk = sentence;
    } else {
      currentChunk += sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push({ text: currentChunk.trim(), page: pageNumber });
  }
  
  return chunks;
}

// Generate embedding using OpenAI text-embedding-3-large
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  console.log('Generating embedding with OpenAI text-embedding-3-large...');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536, // Match database vector dimension
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI embedding generation failed:', response.status, errorText);
    throw new Error(`Embedding generation failed: ${response.status}`);
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
    const { pdfId } = await req.json();
    
    if (!pdfId) {
      throw new Error('PDF ID is required');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not configured');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PDF metadata
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdfData) {
      throw new Error('PDF not found');
    }

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdfs')
      .download(pdfData.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download PDF');
    }

    // Convert to base64
    const buffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    // Send to Lovable AI to extract text with page numbers
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ALL text content from this PDF. For each page, format as: "PAGE X: [content]". Be thorough and extract everything.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:application/pdf;base64,${base64}`
                }
              }
            ]
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const extractedText = aiResult.choices[0].message.content;

    // Parse text by pages
    const pageRegex = /PAGE (\d+):([\s\S]*?)(?=PAGE \d+:|$)/gi;
    const matches = [...extractedText.matchAll(pageRegex)];
    
    let allChunks: Array<{text: string, page: number, index: number}> = [];
    let chunkIndex = 0;

    for (const match of matches) {
      const pageNum = parseInt(match[1]);
      const pageText = match[2].trim();
      
      if (pageText) {
        const chunks = chunkText(pageText, pageNum);
        allChunks.push(...chunks.map(c => ({ ...c, index: chunkIndex++ })));
      }
    }

    console.log(`Created ${allChunks.length} chunks from ${matches.length} pages`);

    // Generate embeddings and store chunks
    for (const chunk of allChunks) {
      const embedding = await generateEmbedding(chunk.text, OPENAI_API_KEY);
      
      const { error: insertError } = await supabase
        .from('pdf_chunks')
        .insert({
          pdf_id: pdfId,
          user_id: pdfData.user_id,
          chunk_text: chunk.text,
          page_number: chunk.page,
          chunk_index: chunk.index,
          embedding,
        });

      if (insertError) {
        console.error('Failed to insert chunk:', insertError);
      }
    }

    // Mark as processed
    const { error: updateError } = await supabase
      .from('pdfs')
      .update({ processed: true })
      .eq('id', pdfId);

    if (updateError) {
      console.error('Failed to update PDF status:', updateError);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        chunksCreated: allChunks.length,
        message: 'PDF processed and embedded successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error: any) {
    console.error('Process PDF error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
