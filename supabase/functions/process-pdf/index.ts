import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import pdfParse from "https://esm.sh/pdf-parse@1.1.1";

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

    console.log(`Starting PDF processing for ID: ${pdfId}`);

    // Get PDF metadata
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError || !pdfData) {
      throw new Error('PDF not found');
    }

    console.log(`Processing PDF: ${pdfData.title} (${pdfData.pages} pages)`);

    // Download PDF from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('pdfs')
      .download(pdfData.file_path);

    if (downloadError || !fileData) {
      throw new Error('Failed to download PDF');
    }

    // Convert to buffer for pdf-parse
    const buffer = await fileData.arrayBuffer();
    console.log(`PDF size: ${(buffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // Parse PDF to extract text using pdf-parse
    console.log('Extracting text from PDF using pdf-parse...');
    const uint8Array = new Uint8Array(buffer);
    const pdfData_parsed = await pdfParse(uint8Array);
    
    if (!pdfData_parsed.text || pdfData_parsed.text.trim().length === 0) {
      console.warn('No text content extracted from PDF');
      throw new Error('No text content found in PDF. The file may be empty or contain only images.');
    }

    console.log(`Extracted ${pdfData_parsed.text.length} characters from ${pdfData_parsed.numpages} pages`);

    // For simplicity, we'll estimate page breaks by splitting text evenly
    // (pdf-parse doesn't provide page-by-page text, so we estimate)
    const totalChars = pdfData_parsed.text.length;
    const charsPerPage = Math.ceil(totalChars / pdfData_parsed.numpages);
    
    let allChunks: Array<{text: string, page: number, index: number}> = [];
    let chunkIndex = 0;

    // Split text into page-sized sections and chunk each section
    for (let pageNum = 1; pageNum <= pdfData_parsed.numpages; pageNum++) {
      const startChar = (pageNum - 1) * charsPerPage;
      const endChar = Math.min(pageNum * charsPerPage, totalChars);
      const pageText = pdfData_parsed.text.slice(startChar, endChar).trim();
      
      if (pageText) {
        const chunks = chunkText(pageText, pageNum);
        allChunks.push(...chunks.map(c => ({ ...c, index: chunkIndex++ })));
      }
    }

    if (allChunks.length === 0) {
      console.warn('No chunks created from PDF text');
      throw new Error('Failed to create text chunks from PDF.');
    }

    console.log(`Created ${allChunks.length} chunks from ${pdfData_parsed.numpages} pages`);

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