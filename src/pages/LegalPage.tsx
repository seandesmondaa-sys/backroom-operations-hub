import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useContracts, useCreateContract, useUpdateContract, useDeleteContract, useComplianceItems, useCreateComplianceItem, useToggleComplianceItem } from "@/hooks/use-contracts";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, CheckCircle2, Circle, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays, parseISO } from "date-fns";

const CONTRACT_STATUSES = ["draft", "review", "pending_approval", "active", "expired", "terminated"];
const CONTRACT_TYPES = ["nda", "service_agreement", "investment_agreement", "mou", "consulting", "employment", "other"];

const typeLabels: Record<string, string> = {
  nda: "NDA", service_agreement: "Service Agreement", investment_agreement: "Investment Agreement",
  mou: "MOU", consulting: "Consulting", employment: "Employment", other: "Other",
};

export default function LegalPage() {
  const { data: contracts = [], isLoading } = useContracts();
  const create = useCreateContract();
  const update = useUpdateContract();
  const del = useDeleteContract();
  const { data: complianceItems = [] } = useComplianceItems();
  const createCompliance = useCreateComplianceItem();
  const toggleCompliance = useToggleComplianceItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [compForm, setCompForm] = useState({ title: "", category: "general" });

  const openNew = () => { setEditing(null); setForm({}); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ ...c }); setDialogOpen(true); };

  const handleSubmit = () => {
    const { id, created_at, updated_at, created_by, approved_by, approved_at, ...fields } = form;
    if (editing) update.mutate({ id: editing.id, fields }, { onSuccess: () => setDialogOpen(false) });
    else create.mutate(fields, { onSuccess: () => setDialogOpen(false) });
  };

  const activeContracts = contracts.filter((c: any) => c.status === "active");
  const expiringContracts = contracts.filter((c: any) => {
    if (!c.end_date || c.status !== "active") return false;
    return differenceInDays(parseISO(c.end_date), new Date()) <= 30;
  });
  const totalValue = contracts.reduce((s: number, c: any) => s + (Number(c.value) || 0), 0);
  const completedCompliance = complianceItems.filter((i: any) => i.is_completed).length;

  return (
    <div>
      <PageHeader title="Legal & Compliance" description="Contracts, NDAs, and regulatory compliance">
        <Button size="sm" className="h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1.5" /> New Contract</Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Active Contracts</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{activeContracts.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Expiring Soon</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-yellow-600">{expiringContracts.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Value</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${totalValue.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Compliance</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{completedCompliance}/{complianceItems.length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="contracts">
          <TabsList><TabsTrigger value="contracts">Contracts</TabsTrigger><TabsTrigger value="compliance">Compliance Checklist</TabsTrigger></TabsList>

          <TabsContent value="contracts">
            {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Title</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Counterparty</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">End Date</TableHead>
                    <TableHead className="text-xs font-semibold">Value</TableHead>
                    <TableHead className="text-xs font-semibold">V.</TableHead>
                    <TableHead className="text-xs font-semibold w-24">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {contracts.map((c: any) => {
                      const expiring = c.end_date && c.status === "active" && differenceInDays(parseISO(c.end_date), new Date()) <= 30;
                      return (
                        <TableRow key={c.id} className={`hover:bg-muted/30 ${expiring ? "bg-yellow-500/5" : ""}`}>
                          <TableCell className="text-sm font-medium"><div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-muted-foreground" />{c.title}</div></TableCell>
                          <TableCell><Badge variant="outline" className="text-[10px]">{typeLabels[c.contract_type] || c.contract_type}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{c.counterparty || "—"}</TableCell>
                          <TableCell><StatusBadge status={c.status} /></TableCell>
                          <TableCell className="text-xs font-mono">{c.end_date ? format(parseISO(c.end_date), "MMM d, yyyy") : "—"}{expiring && <Badge variant="destructive" className="ml-1 text-[9px]">Expiring</Badge>}</TableCell>
                          <TableCell className="text-xs font-mono">{c.value ? `$${Number(c.value).toLocaleString()}` : "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">v{c.version}</TableCell>
                          <TableCell><div className="flex gap-1">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="compliance">
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input placeholder="New compliance item..." value={compForm.title} onChange={(e) => setCompForm({ ...compForm, title: e.target.value })} className="max-w-md" />
                <Select value={compForm.category} onValueChange={(v) => setCompForm({ ...compForm, category: v })}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["general", "regulatory", "contractual", "financial", "data_privacy"].map((c) => (
                      <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" onClick={() => { if (compForm.title) createCompliance.mutate(compForm); setCompForm({ title: "", category: "general" }); }}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-1">
                {complianceItems.map((item: any) => (
                  <div key={item.id} className={`flex items-center gap-3 p-2 rounded-md hover:bg-muted/30 ${item.is_completed ? "opacity-60" : ""}`}>
                    <button onClick={() => toggleCompliance.mutate({ id: item.id, completed: !item.is_completed })}>
                      {item.is_completed ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Circle className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    <span className={`text-sm flex-1 ${item.is_completed ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
                    <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                  </div>
                ))}
                {complianceItems.length === 0 && <p className="text-sm text-muted-foreground py-8 text-center">No compliance items yet</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Contract" : "New Contract"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Title *</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label>
                <Select value={form.contract_type || "other"} onValueChange={(v) => setForm({ ...form, contract_type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRACT_TYPES.map((t) => <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status || "draft"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CONTRACT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Counterparty</Label><Input value={form.counterparty || ""} onChange={(e) => setForm({ ...form, counterparty: e.target.value })} /></div>
              <div><Label className="text-xs">Value ($)</Label><Input type="number" value={form.value || ""} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.title || create.isPending || update.isPending}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
