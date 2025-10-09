import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import QuizPanel from "@/components/workspace/QuizPanel";
import ProgressMiniDashboard from "@/components/workspace/ProgressMiniDashboard";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { BarChart3 } from "lucide-react";

const RevisePro = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile PDF Library Sheet */}
        <Sheet>
          <SheetTrigger asChild className="lg:hidden fixed bottom-4 left-4 z-40">
            <Button variant="default" size="icon" className="rounded-full shadow-lg">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-full sm:w-80 p-0">
            <div className="p-4 border-b">
              <h2 className="font-heading font-semibold">PDF Library</h2>
            </div>
            <div className="p-4">
              <SourceSelector
                selectedPdfId={selectedPdfId}
                onSelectPdf={setSelectedPdfId}
                onPdfSentToWebhook={() => {}}
              />
            </div>
          </SheetContent>
        </Sheet>

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
