import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Menu, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import SourceSelector from "@/components/workspace/SourceSelector";
import PdfViewer from "@/components/workspace/PdfViewer";
import QuizPanel from "@/components/workspace/QuizPanel";
import ChatUI from "@/components/workspace/ChatUI";
import ProgressMiniDashboard from "@/components/workspace/ProgressMiniDashboard";
import YouTubeRecommender from "@/components/workspace/YouTubeRecommender";

const Workspace = () => {
  const [selectedPdfId, setSelectedPdfId] = useState<string | null>(null);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-3 sm:px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden flex-shrink-0">
              <Button variant="ghost" size="icon" className="h-9 w-9">
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
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-1.5 sm:gap-2 hover:opacity-80 transition-opacity min-w-0">
            <Home className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
            <h1 className="font-heading font-bold text-base sm:text-lg truncate">SmartRevise</h1>
          </Link>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <Button variant="outline" size="sm" asChild className="hidden sm:flex">
            <Link to="/history">History</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild className="text-xs sm:text-sm px-2 sm:px-3">
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </header>

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
                <QuizPanel selectedPdfId={selectedPdfId} />
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
                    <YouTubeRecommender selectedPdfId={selectedPdfId} />
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
              <YouTubeRecommender selectedPdfId={selectedPdfId} />
            </TabsContent>
          </Tabs>
        </aside>
      </div>
    </div>
  );
};

export default Workspace;
