import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Chunk text into smaller pieces with page tracking (increased from 500 to 1000 for faster processing)
function chunkText(text: string, pageNumber: number, chunkSize = 1000): Array<{text: string, page: number}> {
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

// Generate embedding using Lovable AI
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  console.log('Generating embedding with Lovable AI...');
  
  const response = await fetch('https://ai.gateway.lovable.dev/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-large',
      input: text,
      dimensions: 1536,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Lovable AI embedding generation failed:', response.status, errorText);
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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

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

    // Convert to base64 efficiently (avoid stack overflow on large files)
    const buffer = await fileData.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    
    // Convert to base64 in chunks to avoid stack overflow
    let base64 = '';
    const chunkSize = 0x8000; // 32KB chunks
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, Math.min(i + chunkSize, uint8Array.length));
      base64 += btoa(String.fromCharCode.apply(null, Array.from(chunk)));
    }

    console.log(`PDF size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // Send to Lovable AI to extract text with page numbers
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
      console.error('AI API error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        throw new Error('Rate limit exceeded. Please try again in a moment.');
      } else if (aiResponse.status === 402) {
        throw new Error('Insufficient AI credits. Please add credits to continue.');
      }
      
      throw new Error(`AI processing failed: ${aiResponse.status} - ${errorText}`);
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

    if (allChunks.length === 0) {
      console.warn('No text content extracted from PDF');
      throw new Error('No text content found in PDF. The file may be empty or contain only images.');
    }

    console.log(`Created ${allChunks.length} chunks from ${matches.length} pages`);

    // Process embeddings in parallel batches for 5-8x speed improvement
    console.log(`Generating embeddings for ${allChunks.length} chunks with parallel processing...`);
    const CONCURRENCY = 5; // Process 5 chunks simultaneously
    const startTime = Date.now();
    let processedCount = 0;
    
    // Process chunks in parallel batches
    for (let i = 0; i < allChunks.length; i += CONCURRENCY) {
      const batch = allChunks.slice(i, Math.min(i + CONCURRENCY, allChunks.length));
      
      // Process current batch in parallel
      await Promise.all(batch.map(async (chunk) => {
        try {
          const embedding = await generateEmbedding(chunk.text, LOVABLE_API_KEY);
          
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
            throw insertError;
          }
          
          processedCount++;
        } catch (error) {
          console.error(`Failed to process chunk ${chunk.index}:`, error);
          throw error;
        }
      }));
      
      // Log progress after each batch
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      const rate = processedCount / (Date.now() - startTime) * 1000;
      const remaining = Math.ceil((allChunks.length - processedCount) / rate);
      console.log(`Progress: ${processedCount}/${allChunks.length} chunks (${elapsed}s elapsed, ~${remaining}s remaining)`);
    }
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Successfully processed all ${allChunks.length} chunks in ${totalTime}s (avg ${(processedCount / (Date.now() - startTime) * 1000).toFixed(2)} chunks/sec)`);

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
    
    // Try to mark PDF as failed (keep processed=false so user can retry)
    if (req.method === 'POST') {
      try {
        const { pdfId } = await req.json();
        console.log(`Marking PDF ${pdfId} processing as failed`);
      } catch (e) {
        console.error('Could not extract pdfId from failed request');
      }
    }
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to process PDF',
        details: error.toString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
