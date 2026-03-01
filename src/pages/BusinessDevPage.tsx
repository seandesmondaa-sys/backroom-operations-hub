import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, useConvertLeadToProject } from "@/hooks/use-leads";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, ArrowRightCircle, TrendingUp } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";

const LEAD_STATUSES = ["new", "contacted", "qualified", "proposal", "negotiation", "converted", "lost"];
const DEAL_TYPES = ["equity", "debt", "mezzanine", "grant", "advisory", "other"];
const READINESS_STAGES = ["concept", "early_development", "structuring", "investment_ready", "capital_deployment"];

const readinessLabels: Record<string, string> = {
  concept: "Concept Stage",
  early_development: "Early Development",
  structuring: "Structuring Stage",
  investment_ready: "Investment-Ready",
  capital_deployment: "Capital Deployment",
};

function LeadScoreBadge({ score }: { score: number }) {
  const color = score >= 80 ? "bg-green-500/10 text-green-700" : score >= 50 ? "bg-yellow-500/10 text-yellow-700" : "bg-red-500/10 text-red-700";
  return <span className={`text-xs font-bold px-2 py-0.5 rounded ${color}`}>{score}/100</span>;
}

export default function BusinessDevPage() {
  const { data: leads = [], isLoading } = useLeads();
  const create = useCreateLead();
  const update = useUpdateLead();
  const del = useDeleteLead();
  const convert = useConvertLeadToProject();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openNew = () => { setEditing(null); setForm({}); setDialogOpen(true); };
  const openEdit = (lead: any) => { setEditing(lead); setForm({ ...lead }); setDialogOpen(true); };

  const handleSubmit = () => {
    const { id, created_at, updated_at, created_by, ...fields } = form;
    if (editing) {
      update.mutate({ id: editing.id, fields }, { onSuccess: () => setDialogOpen(false) });
    } else {
      create.mutate(fields, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const activeLeads = leads.filter((l: any) => !["converted", "lost"].includes(l.status));
  const convertedCount = leads.filter((l: any) => l.status === "converted").length;
  const totalPipeline = leads.reduce((sum: number, l: any) => sum + (Number(l.funding_target) || 0), 0);
  const avgScore = leads.length ? Math.round(leads.reduce((sum: number, l: any) => sum + (l.lead_score || 0), 0) / leads.length) : 0;

  return (
    <div>
      <PageHeader title="Business Development" description="Lead management and capital pipeline">
        <Button size="sm" className="h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1.5" /> New Lead</Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Active Leads</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{activeLeads.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Converted</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold text-green-600">{convertedCount}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Pipeline Value</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${totalPipeline.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Avg. Lead Score</CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><p className="text-2xl font-bold">{avgScore}</p><Progress value={avgScore} className="flex-1 h-2" /></div></CardContent></Card>
        </div>

        <Tabs defaultValue="pipeline">
          <TabsList><TabsTrigger value="pipeline">Pipeline</TabsTrigger><TabsTrigger value="all">All Leads</TabsTrigger></TabsList>

          <TabsContent value="pipeline">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {LEAD_STATUSES.map((status) => {
                const items = leads.filter((l: any) => l.status === status);
                return (
                  <div key={status} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{status.replace("_", " ")}</p>
                      <Badge variant="secondary" className="text-[10px]">{items.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {items.map((lead: any) => (
                        <div key={lead.id} className="p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors" onClick={() => openEdit(lead)}>
                          <p className="text-xs font-medium truncate">{lead.name}</p>
                          {lead.company && <p className="text-[10px] text-muted-foreground">{lead.company}</p>}
                          <div className="flex items-center justify-between mt-1">
                            <LeadScoreBadge score={lead.lead_score || 0} />
                            {lead.funding_target > 0 && <span className="text-[10px] text-muted-foreground">${Number(lead.funding_target).toLocaleString()}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="all">
            {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Name</TableHead>
                    <TableHead className="text-xs font-semibold">Company</TableHead>
                    <TableHead className="text-xs font-semibold">Deal Type</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Score</TableHead>
                    <TableHead className="text-xs font-semibold">Readiness</TableHead>
                    <TableHead className="text-xs font-semibold">Target</TableHead>
                    <TableHead className="text-xs font-semibold w-28">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {leads.map((l: any) => (
                      <TableRow key={l.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{l.name}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{l.company || "—"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{l.deal_type}</Badge></TableCell>
                        <TableCell><StatusBadge status={l.status} /></TableCell>
                        <TableCell><LeadScoreBadge score={l.lead_score || 0} /></TableCell>
                        <TableCell className="text-xs">{readinessLabels[l.readiness_stage] || l.readiness_stage}</TableCell>
                        <TableCell className="text-xs font-mono">{l.funding_target ? `$${Number(l.funding_target).toLocaleString()}` : "—"}</TableCell>
                        <TableCell><div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(l)}><Pencil className="h-3.5 w-3.5" /></Button>
                          {l.status !== "converted" && (
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-green-600" title="Convert to project"
                              onClick={() => convert.mutate({ leadId: l.id, leadName: l.name })}><ArrowRightCircle className="h-3.5 w-3.5" /></Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(l.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Lead" : "New Lead"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Name *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label className="text-xs">Company</Label><Input value={form.company || ""} onChange={(e) => setForm({ ...form, company: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Email</Label><Input type="email" value={form.email || ""} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
              <div><Label className="text-xs">Phone</Label><Input value={form.phone || ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Source</Label><Input value={form.source || ""} onChange={(e) => setForm({ ...form, source: e.target.value })} /></div>
              <div><Label className="text-xs">Funding Target ($)</Label><Input type="number" value={form.funding_target || ""} onChange={(e) => setForm({ ...form, funding_target: Number(e.target.value) })} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label className="text-xs">Deal Type</Label>
                <Select value={form.deal_type || "advisory"} onValueChange={(v) => setForm({ ...form, deal_type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{DEAL_TYPES.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status || "new"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEAD_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs">Lead Score (0-100)</Label><Input type="number" min={0} max={100} value={form.lead_score || ""} onChange={(e) => setForm({ ...form, lead_score: Number(e.target.value) })} /></div>
            </div>
            <div><Label className="text-xs">Readiness Stage</Label>
              <Select value={form.readiness_stage || "concept"} onValueChange={(v) => setForm({ ...form, readiness_stage: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{READINESS_STAGES.map((r) => <SelectItem key={r} value={r}>{readinessLabels[r]}</SelectItem>)}</SelectContent>
              </Select></div>
            <div><Label className="text-xs">Notes</Label><Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || create.isPending || update.isPending}>
              {editing ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
