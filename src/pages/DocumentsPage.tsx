import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useDocuments, useUploadDocument, useDeleteDocument, getDocumentDownloadUrl } from "@/hooks/use-documents";
import { useDepartments } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Upload, FileText, Trash2, Download, File, Image, FileSpreadsheet, FileArchive,
} from "lucide-react";
import { format } from "date-fns";

function fileIcon(mime: string | null) {
  if (!mime) return File;
  if (mime.startsWith("image/")) return Image;
  if (mime.includes("spreadsheet") || mime.includes("csv") || mime.includes("excel")) return FileSpreadsheet;
  if (mime.includes("zip") || mime.includes("archive")) return FileArchive;
  return FileText;
}

function fileSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const { data: documents = [], isLoading } = useDocuments();
  const { data: departments = [] } = useDepartments();
  const uploadDoc = useUploadDocument();
  const deleteDoc = useDeleteDocument();
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [tagInput, setTagInput] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      if (!name) setName(f.name);
    }
  };

  const handleUpload = () => {
    if (!file || !name) return;
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean);
    uploadDoc.mutate(
      { file, name, description, department_id: departmentId || null, tags },
      {
        onSuccess: () => {
          toast.success("Document uploaded");
          setOpen(false);
          setFile(null);
          setName("");
          setDescription("");
          setDepartmentId("");
          setTagInput("");
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  const handleDownload = async (filePath: string, fileName: string) => {
    const url = await getDocumentDownloadUrl(filePath);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("Failed to generate download link");
    }
  };

  const handleDelete = (id: string, filePath: string) => {
    deleteDoc.mutate({ id, file_path: filePath }, {
      onSuccess: () => toast.success("Document deleted"),
      onError: (e) => toast.error(e.message),
    });
  };

  return (
    <div>
      <PageHeader title="Documents" description="Secure document management with version tracking" />
      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Upload Document</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Upload Document</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {file ? file.name : "Click to select a file"}
                  </p>
                  {file && <p className="text-xs text-muted-foreground mt-1">{fileSize(file.size)}</p>}
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                </div>
                <Input placeholder="Document name" value={name} onChange={(e) => setName(e.target.value)} />
                <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px]" />
                <Select value={departmentId} onValueChange={setDepartmentId}>
                  <SelectTrigger><SelectValue placeholder="Department (optional)" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No department</SelectItem>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="Tags (comma-separated)" value={tagInput} onChange={(e) => setTagInput(e.target.value)} />
                <Button onClick={handleUpload} disabled={uploadDoc.isPending || !file || !name} className="w-full">
                  {uploadDoc.isPending ? "Uploading…" : "Upload"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? <Skeleton className="h-96 w-full rounded-lg" /> : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold w-10" />
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Tags</TableHead>
                  <TableHead className="text-xs font-semibold">Size</TableHead>
                  <TableHead className="text-xs font-semibold">Version</TableHead>
                  <TableHead className="text-xs font-semibold">Uploaded By</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                  <TableHead className="text-xs font-semibold w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => {
                  const Icon = fileIcon(doc.mime_type);
                  return (
                    <TableRow key={doc.id}>
                      <TableCell><Icon className="h-4 w-4 text-muted-foreground" /></TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">{doc.name}</p>
                          {doc.description && <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">{doc.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {doc.tags.map((t) => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{fileSize(doc.file_size)}</TableCell>
                      <TableCell className="text-xs font-mono">v{doc.version}</TableCell>
                      <TableCell className="text-xs">{doc.uploader_name}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">
                        {format(new Date(doc.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleDownload(doc.file_path, doc.name)}>
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(doc.id, doc.file_path)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {documents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-12">
                      No documents yet. Upload your first document.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
