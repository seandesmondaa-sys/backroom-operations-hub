import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTeam, useCreateTeamMember, useUpdateTeamMember, useDeleteTeamMember } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { TeamMember } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fields: FieldDef[] = [
  { key: "Name", label: "Name", type: "text", required: true },
  { key: "Email", label: "Email", type: "text" },
  { key: "Role", label: "Role", type: "text" },
  { key: "Department", label: "Department", type: "text" },
  { key: "Status", label: "Status", type: "select", options: ["Active", "Inactive"] },
];

export default function TeamPage() {
  const { data: team = [], isLoading } = useTeam();
  const create = useCreateTeamMember();
  const update = useUpdateTeamMember();
  const del = useDeleteTeamMember();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<TeamMember | null>(null);

  const handleSubmit = (f: Record<string, unknown>) => {
    if (editing) update.mutate({ id: editing.id, fields: f }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    else create.mutate(f, { onSuccess: () => setDialogOpen(false) });
  };

  return (
    <div>
      <PageHeader title="Team" description="Team members">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Member</Button>
      </PageHeader>
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader><TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Name</TableHead>
                <TableHead className="text-xs font-semibold">Email</TableHead>
                <TableHead className="text-xs font-semibold">Role</TableHead>
                <TableHead className="text-xs font-semibold">Department</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {team.map((m) => (
                  <TableRow key={m.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{String(m.Name || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(m.Email || "")}</TableCell>
                    <TableCell className="text-sm">{String(m.Role || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{String(m.Department || "")}</TableCell>
                    <TableCell><StatusBadge status={String(m.Status || "")} /></TableCell>
                    <TableCell><div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(m); setDialogOpen(true); }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(m.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Member" : "New Member"} fields={fields} initialValues={editing || undefined} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} />
    </div>
  );
}
