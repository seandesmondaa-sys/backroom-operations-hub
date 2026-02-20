import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useInvestorContacts, useCreateInvestorContact, useUpdateInvestorContact, useDeleteInvestorContact } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { InvestorContact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fields: FieldDef[] = [
  { key: "Name", label: "Name", type: "text", required: true },
  { key: "Email", label: "Email", type: "text" },
  { key: "Phone", label: "Phone", type: "text" },
  { key: "Role", label: "Role", type: "text" },
];

export default function InvestorContactsPage() {
  const { data: contacts = [], isLoading } = useInvestorContacts();
  const create = useCreateInvestorContact();
  const update = useUpdateInvestorContact();
  const del = useDeleteInvestorContact();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<InvestorContact | null>(null);

  const handleSubmit = (f: Record<string, unknown>) => {
    if (editing) update.mutate({ id: editing.id, fields: f }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    else create.mutate(f, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <div>
      <PageHeader title="Investor Contacts" description="Contact directory">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Contact</Button>
      </PageHeader>
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Name</TableHead>
                <TableHead className="text-xs font-semibold">Email</TableHead>
                <TableHead className="text-xs font-semibold">Phone</TableHead>
                <TableHead className="text-xs font-semibold">Role</TableHead>
                <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {contacts.map((c) => (
                  <TableRow key={c.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{String(c.Name || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(c.Email || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(c.Phone || "")}</TableCell>
                    <TableCell className="text-sm">{String(c.Role || "")}</TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(c); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Contact" : "New Contact"} fields={fields} initialValues={editing || undefined} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} />
    </div>
  );
}
