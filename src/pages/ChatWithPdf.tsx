import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import PdfViewer from "@/components/workspace/PdfViewer";
import ChatUI from "@/components/workspace/ChatUI";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

const ChatWithPdf = () => {
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

        {/* Desktop: Left - PDF Viewer */}
        <aside className="hidden lg:block w-1/2 border-r bg-card overflow-hidden">
          <PdfViewer pdfId={selectedPdfId} />
        </aside>

        {/* Right - Chat Interface */}
        <main className="flex-1 overflow-hidden">
          <ChatUI selectedPdfId={selectedPdfId} />
        </main>
      </div>
    </div>
  );
};

export default ChatWithPdf;
