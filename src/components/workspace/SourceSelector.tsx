import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";

interface PDF {
  id: string;
  title: string;
  pages: number;
  uploadedAt: Date;
}


interface SourceSelectorProps {
  selectedPdfId: string | null;
  onSelectPdf: (id: string | null) => void;
  scope: "all" | "selected";
  onScopeChange: (scope: "all" | "selected") => void;
}

const SourceSelector = ({
  selectedPdfId,
  onSelectPdf,
  scope,
  onScopeChange,
}: SourceSelectorProps) => {
  const [pdfs, setPdfs] = useState<PDF[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
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
        return;
      }

      const userId = session.session.user.id;
      const fileName = `${userId}/${Date.now()}-${file.name}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from("pdfs")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: pdfData, error: dbError } = await supabase
        .from("pdfs")
        .insert({
          user_id: userId,
          title: file.name.replace(".pdf", ""),
          file_path: fileName,
          pages: 0, // Will be updated after processing
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
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Could not upload PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Scope Selector */}
      <div>
        <Label className="text-sm font-semibold mb-2 block">Quiz Scope</Label>
        <RadioGroup value={scope} onValueChange={(v) => onScopeChange(v as any)}>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="all" id="scope-all" />
            <Label htmlFor="scope-all" className="cursor-pointer">
              All PDFs
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="selected" id="scope-selected" />
            <Label htmlFor="scope-selected" className="cursor-pointer">
              Selected PDF Only
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Upload Button */}
      <div>
        <Label htmlFor="pdf-upload" className="cursor-pointer">
          <Button className="w-full" asChild>
            <span>
              <Upload className="h-4 w-4 mr-2" />
              Upload PDF
            </span>
          </Button>
        </Label>
        <Input
          id="pdf-upload"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search PDFs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* PDF List */}
      <ScrollArea className="h-[300px] sm:h-[400px]">
        <div className="space-y-2">
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
              <Card
                key={pdf.id}
                className={`p-3 cursor-pointer transition-colors hover:bg-accent/50 ${
                  selectedPdfId === pdf.id ? "bg-accent border-primary" : ""
                }`}
                onClick={() => onSelectPdf(pdf.id === selectedPdfId ? null : pdf.id)}
              >
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{pdf.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {pdf.pages} pages
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default SourceSelector;
