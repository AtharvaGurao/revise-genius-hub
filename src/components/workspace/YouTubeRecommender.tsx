import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Play, Loader2, Youtube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
    fetchRecommendations();
  }, [selectedPdfId, scope]);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      // In production, call backend:
      // const pdfQuery = scope === 'selected' && selectedPdfId 
      //   ? `?pdfIds=${selectedPdfId}` 
      //   : '';
      // const response = await fetch(
      //   `${import.meta.env.VITE_API_BASE_URL}/youtube/recs${pdfQuery}`
      // );
      // const data = await response.json();
      // setVideos(data.items);

      // Mock recommendations
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const mockVideos: VideoRecommendation[] = [
        {
          videoId: "dQw4w9WgXcQ",
          title: "Newton's Laws of Motion - Complete Explanation for Class 11 Physics",
          thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
          channel: "Physics Wallah",
          duration: "45:20",
          views: "2.3M views",
        },
        {
          videoId: "abc123xyz",
          title: "Thermodynamics Chapter 1-5 | NCERT Class XI Physics",
          thumbnail: "https://img.youtube.com/vi/abc123xyz/mqdefault.jpg",
          channel: "Vedantu JEE",
          duration: "1:12:35",
          views: "1.8M views",
        },
        {
          videoId: "def456uvw",
          title: "Kinematics Problem Solving Techniques | IIT JEE Preparation",
          thumbnail: "https://img.youtube.com/vi/def456uvw/mqdefault.jpg",
          channel: "Unacademy Atoms",
          duration: "28:15",
          views: "950K views",
        },
        {
          videoId: "ghi789rst",
          title: "Wave Motion and Sound - Full Chapter Revision",
          thumbnail: "https://img.youtube.com/vi/ghi789rst/mqdefault.jpg",
          channel: "Khan Academy India",
          duration: "52:40",
          views: "1.2M views",
        },
      ];

      setVideos(mockVideos);
    } catch (error) {
      toast({
        title: "Failed to load recommendations",
        description: "Could not fetch video recommendations. Please try again.",
        variant: "destructive",
      });
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
      <div className="p-4 border-b bg-card">
        <div className="flex items-center gap-2 mb-2">
          <Youtube className="h-5 w-5 text-destructive" />
          <h3 className="font-heading font-semibold">Recommended Videos</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Based on {scope === "all" ? "all your PDFs" : "selected PDF"}
        </p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
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
                    className="w-full h-40 object-cover"
                  />
                  <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                    {video.duration}
                  </div>
                  <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="font-medium text-sm line-clamp-2 leading-snug">
                    {video.title}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">{video.channel}</p>
                      {video.views && (
                        <p className="text-xs text-muted-foreground">{video.views}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => handleOpenVideo(video.videoId)}
                  >
                    <ExternalLink className="h-3 w-3 mr-2" />
                    Watch on YouTube
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t bg-card">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
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
