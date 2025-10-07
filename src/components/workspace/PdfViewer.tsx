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
  const [totalPages, setTotalPages] = useState(120);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // In production, fetch PDF metadata and URL when pdfId changes
  // useEffect(() => {
  //   if (!pdfId) return;
  //   const fetchPdfData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pdf/${pdfId}`);
  //       const data = await response.json();
  //       setPdfUrl(data.url);
  //       setTotalPages(data.pages);
  //     } catch (error) {
  //       console.error('Failed to load PDF:', error);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };
  //   fetchPdfData();
  // }, [pdfId]);

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
          {/* 
            In production, render actual PDF using react-pdf or pdf.js:
            
            import { Document, Page } from 'react-pdf';
            
            <Document file={pdfUrl} onLoadSuccess={({ numPages }) => setTotalPages(numPages)}>
              <Page pageNumber={currentPage} scale={zoom / 100} />
            </Document>
          */}
          <div className="p-8 space-y-4 text-gray-800">
            <div className="flex items-center justify-between border-b pb-4">
              <h2 className="text-2xl font-bold">NCERT Physics Class XI</h2>
              <span className="text-sm text-gray-500">Page {currentPage} of {totalPages}</span>
            </div>
            
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> This is a placeholder PDF viewer. In production, this will render actual PDF content from <code className="bg-blue-100 px-2 py-0.5 rounded">{`\${VITE_API_BASE_URL}/pdf/${pdfId}`}</code>
              </p>
            </div>

            <h3 className="text-xl font-semibold mt-6">Chapter 3: Motion in a Straight Line</h3>
            
            <div className="space-y-4">
              <p className="leading-relaxed">
                <strong>3.1 Introduction</strong>
              </p>
              <p className="leading-relaxed">
                Motion is one of the most fundamental concepts in physics. When we describe the motion of an object, we specify how its position changes with time. The simplest case of motion is that of a particle moving along a straight line.
              </p>
              
              <p className="leading-relaxed">
                <strong>3.2 Position and Displacement</strong>
              </p>
              <p className="leading-relaxed">
                To describe motion, we need to specify the position of the object. Position is the location of the particle with respect to a chosen reference point, considered to be the origin of the coordinate system.
              </p>

              <div className="bg-gray-100 p-4 rounded-lg my-4">
                <p className="font-semibold mb-2">Key Concepts:</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Displacement is a vector quantity</li>
                  <li>Distance is a scalar quantity</li>
                  <li>Velocity = Displacement / Time</li>
                  <li>Speed = Distance / Time</li>
                </ul>
              </div>

              <p className="leading-relaxed">
                The displacement of a particle is the change in its position. If a particle moves from position x₁ to position x₂, its displacement Δx is given by: Δx = x₂ - x₁
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PdfViewer;
