import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAllReadiness, useUpsertReadiness, CRITERIA, READINESS_STAGES, computeScore, suggestStage } from "@/hooks/use-readiness";
import { useProjects } from "@/hooks/use-airtable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Plus, ShieldCheck, AlertTriangle } from "lucide-react";

const stageColors: Record<string, string> = {
  concept: "bg-muted text-muted-foreground",
  early_development: "bg-info/10 text-info",
  structuring: "bg-warning/10 text-warning",
  investment_ready: "bg-success/10 text-success",
  capital_deployment: "bg-primary/10 text-primary",
};

export default function ReadinessPage() {
  const { data: allReadiness = [], isLoading } = useAllReadiness();
  const { data: projects = [] } = useProjects();
  const upsert = useUpsertReadiness();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({
    project_id: "",
    has_financial_model: false,
    has_legal_docs: false,
    has_feasibility_study: false,
    has_regulatory_approvals: false,
    has_revenue_projections: false,
    manual_override_stage: "",
    notes: "",
  });

  const openForProject = (projectId?: string) => {
    const existing = allReadiness.find((r) => r.project_id === projectId);
    if (existing) {
      setForm({ ...existing, manual_override_stage: existing.manual_override_stage || "" });
    } else {
      setForm({
        project_id: projectId || "",
        has_financial_model: false,
        has_legal_docs: false,
        has_feasibility_study: false,
        has_regulatory_approvals: false,
        has_revenue_projections: false,
        manual_override_stage: "",
        notes: "",
      });
    }
    setDialogOpen(true);
  };

  const currentScore = computeScore(form);
  const suggestedStage = suggestStage(currentScore);
  const effectiveStage = form.manual_override_stage || suggestedStage;

  const handleSubmit = () => {
    if (!form.project_id) return;
    upsert.mutate({
      project_id: form.project_id,
      has_financial_model: form.has_financial_model,
      has_legal_docs: form.has_legal_docs,
      has_feasibility_study: form.has_feasibility_study,
      has_regulatory_approvals: form.has_regulatory_approvals,
      has_revenue_projections: form.has_revenue_projections,
      manual_override_stage: form.manual_override_stage || null,
      notes: form.notes || null,
    }, { onSuccess: () => setDialogOpen(false) });
  };

  if (isLoading) return <div><PageHeader title="Investment Readiness" description="Loading…" /><div className="p-6"><Skeleton className="h-64 w-full" /></div></div>;

  return (
    <div>
      <PageHeader title="Investment Readiness" description="Score and classify projects by documentation completeness">
        <Button size="sm" className="h-8 text-xs" onClick={() => openForProject()}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Score Project
        </Button>
      </PageHeader>

      <div className="p-6 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {READINESS_STAGES.map((s) => {
            const count = allReadiness.filter((r) => (r.manual_override_stage || r.readiness_stage) === s.key).length;
            return (
              <Card key={s.key}>
                <CardContent className="p-3 text-center">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{s.label}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Scored Projects */}
        <div className="space-y-3">
          {allReadiness.map((r) => {
            const projectName = String(projects.find((p: any) => String(p.id || p["Project Name"]) === r.project_id)?.["Project Name"] || r.project_id);
            const stage = r.manual_override_stage || r.readiness_stage;
            const stageLabel = READINESS_STAGES.find((s) => s.key === stage)?.label || stage;

            return (
              <Card key={r.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => openForProject(r.project_id)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-semibold">{projectName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={cn("text-[10px]", stageColors[stage] || "")}>{stageLabel}</Badge>
                          {r.manual_override_stage && (
                            <Badge variant="outline" className="text-[10px]">
                              <AlertTriangle className="h-2.5 w-2.5 mr-1" /> Manual Override
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-lg font-bold">{r.auto_score}/100</p>
                        <p className="text-[10px] text-muted-foreground">Auto Score</p>
                      </div>
                      <Progress value={r.auto_score} className="w-20 h-2" />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3">
                    {CRITERIA.map((c) => (
                      <Badge
                        key={c.key}
                        variant="outline"
                        className={cn("text-[10px]", (r as any)[c.key] ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground")}
                      >
                        {(r as any)[c.key] ? "✓" : "✗"} {c.label}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {allReadiness.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ShieldCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No projects scored yet. Click "Score Project" to begin.</p>
            </div>
          )}
        </div>
      </div>

      {/* Score Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">Score Investment Readiness</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Project</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger className="h-9"><SelectValue placeholder="Select project…" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id || p["Project Name"]} value={String(p.id || p["Project Name"])} className="text-xs">
                      {String(p["Project Name"] || p.id)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-semibold">Documentation Criteria</p>
              {CRITERIA.map((c) => (
                <div key={c.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={form[c.key] || false}
                      onCheckedChange={(checked) => setForm({ ...form, [c.key]: !!checked })}
                    />
                    <Label className="text-xs">{c.label}</Label>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{c.weight} pts</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Auto Score</span>
                <span className="text-lg font-bold">{currentScore}/100</span>
              </div>
              <Progress value={currentScore} className="h-2" />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Suggested Stage</span>
                <Badge className={cn("text-[10px]", stageColors[suggestedStage] || "")}>
                  {READINESS_STAGES.find((s) => s.key === suggestedStage)?.label}
                </Badge>
              </div>
            </div>

            <div>
              <Label className="text-xs">Manual Override Stage (optional)</Label>
              <Select value={form.manual_override_stage || "none"} onValueChange={(v) => setForm({ ...form, manual_override_stage: v === "none" ? "" : v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" className="text-xs">Use auto-suggestion</SelectItem>
                  {READINESS_STAGES.map((s) => <SelectItem key={s.key} value={s.key} className="text-xs">{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea value={form.notes || ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="text-sm min-h-[50px]" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={!form.project_id || upsert.isPending}>
              {upsert.isPending ? "Saving…" : "Save Score"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
