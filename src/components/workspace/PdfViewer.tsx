import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
} from "lucide-react";

interface PdfViewerProps {
  pdfId: string | null;
}

const PdfViewer = ({ pdfId }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [totalPages] = useState(120); // Mock - in production from PDF metadata

  const handlePrevPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handleZoomIn = () => {
    if (zoom < 200) setZoom(zoom + 10);
  };

  const handleZoomOut = () => {
    if (zoom > 50) setZoom(zoom - 10);
  };

  const handlePageJump = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const page = parseInt(formData.get("page") as string, 10);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  if (!pdfId) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4 max-w-md px-4">
          <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
          <h3 className="font-heading font-semibold text-xl">No PDF Selected</h3>
          <p className="text-muted-foreground">
            Select a PDF from the library on the left, or upload a new one to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="bg-card border-b px-4 py-3 flex items-center justify-between gap-4 flex-wrap">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <form onSubmit={handlePageJump} className="flex items-center gap-2">
            <Input
              name="page"
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              className="w-16 text-center"
            />
            <span className="text-sm text-muted-foreground">/ {totalPages}</span>
          </form>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[4rem] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="icon" onClick={handleZoomIn}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-6">
        <div
          className="mx-auto bg-white shadow-lg"
          style={{
            width: `${zoom}%`,
            minHeight: "800px",
          }}
        >
          {/* In production, render actual PDF using react-pdf or pdf.js */}
          <div className="p-8 space-y-4 text-gray-800">
            <h2 className="text-2xl font-bold">Sample PDF Content - Page {currentPage}</h2>
            <p className="text-gray-600 italic">
              This is a placeholder for PDF rendering. In production, integrate with your
              backend's PDF URL to display actual content using libraries like react-pdf.
            </p>
            <div className="space-y-3 mt-6">
              <p className="leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod
                tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                quis nostrud exercitation ullamco laboris.
              </p>
              <p className="leading-relaxed">
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum
                dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                proident.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
