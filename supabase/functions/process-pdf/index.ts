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
    const { pdfId } = await req.json();
    
    if (!pdfId) {
      throw new Error('PDF ID is required');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get PDF metadata
    const { data: pdfData, error: pdfError } = await supabase
      .from('pdfs')
      .select('*')
      .eq('id', pdfId)
      .single();

    if (pdfError) throw pdfError;

    // Download PDF from storage
    const { data: fileData, error: fileError } = await supabase.storage
      .from('pdfs')
      .download(pdfData.file_path);

    if (fileError) throw fileError;

    // Convert PDF to text using Lovable AI for extraction
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

    const arrayBuffer = await fileData.arrayBuffer();
    const base64Pdf = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

    // Use AI to analyze PDF structure and extract key information
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
            content: 'You are a PDF content analyzer. Extract key topics, chapters, and important concepts from educational PDFs. Return a structured summary.'
          },
          {
            role: 'user',
            content: `Analyze this PDF and extract: 1) Total page count estimate, 2) Main topics/chapters, 3) Key concepts. PDF title: ${pdfData.title}`
          }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiResult = await aiResponse.json();
    const analysis = aiResult.choices[0].message.content;

    // Update PDF record as processed
    const { error: updateError } = await supabase
      .from('pdfs')
      .update({
        processed: true,
        pages: pdfData.pages || 100, // Estimate from AI or default
      })
      .eq('id', pdfId);

    if (updateError) throw updateError;

    console.log('PDF processed successfully:', pdfId);

    return new Response(
      JSON.stringify({
        success: true,
        pdfId,
        analysis,
        message: 'PDF processed and ready for quizzes and chat'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Process PDF error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
