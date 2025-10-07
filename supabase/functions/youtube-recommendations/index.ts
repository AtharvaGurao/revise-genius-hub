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
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authorization token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { pdfIds, scope } = await req.json();
    console.log('Received request:', { pdfIds, scope, userId: user.id });

    // Fetch PDF(s) metadata
    let pdfQuery = supabaseClient
      .from('pdfs')
      .select('id, title')
      .eq('user_id', user.id);

    if (scope === 'selected' && pdfIds && pdfIds.length > 0) {
      pdfQuery = pdfQuery.in('id', pdfIds);
    }

    const { data: pdfs, error: pdfError } = await pdfQuery;
    
    if (pdfError) {
      console.error('Error fetching PDFs:', pdfError);
      throw pdfError;
    }

    if (!pdfs || pdfs.length === 0) {
      console.log('No PDFs found');
      return new Response(
        JSON.stringify({ videos: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract keywords from PDF titles
    const keywords = pdfs
      .map(pdf => pdf.title)
      .join(' ')
      .replace(/\.pdf$/i, '')
      .replace(/[-_]/g, ' ')
      .trim();

    console.log('Extracted keywords:', keywords);

    // Get YouTube API key
    const youtubeApiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!youtubeApiKey) {
      throw new Error('YouTube API key not configured');
    }

    // Search YouTube for educational videos
    const searchQuery = `${keywords} educational tutorial explanation`;
    const youtubeSearchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(searchQuery)}&type=video&videoCategoryId=27&maxResults=10&key=${youtubeApiKey}`;

    console.log('Searching YouTube with query:', searchQuery);

    const searchResponse = await fetch(youtubeSearchUrl);
    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('YouTube API error:', errorText);
      throw new Error(`YouTube API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const videoIds = searchData.items?.map((item: any) => item.id.videoId).join(',') || '';

    if (!videoIds) {
      console.log('No videos found in search results');
      return new Response(
        JSON.stringify({ videos: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get video details (duration, views, etc.)
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoIds}&key=${youtubeApiKey}`;
    
    console.log('Fetching video details');
    const detailsResponse = await fetch(detailsUrl);
    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      console.error('YouTube API error (details):', errorText);
      throw new Error(`YouTube API error: ${detailsResponse.status}`);
    }

    const detailsData = await detailsResponse.json();

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
    console.error('Error in youtube-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
