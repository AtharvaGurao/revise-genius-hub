import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Play, Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface VideoRecommendation {
  video_title: string;
  channel_name: string;
  thumbnail: string;
  description: string;
  published_date: string;
  video_url: string;
  embed_url: string;
}

interface YouTubeRecommenderProps {
  selectedPdfId: string | null;
}

const YouTubeRecommender = ({ selectedPdfId }: YouTubeRecommenderProps) => {
  const [videos, setVideos] = useState<VideoRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load webhook data from localStorage
    loadWebhookData();
    
    // Listen for new webhook data
    const handleDataUpdate = () => {
      loadWebhookData();
    };
    
    window.addEventListener('youtube-data-updated', handleDataUpdate);
    
    return () => {
      window.removeEventListener('youtube-data-updated', handleDataUpdate);
    };
  }, [selectedPdfId]);

  const loadWebhookData = () => {
    try {
      const storedData = localStorage.getItem('youtube-webhook-data');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data.videos && Array.isArray(data.videos)) {
          setVideos(data.videos);
          setIsLoading(false);
        }
      }
    } catch (error) {
      console.error('Error loading webhook data:', error);
    }
  };

  const fetchRecommendations = async () => {
    // Just reload from localStorage
    loadWebhookData();
  };

  const handleOpenVideo = (videoUrl: string) => {
    window.open(videoUrl, "_blank");
  };

  const handlePlayEmbed = (embedUrl: string) => {
    // Open embed URL in a new window/tab
    window.open(embedUrl, "_blank");
  };

  if (isLoading || isProcessing) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-3 sm:p-4 border-b bg-card">
          <div className="flex items-center gap-2 mb-2">
            <Youtube className="h-4 w-4 sm:h-5 sm:w-5 text-destructive flex-shrink-0" />
            <h3 className="font-heading font-semibold text-sm sm:text-base">Recommended Videos</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {isProcessing ? "Analyzing PDF content..." : "Loading recommendations..."}
          </p>
        </div>
        <ScrollArea className="flex-1 p-3 sm:p-4">
          <div className="space-y-3 sm:space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="w-full h-32 sm:h-40" />
                <div className="p-3 sm:p-4 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
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
          Based on {selectedPdfId ? "selected PDF" : "all your PDFs"}
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
            videos.map((video, index) => (
              <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Thumbnail */}
                  <div className="relative sm:w-64 flex-shrink-0 cursor-pointer" onClick={() => handlePlayEmbed(video.embed_url)}>
                    <img
                      src={video.thumbnail}
                      alt={video.video_title}
                      className="w-full h-40 sm:h-36 object-cover rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none"
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 rounded-t-lg sm:rounded-l-lg sm:rounded-tr-none">
                      <Play className="h-12 w-12 text-white" />
                    </div>
                  </div>
                  
                  {/* Video Details */}
                  <div className="flex-1 p-3 sm:p-4 space-y-2 min-w-0">
                    <h4 className="font-semibold text-sm sm:text-base line-clamp-2 leading-snug">
                      {video.video_title}
                    </h4>
                    
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{video.channel_name}</span>
                      {video.published_date && (
                        <>
                          <span>•</span>
                          <span>{new Date(video.published_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                    
                    {video.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {video.description}
                      </p>
                    )}
                    
                    <div className="flex gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs"
                        onClick={() => handlePlayEmbed(video.embed_url)}
                      >
                        <Play className="h-3 w-3 mr-1.5" />
                        Play
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleOpenVideo(video.video_url)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1.5" />
                        Watch on YouTube
                      </Button>
                    </div>
                  </div>
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
          onClick={() => fetchRecommendations()}
          disabled={isLoading}
        >
          Refresh Recommendations
        </Button>
      </div>
    </div>
  );
};

export default YouTubeRecommender;
