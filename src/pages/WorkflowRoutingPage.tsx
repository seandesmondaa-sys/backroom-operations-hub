import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  useWorkflowPipelines,
  useStageGates,
  useCreateWorkflowPipeline,
  useApproveStageGate,
  STAGE_ORDER,
  STAGE_LABELS,
  STAGE_COLORS,
  type WorkflowPipeline,
  type WorkflowStage,
  type StageGate,
} from "@/hooks/use-workflow-pipelines";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Plus, CheckCircle2, XCircle, Clock, ArrowRight, Lock, Unlock, AlertTriangle,
} from "lucide-react";

// ─── Stage Pipeline Visualizer ─────────────────────────────
function StagePipeline({
  currentStage,
  gates,
  onGateClick,
}: {
  currentStage: WorkflowStage;
  gates: StageGate[];
  onGateClick: (gate: StageGate) => void;
}) {
  const stages = STAGE_ORDER.filter((s) => s !== "completed");
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto py-2">
      {stages.map((stage, i) => {
        const isPast = i < currentIdx;
        const isCurrent = stage === currentStage;
        const isFuture = i > currentIdx;
        const gate = gates.find((g) => g.from_stage === stage);

        return (
          <div key={stage} className="flex items-center flex-1 min-w-0">
            {/* Stage node */}
            <div
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 px-3 py-3 min-w-[100px] flex-1 transition-all",
                isPast && "border-success/50 bg-success/5",
                isCurrent && "border-primary bg-primary/10 ring-2 ring-primary/20",
                isFuture && "border-muted bg-muted/30"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center mb-1.5",
                isPast && "bg-success text-success-foreground",
                isCurrent && "bg-primary text-primary-foreground",
                isFuture && "bg-muted text-muted-foreground"
              )}>
                {isPast ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : isCurrent ? (
                  <Clock className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
              </div>
              <span className={cn(
                "text-[11px] font-semibold text-center leading-tight",
                isPast && "text-success",
                isCurrent && "text-primary",
                isFuture && "text-muted-foreground"
              )}>
                {STAGE_LABELS[stage]}
              </span>
              {isCurrent && (
                <Badge variant="outline" className="mt-1.5 text-[9px] border-primary/40 text-primary">
                  Active
                </Badge>
              )}
            </div>

            {/* Gate arrow between stages */}
            {i < stages.length - 1 && gate && (
              <button
                onClick={() => onGateClick(gate)}
                className={cn(
                  "flex flex-col items-center mx-1 p-1.5 rounded-md transition-all hover:scale-105 cursor-pointer shrink-0",
                  gate.status === "approved" && "text-success",
                  gate.status === "pending" && isCurrent && "text-warning animate-pulse",
                  gate.status === "pending" && !isCurrent && "text-muted-foreground",
                  gate.status === "rejected" && "text-destructive"
                )}
                title={`Gate: ${gate.from_stage} → ${gate.to_stage} (${gate.status})`}
              >
                {gate.status === "approved" ? (
                  <Unlock className="h-4 w-4" />
                ) : gate.status === "rejected" ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )}
                <ArrowRight className="h-3 w-3 mt-0.5" />
                <span className="text-[9px] font-mono mt-0.5">{gate.status}</span>
              </button>
            )}
          </div>
        );
      })}

      {/* Completed node */}
      <div className="flex items-center shrink-0 ml-1">
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 px-3 py-3 min-w-[80px]",
            currentStage === "completed"
              ? "border-success bg-success/10"
              : "border-muted bg-muted/30"
          )}
        >
          <CheckCircle2 className={cn("h-6 w-6", currentStage === "completed" ? "text-success" : "text-muted-foreground")} />
          <span className={cn("text-[11px] font-semibold mt-1", currentStage === "completed" ? "text-success" : "text-muted-foreground")}>
            Done
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Gate Approval Dialog ──────────────────────────────────
function GateApprovalDialog({
  gate,
  open,
  onOpenChange,
}: {
  gate: StageGate | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const approveGate = useApproveStageGate();
  const [notes, setNotes] = useState("");

  if (!gate) return null;

  const handleAction = (action: "approved" | "rejected") => {
    approveGate.mutate(
      { gate_id: gate.id, pipeline_id: gate.pipeline_id, notes, action },
      { onSuccess: () => { onOpenChange(false); setNotes(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">
            Approval Gate: {STAGE_LABELS[gate.from_stage]} → {STAGE_LABELS[gate.to_stage]}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Status:</span>
            <Badge variant="outline" className={cn(
              "text-[10px]",
              gate.status === "approved" && "text-success border-success/30",
              gate.status === "rejected" && "text-destructive border-destructive/30",
              gate.status === "pending" && "text-warning border-warning/30"
            )}>
              {gate.status}
            </Badge>
          </div>
          {gate.approver_name && (
            <p className="text-xs text-muted-foreground">Reviewed by: {gate.approver_name}</p>
          )}
          {gate.acted_at && (
            <p className="text-xs text-muted-foreground">At: {format(new Date(gate.acted_at), "MMM d, yyyy HH:mm")}</p>
          )}
          {gate.notes && (
            <div className="bg-muted/30 rounded p-2 text-xs">{gate.notes}</div>
          )}
          {gate.status === "pending" && (
            <>
              <Textarea
                placeholder="Notes (optional)…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm min-h-[60px]"
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => handleAction("approved")}
                  disabled={approveGate.isPending}
                  className="flex-1 h-9 text-xs bg-success hover:bg-success/90 text-success-foreground"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Approve & Advance
                </Button>
                <Button
                  onClick={() => handleAction("rejected")}
                  disabled={approveGate.isPending}
                  variant="destructive"
                  className="flex-1 h-9 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Pipeline Card ─────────────────────────────────────────
function PipelineCard({ pipeline }: { pipeline: WorkflowPipeline }) {
  const { data: gates = [] } = useStageGates(pipeline.id);
  const [selectedGate, setSelectedGate] = useState<StageGate | null>(null);

  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-bold">{pipeline.title}</h3>
          {pipeline.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{pipeline.description}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-1">
            Created by {pipeline.creator_name} · {format(new Date(pipeline.created_at), "MMM d, yyyy")}
          </p>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            pipeline.status === "active" && "text-info border-info/30",
            pipeline.status === "completed" && "text-success border-success/30",
            pipeline.status === "paused" && "text-warning border-warning/30",
            pipeline.status === "cancelled" && "text-destructive border-destructive/30"
          )}
        >
          {pipeline.status}
        </Badge>
      </div>

      <StagePipeline
        currentStage={pipeline.current_stage as WorkflowStage}
        gates={gates}
        onGateClick={setSelectedGate}
      />

      {/* Gate history */}
      {gates.filter((g) => g.status !== "pending").length > 0 && (
        <div className="border-t border-border pt-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Gate History</p>
          <div className="space-y-1">
            {gates.filter((g) => g.status !== "pending").map((g) => (
              <div key={g.id} className="flex items-center gap-2 text-[11px]">
                {g.status === "approved" ? (
                  <CheckCircle2 className="h-3 w-3 text-success shrink-0" />
                ) : (
                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                )}
                <span className="text-muted-foreground">
                  {STAGE_LABELS[g.from_stage]} → {STAGE_LABELS[g.to_stage]}
                </span>
                {g.approver_name && <span className="text-muted-foreground">by {g.approver_name}</span>}
                {g.acted_at && (
                  <span className="text-muted-foreground font-mono ml-auto">
                    {format(new Date(g.acted_at), "MMM d HH:mm")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <GateApprovalDialog
        gate={selectedGate}
        open={!!selectedGate}
        onOpenChange={(o) => !o && setSelectedGate(null)}
      />
    </div>
  );
}

// ─── Create Pipeline Dialog ────────────────────────────────
function CreatePipelineDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createPipeline = useCreateWorkflowPipeline();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    if (!title.trim()) return;
    createPipeline.mutate(
      { title: title.trim(), description },
      { onSuccess: () => { onOpenChange(false); setTitle(""); setDescription(""); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">New Workflow Pipeline</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input
            placeholder="Pipeline title…"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-9 text-sm"
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm min-h-[60px]"
          />
          <p className="text-[10px] text-muted-foreground">
            This will create a pipeline with mandatory approval gates at each department transition:
            Sales → Legal → Finance → Operations → Completed
          </p>
          <Button
            onClick={handleSubmit}
            disabled={createPipeline.isPending || !title.trim()}
            className="w-full h-9 text-xs"
          >
            Create Pipeline
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ─────────────────────────────────────────────
export default function WorkflowRoutingPage() {
  const { data: pipelines = [], isLoading } = useWorkflowPipelines();
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const filtered = filter === "all"
    ? pipelines
    : pipelines.filter((p) => p.status === filter);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <PageHeader title="Cross-Department Routing" description="Manage project workflows with mandatory approval gates at each department transition." />

      <div className="flex items-center justify-between">
        <div className="flex gap-1.5">
          {(["all", "active", "completed"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
        <Button size="sm" className="h-8 text-xs" onClick={() => setShowCreate(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> New Pipeline
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground">
          No workflow pipelines yet. Create one to start routing projects across departments.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p) => (
            <PipelineCard key={p.id} pipeline={p} />
          ))}
        </div>
      )}

      <CreatePipelineDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
