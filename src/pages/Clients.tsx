import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useClients, useCreateClient, useUpdateClient, useDeleteClient } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { Client } from "@/lib/types";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const clientFields: FieldDef[] = [
  { key: "Name", label: "Name", type: "text", required: true },
  { key: "Type", label: "Type", type: "select", options: ["Sponsor", "Client"] },
  { key: "Industry", label: "Industry", type: "text" },
  { key: "Contact Name", label: "Contact Name", type: "text" },
  { key: "Contact Email", label: "Contact Email", type: "text" },
  { key: "Status", label: "Status", type: "select", options: ["Active", "Inactive", "Prospect"] },
];

export default function Clients() {
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const updateClient = useUpdateClient();
  const deleteClient = useDeleteClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);

  const handleSubmit = (fields: Record<string, unknown>) => {
    if (editing) {
      updateClient.mutate({ id: editing.id, fields }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      createClient.mutate(fields, { onSuccess: () => setDialogOpen(false) });
    }
  };

  return (
    <div>
      <PageHeader title="Sponsors / Clients" description="Client directory">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Client
        </Button>
      </PageHeader>

      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Industry</TableHead>
                  <TableHead className="text-xs font-semibold">Contact</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{String(c.Name || "")}</TableCell>
                    <TableCell><span className="text-[11px] font-mono text-muted-foreground">{String(c.Type || "")}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(c.Industry || "")}</TableCell>
                    <TableCell>
                      <p className="text-sm">{String(c["Contact Name"] || "")}</p>
                      <p className="text-[11px] text-muted-foreground">{String(c["Contact Email"] || "")}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={String(c.Status || "")} /></TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(c); setDialogOpen(true); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => deleteClient.mutate(c.id)}>
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

      <RecordDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editing ? "Edit Client" : "New Client"}
        fields={clientFields}
        initialValues={editing || undefined}
        onSubmit={handleSubmit}
        isLoading={createClient.isPending || updateClient.isPending}
      />
    </div>
  );
}
