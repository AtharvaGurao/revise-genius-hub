import { useState } from "react";
import NavBar from "@/components/NavBar";
import YouTubeRecommender from "@/components/workspace/YouTubeRecommender";
import { Youtube } from "lucide-react";

const EduClips = () => {
  const [selectedPdfId] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <NavBar />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center gap-2 mb-6">
          <Youtube className="h-6 w-6 text-destructive" />
          <h1 className="font-heading font-bold text-2xl">Recommended Videos</h1>
        </div>
        
        <YouTubeRecommender selectedPdfId={selectedPdfId} />
      </main>
    </div>
  );
};

export default EduClips;
