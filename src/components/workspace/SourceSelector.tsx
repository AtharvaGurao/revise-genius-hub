import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, Search, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { pdfjs } from "react-pdf";

// Set up the worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDF {
  id: string;
  title: string;
  pages: number;
  uploadedAt: Date;
}


interface SourceSelectorProps {
  selectedPdfId: string | null;
  onSelectPdf: (id: string | null) => void;
  onPdfSentToWebhook?: () => void;
}

const SourceSelector = ({
  selectedPdfId,
  onSelectPdf,
  onPdfSentToWebhook,
}: SourceSelectorProps) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pdfToDelete, setPdfToDelete] = useState<PDF | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPdfs();
  }, []);

  const fetchPdfs = async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const { data, error } = await supabase
        .from("pdfs")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;

      setPdfs(
        data.map((pdf) => ({
          id: pdf.id,
          title: pdf.title,
          pages: pdf.pages,
          uploadedAt: new Date(pdf.uploaded_at),
        }))
      );
    } catch (error) {
      console.error("Error fetching PDFs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF file.",
        variant: "destructive",
      });
      e.target.value = "";
      return;
    }

    toast({
      title: "Uploading PDF...",
      description: "Please wait while we process your file.",
    });

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        toast({
          title: "Authentication required",
          description: "Please sign in to upload PDFs.",
          variant: "destructive",
        });
        e.target.value = "";
        return;
      }

      const userId = session.session.user.id;
      const fileName = `${userId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Read the file to compute total pages
      let detectedPages = 0;
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        detectedPages = doc.numPages;
      } catch (err) {
        console.warn("Could not determine page count during upload:", err);
      }

      // Create database record with detected page count
      const { data: pdfData, error: dbError } = await supabase
        .from("pdfs")
        .insert({
          user_id: userId,
          title: file.name.replace(".pdf", ""),
          file_path: fileName,
          pages: detectedPages,
          file_size: file.size,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const newPdf: PDF = {
        id: pdfData.id,
        title: pdfData.title,
        pages: pdfData.pages,
        uploadedAt: new Date(pdfData.uploaded_at),
      };

      setPdfs([newPdf, ...pdfs]);
      onSelectPdf(newPdf.id);

      toast({
        title: "PDF uploaded successfully",
        description: `"${newPdf.title}" is now available in your library.`,
      });
      
      e.target.value = "";
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload PDF. Please try again.",
        variant: "destructive",
      });
      e.target.value = "";
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, pdfId: string) => {
    e.stopPropagation(); // Prevent PDF selection when clicking delete
    const pdf = pdfs.find(p => p.id === pdfId);
    if (pdf) {
      setPdfToDelete(pdf);
      setDeleteDialogOpen(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!pdfToDelete) return;

    try {
      const { data: pdfData, error: fetchError } = await supabase
        .from("pdfs")
        .select("file_path")
        .eq("id", pdfToDelete.id)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from("pdfs")
        .remove([pdfData.file_path]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from("pdfs")
        .delete()
        .eq("id", pdfToDelete.id);

      if (dbError) throw dbError;

      // Update local state
      setPdfs(pdfs.filter((pdf) => pdf.id !== pdfToDelete.id));
      
      // Clear selection if deleted PDF was selected
      if (selectedPdfId === pdfToDelete.id) {
        onSelectPdf(null);
      }

      toast({
        title: "PDF deleted",
        description: `"${pdfToDelete.title}" has been removed from your library.`,
      });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error.message || "Could not delete PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPdfToDelete(null);
    }
  };

  const validateWebhookResponse = (data: any): boolean => {
    console.log("🔍 Validating webhook response:", data);
    if (!data || typeof data !== 'object') {
      console.error("❌ Invalid response: not an object", data);
      return false;
    }
    // Check for recommendations.videos structure
    if (!data.recommendations || !Array.isArray(data.recommendations.videos)) {
      console.error("❌ Invalid response: recommendations.videos is not an array", data);
      return false;
    }
    // Validate each video has required fields
    const isValid = data.recommendations.videos.every((video: any) => 
      video.title && 
      video.channel_name && 
      video.thumbnail_url && 
      video.video_url && 
      video.embed_url
    );
    console.log(isValid ? "✅ Validation passed" : "❌ Validation failed - missing required fields");
    return isValid;
  };

  const sendPdfToWebhook = async (pdf: PDF) => {
    console.log("🚀 Starting webhook process for PDF:", pdf.title);
    
    // Show loading toast
    toast({
      title: "Analyzing PDF...",
      description: "Sending to analysis service and fetching video recommendations.",
    });

    try {
      // Get the PDF file from Supabase storage
      console.log("📥 Fetching PDF from storage...");
      const { data: pdfData } = await supabase
        .from("pdfs")
        .select("file_path")
        .eq("id", pdf.id)
        .single();

      if (!pdfData) throw new Error("PDF not found");

      // Download the PDF file as a blob
      const { data: fileBlob, error: downloadError } = await supabase.storage
        .from("pdfs")
        .download(pdfData.file_path);

      if (downloadError) throw downloadError;
      console.log("✅ PDF downloaded successfully");

      // Compute total pages if not set (or if outdated)
      try {
        const arrayBuffer = await fileBlob.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const doc = await loadingTask.promise;
        const numPages = doc.numPages;
        if (pdf.pages !== numPages) {
          setPdfs((prev) =>
            prev.map((p) => (p.id === pdf.id ? { ...p, pages: numPages } : p))
          );
        }
      } catch (err) {
        console.warn("Could not determine page count:", err);
      }

      // Create FormData and append the file
      const formData = new FormData();
      formData.append("file", fileBlob, `${pdf.title}.pdf`);

      // Send to primary n8n webhook
      console.log("📤 Sending to primary webhook...");
      const response = await fetch("https://n8n.srv1116237.hstgr.cloud/webhook/smartrevise", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Primary webhook returned status ${response.status}`);
      }
      console.log("✅ Primary webhook successful");

      // Also send to analyze-pdf webhook and capture response
      const formData2 = new FormData();
      formData2.append("file", fileBlob, `${pdf.title}.pdf`);
      
      console.log("📤 Sending to analyze-pdf webhook...");
      const analyzeResponse = await fetch("https://n8n.srv1116237.hstgr.cloud/webhook/analyze-pdf", {
        method: "POST",
        body: formData2,
      });
      
      console.log("📊 Analyze webhook response status:", analyzeResponse.status);
      
      if (!analyzeResponse.ok) {
        throw new Error(`Analyze webhook returned status ${analyzeResponse.status}`);
      }
      
      const webhookData = await analyzeResponse.json();
      console.log("📦 Raw webhook response:", webhookData);
      
      // Validate response structure
      if (!validateWebhookResponse(webhookData)) {
        throw new Error("Invalid webhook response format");
      }
      
      console.log(`✅ Received ${webhookData.recommendations.videos.length} video recommendations`);
      
      // Transform webhook data to match app's expected format
      const transformedData = {
        videos: webhookData.recommendations.videos.map((video: any) => ({
          video_title: video.title,
          channel_name: video.channel_name,
          thumbnail: video.thumbnail_url,
          description: video.description,
          published_date: video.published_at,
          video_url: video.video_url,
          embed_url: video.embed_url
        }))
      };
      
      // Store the transformed response for YouTubeRecommender
      localStorage.setItem('youtube-webhook-data', JSON.stringify(transformedData));
      console.log("💾 Stored transformed data in localStorage");
      
      // Trigger a storage event for other components to react
      window.dispatchEvent(new Event('youtube-data-updated'));
      console.log("📢 Dispatched youtube-data-updated event");

      toast({
        title: "Analysis complete!",
        description: `Found ${transformedData.videos.length} video recommendations for "${pdf.title}".`,
      });
      
      // Notify parent to switch to chat tab
      onPdfSentToWebhook?.();
    } catch (error: any) {
      console.error("❌ Webhook error:", error);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePdfSelect = async (pdfId: string) => {
    const newSelectedId = pdfId === selectedPdfId ? null : pdfId;
    onSelectPdf(newSelectedId);

    // Send to webhook when a PDF is selected (not when deselecting)
    if (newSelectedId) {
      const pdf = pdfs.find(p => p.id === pdfId);
      if (pdf) {
        await sendPdfToWebhook(pdf);
      }
    }
  };

  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 space-y-4">
        <p className="text-muted-foreground text-sm">
          Select a PDF to View, Chat, or Generate Quizzes
        </p>

        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
        <Button
          onClick={() => document.getElementById('pdf-upload')?.click()}
          disabled={loading}
          className="w-full h-12 text-base"
        >
          <Upload className="h-5 w-5 mr-2" />
          Upload PDF
        </Button>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search PDFs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 rounded-xl border-2"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-6">
        <div className="space-y-3 pb-6">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading PDFs...
            </p>
          ) : filteredPdfs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No PDFs found. Upload one to get started!
            </p>
          ) : (
            filteredPdfs.map((pdf) => (
              <div
                key={pdf.id}
                className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                  selectedPdfId === pdf.id
                    ? "bg-primary/10 border-primary"
                    : "hover:bg-muted/50 border-border"
                }`}
                onClick={() => handlePdfSelect(pdf.id)}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className="h-6 w-6 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pdf.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {pdf.pages} pages
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => handleDeleteClick(e, pdf.id)}
                  className="h-9 w-9 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete PDF</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{pdfToDelete?.title}"? This action cannot be undone and will permanently remove the PDF from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SourceSelector;
