import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import PdfViewer from "@/components/workspace/PdfViewer";
import ChatUI from "@/components/workspace/ChatUI";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useSelectedPdf } from "@/hooks/use-selected-pdf";

const ChatWithPdf = () => {
  const [selectedPdfId, setSelectedPdfId] = useSelectedPdf();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar onTogglePdfLibrary={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex-1 flex overflow-hidden relative">
        {/* PDF Library Sidebar */}
        {sidebarOpen && (
          <aside className="absolute lg:relative w-64 sm:w-72 lg:w-80 h-full border-r bg-card overflow-hidden flex flex-col z-20 lg:z-0 shadow-lg lg:shadow-none">
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

        {/* Desktop: Left - PDF Viewer */}
        <aside className={`hidden lg:block border-r bg-card overflow-hidden ${sidebarOpen ? 'w-[calc(50%-10rem)]' : 'w-1/2'}`}>
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
