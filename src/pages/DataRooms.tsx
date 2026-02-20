import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useDocuments } from "@/hooks/use-airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function DataRooms() {
  const { data: documents = [], isLoading } = useDocuments();

  return (
    <div>
      <PageHeader title="Data Rooms" description="Documents across all projects" />
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Document</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Version</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Uploaded By</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((d) => (
                  <TableRow key={d.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium font-mono">{String(d.Name || "")}</TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{String(d.Type || "")}</TableCell>
                    <TableCell className="text-sm font-mono">{String(d.Version || "")}</TableCell>
                    <TableCell><StatusBadge status={String(d.Status || "")} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(d["Uploaded By"] || "")}</TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{String(d["Uploaded At"] || "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
