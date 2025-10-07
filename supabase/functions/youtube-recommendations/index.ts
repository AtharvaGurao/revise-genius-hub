import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.74.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoRecommendation {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
  views?: string;
}

serve(async (req) => {
  console.log('YouTube recommendations function called');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization token
    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      console.warn('No authorization header - returning empty videos');
      return new Response(
        JSON.stringify({ videos: [], message: 'Authentication required' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    console.log('Getting user from token...');
    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.warn('Authentication failed:', userError?.message || 'No user found');
      return new Response(
        JSON.stringify({ videos: [], message: 'Authentication failed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    console.log('User authenticated:', user.id);

    const { pdfIds, scope } = await req.json();
    console.log('Received request:', { pdfIds, scope, userId: user.id });

    // Get target PDF IDs
    let targetPdfIds = pdfIds || [];
    if (scope === 'all' || targetPdfIds.length === 0) {
      const { data: allPdfs, error: pdfError } = await supabaseClient
        .from('pdfs')
        .select('id')
        .eq('user_id', user.id);

      if (pdfError) {
        console.error('Error fetching PDFs:', pdfError);
        return new Response(
          JSON.stringify({ videos: [], message: 'Error fetching PDFs' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetPdfIds = allPdfs?.map(pdf => pdf.id) || [];
    }

    if (targetPdfIds.length === 0) {
      console.log('No PDFs found');
      return new Response(
        JSON.stringify({ videos: [], message: 'No PDFs in your library' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch PDF chunks (actual content) for AI analysis
    console.log('Fetching PDF content for AI analysis...');
    const { data: chunks, error: chunksError } = await supabaseClient
      .from('pdf_chunks')
      .select('chunk_text, page_number')
      .in('pdf_id', targetPdfIds)
      .order('page_number', { ascending: true })
      .limit(20); // Limit to first 20 chunks

    if (chunksError) {
      console.error('Error fetching PDF chunks:', chunksError);
      return new Response(
        JSON.stringify({ videos: [], message: 'Error analyzing PDF content' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!chunks || chunks.length === 0) {
      console.log('No PDF content found');
      return new Response(
        JSON.stringify({ videos: [], message: 'PDF not yet processed. Please wait and try again.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Combine chunks for AI analysis
    const contentSample = chunks
      .map(chunk => chunk.chunk_text)
      .join('\n\n')
      .slice(0, 3000); // Limit to 3000 chars

    console.log('Analyzing PDF content with AI to extract topics...');
    
    // Use Lovable AI to extract key educational topics
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ videos: [], message: 'AI service not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let aiResponse;
    try {
      aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lovableApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages: [
            {
              role: 'system',
              content: 'You are an educational content analyzer. Extract 3-5 key study topics, concepts, or subject areas from educational text. Return only the topics as a comma-separated list.'
            },
            {
              role: 'user',
              content: `Extract main educational topics from this content:\n\n${contentSample}`
            }
          ],
          temperature: 0.3
        }),
      });

      if (!aiResponse.ok) {
        console.error('AI API error:', await aiResponse.text());
        return new Response(
          JSON.stringify({ videos: [], message: 'Failed to analyze content with AI' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (aiError) {
      console.error('AI request failed:', aiError);
      return new Response(
        JSON.stringify({ videos: [], message: 'AI analysis unavailable' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiData = await aiResponse.json();
    const keywords = aiData.choices?.[0]?.message?.content?.trim() || '';
    
    console.log('AI extracted topics:', keywords);

    if (!keywords) {
      return new Response(
        JSON.stringify({ videos: [], message: 'Could not identify topics from PDF' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get YouTube API key
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      console.warn('YouTube API key not configured');
      return new Response(
        JSON.stringify({ videos: [], message: 'YouTube API key not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate keywords
    if (!keywords || keywords.trim().length === 0) {
      console.warn('No keywords extracted from PDFs');
      return new Response(
        JSON.stringify({ videos: [], message: 'No content available to search' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search YouTube for educational videos
    const searchQuery = `${keywords} educational tutorial explanation`;
    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=27&maxResults=10&key=${youtubeApiKey}`;

    console.log('Searching YouTube with query:', searchQuery);

    let searchResponse;
    try {
      searchResponse = await fetch(youtubeSearchUrl);
      if (!searchResponse.ok) {
        const errorText = await searchResponse.text();
        console.error('YouTube API search error:', errorText);
        return new Response(
          JSON.stringify({ videos: [], message: 'YouTube API request failed. Please try again later.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('Network error during YouTube search:', fetchError);
      return new Response(
        JSON.stringify({ videos: [], message: 'Network error. Please check your connection.' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const searchData = await searchResponse.json();
    
    // Check for API errors (rate limit, quota exceeded, etc.)
    if (searchData.error) {
      console.error('YouTube API returned error:', searchData.error);
      return new Response(
        JSON.stringify({ videos: [], message: `YouTube API error: ${searchData.error.message || 'Unknown error'}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',') || '';

    if (!videoIds) {
      console.log('No videos found in search results');
      return new Response(
        JSON.stringify({ videos: [], message: 'No videos found for this topic' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video details (duration, views, etc.)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${youtubeApiKey}`;
    
    console.log('Fetching video details');
    let detailsResponse;
    try {
      detailsResponse = await fetch(detailsUrl);
      if (!detailsResponse.ok) {
        const errorText = await detailsResponse.text();
        console.error('YouTube API details error:', errorText);
        return new Response(
          JSON.stringify({ videos: [], message: 'Failed to fetch video details' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (fetchError) {
      console.error('Network error during video details fetch:', fetchError);
      return new Response(
        JSON.stringify({ videos: [], message: 'Network error while fetching video details' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const detailsData = await detailsResponse.json();
    
    // Check for API errors in details response
    if (detailsData.error) {
      console.error('YouTube API details error:', detailsData.error);
      return new Response(
        JSON.stringify({ videos: [], message: 'Error fetching video details' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format video data
    const videos: VideoRecommendation[] = detailsData.items?.map((video: any) => {
      // Parse ISO 8601 duration format (PT1H2M10S)
      const duration = video.contentDetails.duration
        .replace('PT', '')
        .replace('H', ':')
        .replace('M', ':')
        .replace('S', '');

      // Format view count
      const viewCount = parseInt(video.statistics.viewCount);
      const views = viewCount >= 1000000 
        ? `${(viewCount / 1000000).toFixed(1)}M views`
        : viewCount >= 1000
        ? `${(viewCount / 1000).toFixed(0)}K views`
        : `${viewCount} views`;

      return {
        videoId: video.id,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        channel: video.snippet.channelTitle,
        duration: duration,
        views: views,
      };
    }) || [];

    console.log(`Successfully fetched ${videos.length} videos`);

    return new Response(
      JSON.stringify({ videos }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected error in youtube-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ videos: [], message: errorMessage }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
