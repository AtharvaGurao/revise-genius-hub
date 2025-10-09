import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import QuizPanel from "@/components/workspace/QuizPanel";
import ProgressMiniDashboard from "@/components/workspace/ProgressMiniDashboard";
import { Button } from "@/components/ui/button";
import { X, BarChart3 } from "lucide-react";

const RevisePro = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar onTogglePdfLibrary={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Library Sidebar */}
        {sidebarOpen && (
          <aside className="absolute lg:relative w-80 h-full border-r bg-card overflow-hidden flex flex-col z-20 shadow-lg lg:shadow-none">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-2xl font-bold">PDF Library</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-5 w-5" />
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

        {/* Left - Quiz Panel */}
        <main className="flex-1 overflow-hidden">
          <QuizPanel selectedPdfId={selectedPdfId} />
        </main>

        {/* Right - Progress Dashboard */}
        <aside className="hidden lg:block w-96 border-l bg-card overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="h-5 w-5 text-foreground" />
              <h2 className="font-heading font-bold text-xl">Progress</h2>
            </div>
            <ProgressMiniDashboard />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default RevisePro;
