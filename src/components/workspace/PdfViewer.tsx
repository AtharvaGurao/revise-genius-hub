import { useState, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  FileText,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  pdfId: string | null;
}

const PdfViewer = ({ pdfId }: PdfViewerProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pdfTitle, setPdfTitle] = useState("");
  const { toast } = useToast();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setTotalPages(numPages);
    setCurrentPage(1);
  };

  // Fetch PDF data when pdfId changes
  useEffect(() => {
    if (!pdfId) {
      setPdfUrl(null);
      return;
    }

    const fetchPdfData = async () => {
      setIsLoading(true);
      try {
        // Get PDF metadata
        const { data: pdfData, error: pdfError } = await supabase
          .from('pdfs')
          .select('*')
          .eq('id', pdfId)
          .single();

        if (pdfError) throw pdfError;

        setPdfTitle(pdfData.title);

        // Get signed URL for the PDF file
        const { data: urlData, error: urlError } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(pdfData.file_path, 3600); // 1 hour expiry

        if (urlError) throw urlError;

        // Use absolute URL if returned, otherwise prefix with storage path
        const signed = urlData.signedUrl;
        const fullPdfUrl = signed.startsWith('http')
          ? signed
          : `${import.meta.env.VITE_SUPABASE_URL}/storage/v1${signed}`;
        setPdfUrl(fullPdfUrl);
      } catch (error: any) {
        console.error('Failed to load PDF:', error);
        toast({
          title: "Failed to load PDF",
          description: error.message || "Could not load the PDF file.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdfData();
  }, [pdfId, toast]);

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
      <div className="h-full flex items-center justify-center p-6 bg-background">
        <div className="text-center max-w-md space-y-6">
          <div className="w-20 h-20 mx-auto bg-muted rounded-2xl flex items-center justify-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-heading font-bold text-2xl mb-3">
              No PDF Selected
            </h3>
            <p className="text-muted-foreground">
              Select a PDF from the library on the left, or upload a new one to get started.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
          <p className="text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="bg-card border-b px-2 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 flex-wrap">
        {/* Page Navigation */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <form onSubmit={handlePageJump} className="flex items-center gap-1 sm:gap-2">
            <Input
              name="page"
              type="number"
              min={1}
              max={totalPages}
              defaultValue={currentPage}
              className="w-12 sm:w-16 text-center text-xs sm:text-sm h-8 sm:h-9"
            />
            <span className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">/ {totalPages}</span>
          </form>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
            className="h-8 w-8 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomOut} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          <span className="text-xs sm:text-sm font-medium min-w-[3rem] sm:min-w-[4rem] text-center">
            {zoom}%
          </span>
          <Button variant="outline" size="icon" onClick={handleZoomIn} className="h-8 w-8 sm:h-9 sm:w-9">
            <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>

      {/* PDF Canvas */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 bg-gray-100 flex items-center justify-center">
        {pdfUrl ? (
          <Document
            file={pdfUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary" />
                <p className="text-muted-foreground">Loading PDF...</p>
              </div>
            }
            error={
              <div className="text-center space-y-4 max-w-md px-4">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">
                  Unable to load PDF. Please try uploading again.
                </p>
              </div>
            }
          >
            <Page
              pageNumber={currentPage}
              scale={zoom / 100}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="shadow-lg"
            />
          </Document>
        ) : (
          <div className="text-center space-y-4 max-w-md px-4">
            <FileText className="h-16 w-16 mx-auto text-muted-foreground" />
            <p className="text-muted-foreground">
              Unable to load PDF. Please try uploading again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfViewer;
