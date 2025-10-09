import { useState } from "react";
import NavBar from "@/components/NavBar";
import SourceSelector from "@/components/workspace/SourceSelector";
import PdfViewer from "@/components/workspace/PdfViewer";
import ChatUI from "@/components/workspace/ChatUI";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const ChatWithPdf = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      <NavBar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Library Sidebar */}
        {sidebarOpen && (
          <aside className="w-80 border-r bg-card overflow-hidden flex flex-col">
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

        {/* Toggle sidebar button when closed */}
        {!sidebarOpen && (
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="outline"
            size="sm"
            className="fixed left-4 top-20 z-10"
          >
            PDF Library
          </Button>
        )}

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
