import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useOutreach, useCreateOutreach, useUpdateOutreach, useDeleteOutreach } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { Outreach as OutreachType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fields: FieldDef[] = [
  { key: "Subject", label: "Subject", type: "text", required: true },
  { key: "Type", label: "Type", type: "select", options: ["Email", "Call", "Meeting"] },
  { key: "Date", label: "Date", type: "date" },
  { key: "Status", label: "Status", type: "select", options: ["Scheduled", "Completed", "Cancelled", "No Show"] },
  { key: "Notes", label: "Notes", type: "textarea" },
];

export default function OutreachPage() {
  const { data: records = [], isLoading } = useOutreach();
  const create = useCreateOutreach();
  const update = useUpdateOutreach();
  const del = useDeleteOutreach();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OutreachType | null>(null);

  const handleSubmit = (f: Record<string, unknown>) => {
    if (editing) update.mutate({ id: editing.id, fields: f }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    else create.mutate(f, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <div>
      <PageHeader title="Outreach" description="Meetings and communications">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add</Button>
      </PageHeader>
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Subject</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Date</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{String(r.Subject || "")}</TableCell>
                    <TableCell><span className="text-[11px] font-mono text-muted-foreground">{String(r.Type || "")}</span></TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{String(r.Date || "")}</TableCell>
                    <TableCell><StatusBadge status={String(r.Status || "")} /></TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(r); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Outreach" : "New Outreach"} fields={fields} initialValues={editing || undefined} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} />
    </div>
  );
}
