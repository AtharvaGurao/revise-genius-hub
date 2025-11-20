import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import YouTubeRecommender from "@/components/workspace/YouTubeRecommender";
import { Button } from "@/components/ui/button";
import { Youtube, X } from "lucide-react";
import { useSelectedPdf } from "@/hooks/use-selected-pdf";

const EduClips = () => {
  const [selectedPdfId, setSelectedPdfId] = useSelectedPdf();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar onTogglePdfLibrary={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Library Sidebar */}
        {sidebarOpen && (
          <aside className="absolute lg:relative w-64 sm:w-72 lg:w-80 h-full border-r bg-card overflow-hidden flex flex-col z-20 shadow-lg lg:shadow-none">
            <div className="p-4 sm:p-6 border-b flex items-center justify-between">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold">PDF Library</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-7 w-7 sm:h-8 sm:w-8"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <SourceSelector
                selectedPdfId={selectedPdfId}
                onSelectPdf={setSelectedPdfId}
                onPdfSentToWebhook={() => {}}
              />
            </div>
          </aside>
        )}

        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <Youtube className="h-5 w-5 sm:h-6 sm:w-6 text-destructive" />
              <h1 className="font-heading font-bold text-xl sm:text-2xl">Recommended Videos</h1>
            </div>
            
            <YouTubeRecommender selectedPdfId={selectedPdfId} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default EduClips;
