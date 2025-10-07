import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SourceSelector from "@/components/workspace/SourceSelector";
import PdfViewer from "@/components/workspace/PdfViewer";
import QuizPanel from "@/components/workspace/QuizPanel";
import ChatUI from "@/components/workspace/ChatUI";
import ProgressMiniDashboard from "@/components/workspace/ProgressMiniDashboard";
import YouTubeRecommender from "@/components/workspace/YouTubeRecommender";
import Navbar from "@/components/Navbar";

const Workspace = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);
  const [scope, setScope] = useState<"all" | "selected">("all");

  return (
    <div className="h-screen flex flex-col bg-background">
      <Navbar />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - PDF Library (Desktop) */}
        <aside className="hidden lg:block w-64 xl:w-80 border-r bg-card overflow-y-auto flex-shrink-0">
          <div className="p-3 xl:p-4 border-b">
            <h2 className="font-heading font-semibold text-sm xl:text-base">PDF Library</h2>
          </div>
          <div className="p-3 xl:p-4">
            <SourceSelector
              selectedPdfId={selectedPdfId}
              onSelectPdf={setSelectedPdfId}
              scope={scope}
              onScopeChange={setScope}
            />
          </div>
        </aside>

        {/* Center Pane - Tabbed Interface */}
        <main className="flex-1 overflow-hidden min-w-0">
          <Tabs defaultValue="pdf" className="h-full flex flex-col">
            <div className="border-b bg-card px-2 sm:px-4">
              <TabsList className="h-10 sm:h-12 bg-transparent w-full sm:w-auto justify-start overflow-x-auto">
                <TabsTrigger 
                  value="pdf" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
                >
                  PDF
                </TabsTrigger>
                <TabsTrigger 
                  value="quiz" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
                >
                  Quiz
                </TabsTrigger>
                <TabsTrigger 
                  value="chat" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap"
                >
                  Chat
                </TabsTrigger>
                <TabsTrigger 
                  value="progress" 
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-xs sm:text-sm px-3 sm:px-4 whitespace-nowrap xl:hidden"
                >
                  Progress
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-hidden">
              <TabsContent value="pdf" className="h-full m-0 p-0">
                <PdfViewer pdfId={selectedPdfId} />
              </TabsContent>
              
              <TabsContent value="quiz" className="h-full m-0 p-0">
                <QuizPanel scope={scope} selectedPdfId={selectedPdfId} />
              </TabsContent>
              
              <TabsContent value="chat" className="h-full m-0 p-0">
                <ChatUI selectedPdfId={selectedPdfId} />
              </TabsContent>

              <TabsContent value="progress" className="h-full m-0 p-4 xl:hidden overflow-auto">
                <div className="max-w-2xl mx-auto space-y-4">
                  <h2 className="font-heading font-bold text-xl mb-4">Your Progress</h2>
                  <ProgressMiniDashboard />
                  <div className="mt-6">
                    <h3 className="font-heading font-semibold mb-3">Recommended Videos</h3>
                    <YouTubeRecommender selectedPdfId={selectedPdfId} scope={scope} />
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </main>

        {/* Right Sidebar - Progress Dashboard & YouTube Recommender (Desktop) */}
        <aside className="hidden xl:block w-80 2xl:w-96 border-l bg-card overflow-y-auto flex-shrink-0">
          <Tabs defaultValue="progress" className="h-full flex flex-col">
            <div className="border-b bg-card px-4">
              <TabsList className="h-12 bg-transparent w-full justify-start">
                <TabsTrigger value="progress" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Progress
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Videos
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="progress" className="flex-1 m-0 p-4">
              <ProgressMiniDashboard />
            </TabsContent>
            
            <TabsContent value="videos" className="flex-1 m-0 p-0">
              <YouTubeRecommender selectedPdfId={selectedPdfId} scope={scope} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;
