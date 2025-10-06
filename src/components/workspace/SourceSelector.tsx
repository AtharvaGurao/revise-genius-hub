import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Search, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface PDF {
  id: string;
  title: string;
  pages: number;
  uploadedAt: Date;
}

// Mock sample PDFs - in production, these come from backend
const samplePDFs: PDF[] = [
  { id: "sample-1", title: "NCERT Physics Class XI - Chapter 1-5", pages: 120, uploadedAt: new Date() },
  { id: "sample-2", title: "NCERT Physics Class XI - Chapter 6-10", pages: 115, uploadedAt: new Date() },
  { id: "sample-3", title: "NCERT Chemistry Class XII - Organic", pages: 98, uploadedAt: new Date() },
];

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
  const [pdfs, setPdfs] = useState<PDF[]>(samplePDFs);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

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

    // In production, this would call:
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/pdf/upload`, {
    //   method: 'POST',
    //   body: formData
    // });
    // const data = await response.json();

    const newPdf: PDF = {
      id: `pdf-${Date.now()}`,
      title: file.name.replace(".pdf", ""),
      pages: Math.floor(Math.random() * 200) + 50, // Mock
      uploadedAt: new Date(),
    };

    setPdfs([newPdf, ...pdfs]);
    toast({
      title: "PDF uploaded successfully",
      description: `"${newPdf.title}" is now available in your library.`,
    });
  };

  const filteredPdfs = pdfs.filter((pdf) =>
    pdf.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
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
      <ScrollArea className="h-[400px]">
        <div className="space-y-2">
          {filteredPdfs.length === 0 ? (
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
