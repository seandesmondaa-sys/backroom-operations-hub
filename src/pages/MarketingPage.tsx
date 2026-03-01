import { useState, useRef } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useCampaigns, useCreateCampaign, useUpdateCampaign, useDeleteCampaign, useMediaAssets, useUploadMediaAsset } from "@/hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2, Upload, Image } from "lucide-react";
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

const CAMPAIGN_STATUSES = ["planned", "active", "paused", "completed", "cancelled"];
const CAMPAIGN_TYPES = ["general", "email", "social_media", "event", "content", "advertising", "pr"];

export default function MarketingPage() {
  const { data: campaigns = [], isLoading } = useCampaigns();
  const create = useCreateCampaign();
  const update = useUpdateCampaign();
  const del = useDeleteCampaign();
  const { data: assets = [] } = useMediaAssets();
  const uploadAsset = useUploadMediaAsset();
  const fileRef = useRef<HTMLInputElement>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});

  const openNew = () => { setEditing(null); setForm({}); setDialogOpen(true); };
  const openEdit = (c: any) => { setEditing(c); setForm({ ...c }); setDialogOpen(true); };

  const handleSubmit = () => {
    const { id, created_at, updated_at, created_by, ...fields } = form;
    if (editing) update.mutate({ id: editing.id, fields }, { onSuccess: () => setDialogOpen(false) });
    else create.mutate(fields, { onSuccess: () => setDialogOpen(false) });
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    uploadAsset.mutate({ file, name: file.name });
    e.target.value = "";
  };

  const activeCampaigns = campaigns.filter((c: any) => c.status === "active");
  const totalBudget = campaigns.reduce((s: number, c: any) => s + (Number(c.budget) || 0), 0);
  const totalSpent = campaigns.reduce((s: number, c: any) => s + (Number(c.spent) || 0), 0);

  return (
    <div>
      <PageHeader title="Marketing & Communications" description="Campaigns, content, and brand assets">
        <Button size="sm" className="h-8 text-xs" onClick={openNew}><Plus className="h-3.5 w-3.5 mr-1.5" /> New Campaign</Button>
      </PageHeader>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Active Campaigns</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{activeCampaigns.length}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Total Budget</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Budget Used</CardTitle></CardHeader>
            <CardContent><div className="flex items-center gap-2"><p className="text-2xl font-bold">{totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0}%</p><Progress value={totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0} className="flex-1 h-2" /></div></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">Media Assets</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">{assets.length}</p></CardContent></Card>
        </div>

        <Tabs defaultValue="campaigns">
          <TabsList><TabsTrigger value="campaigns">Campaigns</TabsTrigger><TabsTrigger value="assets">Brand Assets</TabsTrigger></TabsList>

          <TabsContent value="campaigns">
            {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader><TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Campaign</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Dates</TableHead>
                    <TableHead className="text-xs font-semibold">Budget</TableHead>
                    <TableHead className="text-xs font-semibold">Spent</TableHead>
                    <TableHead className="text-xs font-semibold w-24">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {campaigns.map((c: any) => (
                      <TableRow key={c.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{c.campaign_type?.replace("_", " ")}</Badge></TableCell>
                        <TableCell><StatusBadge status={c.status} /></TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">{c.start_date || "—"} → {c.end_date || "—"}</TableCell>
                        <TableCell className="text-xs font-mono">${Number(c.budget || 0).toLocaleString()}</TableCell>
                        <TableCell className="text-xs font-mono">${Number(c.spent || 0).toLocaleString()}</TableCell>
                        <TableCell><div className="flex gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(c)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(c.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assets">
            <div className="space-y-4">
              <div className="flex gap-2">
                <input ref={fileRef} type="file" className="hidden" onChange={handleUpload} />
                <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploadAsset.isPending}>
                  <Upload className="h-3.5 w-3.5 mr-1.5" /> {uploadAsset.isPending ? "Uploading…" : "Upload Asset"}
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assets.map((a: any) => (
                  <div key={a.id} className="border border-border rounded-lg p-3 text-center hover:bg-muted/30 transition-colors">
                    <div className="h-16 flex items-center justify-center mb-2">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-xs font-medium truncate">{a.name}</p>
                    <p className="text-[10px] text-muted-foreground">{a.asset_type} · {a.file_size ? `${Math.round(a.file_size / 1024)}KB` : ""}</p>
                  </div>
                ))}
                {assets.length === 0 && <p className="text-sm text-muted-foreground col-span-full py-8 text-center">No assets uploaded yet</p>}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editing ? "Edit Campaign" : "New Campaign"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">Name *</Label><Input value={form.name || ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Type</Label>
                <Select value={form.campaign_type || "general"} onValueChange={(v) => setForm({ ...form, campaign_type: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CAMPAIGN_TYPES.map((t) => <SelectItem key={t} value={t}>{t.replace("_", " ")}</SelectItem>)}</SelectContent>
                </Select></div>
              <div><Label className="text-xs">Status</Label>
                <Select value={form.status || "planned"} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                  <SelectContent>{CAMPAIGN_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                </Select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Start Date</Label><Input type="date" value={form.start_date || ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label className="text-xs">End Date</Label><Input type="date" value={form.end_date || ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Budget ($)</Label><Input type="number" value={form.budget || ""} onChange={(e) => setForm({ ...form, budget: Number(e.target.value) })} /></div>
              <div><Label className="text-xs">Spent ($)</Label><Input type="number" value={form.spent || ""} onChange={(e) => setForm({ ...form, spent: Number(e.target.value) })} /></div>
            </div>
            <div><Label className="text-xs">Target Audience</Label><Input value={form.target_audience || ""} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} /></div>
            <div><Label className="text-xs">Description</Label><Textarea value={form.description || ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={!form.name || create.isPending || update.isPending}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
