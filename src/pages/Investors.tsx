import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useInvestors, useCreateInvestor, useUpdateInvestor, useDeleteInvestor } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { Investor } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const investorFields: FieldDef[] = [
  { key: "Name", label: "Name", type: "text", required: true },
  { key: "Firm", label: "Firm", type: "text" },
  { key: "Type", label: "Type", type: "select", options: ["LP", "Co-Invest", "Strategic"] },
  { key: "Notes", label: "Notes", type: "textarea" },
];

export default function Investors() {
  const { data: investors = [], isLoading } = useInvestors();
  const create = useCreateInvestor();
  const update = useUpdateInvestor();
  const del = useDeleteInvestor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Investor | null>(null);

  const handleSubmit = (fields: Record<string, unknown>) => {
    if (editing) {
      update.mutate({ id: editing.id, fields }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      create.mutate(fields, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div>
      <PageHeader title="Investors" description="Investor directory">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Investor
        </Button>
      </PageHeader>

      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Firm</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Notes</TableHead>
                  <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{String(inv.Name || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(inv.Firm || "")}</TableCell>
                    <TableCell><span className="text-[11px] font-mono text-muted-foreground">{String(inv.Type || "")}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{String(inv.Notes || "")}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(inv); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(inv.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Investor" : "New Investor"} fields={investorFields} initialValues={editing || undefined} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} />
    </div>
  );
}
