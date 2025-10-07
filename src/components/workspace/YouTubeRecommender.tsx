import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoRecommendation {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
  duration: string;
  views?: string;
}

interface YouTubeRecommenderProps {
  selectedPdfId: string | null;
  scope: "all" | "selected";
}

const YouTubeRecommender = ({ selectedPdfId, scope }: YouTubeRecommenderProps) => {
  const [videos, setVideos] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch if we have a valid scope or selected PDF
    const shouldFetch = scope === "all" || (scope === "selected" && selectedPdfId);
    if (shouldFetch) {
      fetchRecommendations();
    } else {
      setVideos([]);
    }
  }, [selectedPdfId, scope]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setVideos([]); // Clear previous videos
    
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to verify authentication');
      }
      
      if (!session) {
        console.log('No active session - skipping video fetch');
        setIsLoading(false);
        return;
      }

      const pdfIds = selectedPdfId ? [selectedPdfId] : [];
      
      console.log('Fetching YouTube recommendations:', { 
        pdfIds, 
        scope,
        hasSession: !!session,
        userId: session.user.id 
      });
      
      const { data, error } = await supabase.functions.invoke('youtube-recommendations', {
        body: { 
          pdfIds,
          scope 
        },
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      console.log('Received video data:', data);

      if (data?.videos && Array.isArray(data.videos)) {
        setVideos(data.videos);
        console.log(`Loaded ${data.videos.length} video recommendations`);
        if (data.videos.length === 0 && data.message) {
          toast({
            title: "No videos available",
            description: data.message,
          });
        }
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Error in fetchRecommendations:', error);
      const errorMessage = error instanceof Error ? error.message : 'Could not load video recommendations';
      toast({
        title: "Failed to load recommendations",
        description: errorMessage,
        variant: "destructive",
      });
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenVideo = (videoId: string) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 sm:p-4 border-b bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
          <h3 className="font-heading font-semibold text-sm sm:text-base">Recommended Videos</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on {scope === "all" ? "all your PDFs" : "selected PDF"}
        </p>
      </div>

      <ScrollArea className="flex-1 p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {videos.length === 0 ? (
            <div className="text-center py-8">
              <Youtube className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                No video recommendations available yet.
              </p>
            </div>
          ) : (
            videos.map((video) => (
              <Card key={video.videoId} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="w-full h-32 sm:h-40 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {video.duration}
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Play className="h-10 w-10 sm:h-12 sm:w-12 text-white" />
                  </div>
                </div>
                <div className="p-3 sm:p-4 space-y-2">
                  <h4 className="font-medium text-xs sm:text-sm line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 min-w-0 flex-1">
                      <p className="text-xs text-muted-foreground truncate">{video.channel}</p>
                      {video.views && (
                        <p className="text-xs text-muted-foreground">{video.views}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full text-xs"
                    onClick={() => handleOpenVideo(video.videoId)}
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Watch on YouTube
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-3 sm:p-4 border-t bg-card">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs sm:text-sm"
          onClick={fetchRecommendations}
          disabled={isLoading}
        >
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
};

export default YouTubeRecommender;
