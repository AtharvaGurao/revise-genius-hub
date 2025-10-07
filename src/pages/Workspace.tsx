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
  const [scope, setScope] = useState<"all" | "selected">("all");

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild className="lg:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-4 border-b">
                <h2 className="font-heading font-semibold">PDF Library</h2>
              </div>
              <div className="p-4">
                <SourceSelector
                  selectedPdfId={selectedPdfId}
                  onSelectPdf={setSelectedPdfId}
                  scope={scope}
                  onScopeChange={setScope}
                />
              </div>
            </SheetContent>
          </Sheet>
          
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Home className="h-5 w-5 text-primary" />
            <h1 className="font-heading font-bold text-lg">SmartRevise</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/history">History</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/settings">Settings</Link>
          </Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - PDF Library (Desktop) */}
        <aside className="hidden lg:block w-80 border-r bg-card overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="font-heading font-semibold">PDF Library</h2>
          </div>
          <div className="p-4">
            <SourceSelector
              selectedPdfId={selectedPdfId}
              onSelectPdf={setSelectedPdfId}
              scope={scope}
              onScopeChange={setScope}
            />
          </div>
        </aside>

        {/* Center Pane - Tabbed Interface */}
        <main className="flex-1 overflow-hidden">
          <Tabs defaultValue="pdf" className="h-full flex flex-col">
            <div className="border-b bg-card px-4">
              <TabsList className="h-12 bg-transparent">
                <TabsTrigger value="pdf" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  PDF Viewer
                </TabsTrigger>
                <TabsTrigger value="quiz" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  Quiz
                </TabsTrigger>
                <TabsTrigger value="chat" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  AI Chat
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
            </div>
          </Tabs>
        </main>

        {/* Right Sidebar - Progress Dashboard & YouTube Recommender (Desktop) */}
        <aside className="hidden xl:block w-96 border-l bg-card overflow-y-auto">
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
