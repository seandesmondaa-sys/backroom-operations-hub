import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import {
  useApprovalRequests, useApprovalSteps, useCreateApprovalRequest, useActOnApprovalStep,
  type ApprovalType, type ApprovalRequestStatus,
} from "@/hooks/use-approvals";
import { useAllUserRoles } from "@/hooks/use-roles";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Plus, Check, X, Clock, CheckCircle2, XCircle, ArrowRight, User, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";

const TYPE_LABELS: Record<ApprovalType, string> = {
  expense: "Expense",
  leave: "Leave",
  budget: "Budget",
  contract: "Contract",
  document: "Document",
};

const STATUS_BADGE: Record<ApprovalRequestStatus, { class: string; icon: typeof Clock }> = {
  pending: { class: "bg-yellow-100 text-yellow-800", icon: Clock },
  in_progress: { class: "bg-blue-100 text-blue-800", icon: ArrowRight },
  approved: { class: "bg-green-100 text-green-800", icon: CheckCircle2 },
  rejected: { class: "bg-red-100 text-red-800", icon: XCircle },
  cancelled: { class: "bg-muted text-muted-foreground", icon: AlertCircle },
};

// ── Create Request Dialog ──────────────────────────────────
function CreateRequestDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: members = [] } = useAllUserRoles();
  const createRequest = useCreateApprovalRequest();
  const [type, setType] = useState<ApprovalType>("contract");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [approverIds, setApproverIds] = useState<string[]>([]);
  const [selectedApprover, setSelectedApprover] = useState("");

  const addApprover = () => {
    if (selectedApprover && !approverIds.includes(selectedApprover)) {
      setApproverIds([...approverIds, selectedApprover]);
      setSelectedApprover("");
    }
  };

  const removeApprover = (id: string) => {
    setApproverIds(approverIds.filter((a) => a !== id));
  };

  const handleSubmit = () => {
    if (!title || approverIds.length === 0) return;
    createRequest.mutate(
      { approval_type: type, reference_id: "manual", title, description, approver_ids: approverIds },
      {
        onSuccess: () => {
          toast.success("Approval request created");
          onOpenChange(false);
          setTitle("");
          setDescription("");
          setApproverIds([]);
        },
        onError: (e) => toast.error(e.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Create Approval Request</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={type} onValueChange={(v) => setType(v as ApprovalType)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[50px]" />

          <div>
            <p className="text-xs font-medium mb-1.5">Approval Chain (in order)</p>
            <div className="flex gap-2 mb-2">
              <Select value={selectedApprover} onValueChange={setSelectedApprover}>
                <SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Select approver…" /></SelectTrigger>
                <SelectContent>
                  {members.filter((m) => !approverIds.includes(m.user_id)).map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={addApprover} disabled={!selectedApprover}>
                <Plus className="h-3 w-3 mr-1" /> Add
              </Button>
            </div>
            {approverIds.length > 0 && (
              <div className="space-y-1">
                {approverIds.map((id, i) => {
                  const member = members.find((m) => m.user_id === id);
                  return (
                    <div key={id} className="flex items-center gap-2 px-2 py-1.5 rounded bg-muted/50 text-xs">
                      <Badge variant="outline" className="text-[10px] h-5 w-5 flex items-center justify-center p-0">{i + 1}</Badge>
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="flex-1 font-medium">{member?.display_name || id}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={() => removeApprover(id)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <Button onClick={handleSubmit} disabled={createRequest.isPending || !title || approverIds.length === 0} className="w-full h-8 text-xs">
            Submit for Approval
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Approval Steps Detail ──────────────────────────────────
function StepsDetail({ requestId, requestStatus }: { requestId: string; requestStatus: ApprovalRequestStatus }) {
  const { user } = useAuth();
  const { data: steps = [], isLoading } = useApprovalSteps(requestId);
  const actOnStep = useActOnApprovalStep();
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  if (isLoading) return <Skeleton className="h-20 w-full" />;

  return (
    <div className="space-y-2 mt-3">
      {steps.map((step, i) => {
        const isMyTurn = step.approver_id === user?.id && step.status === "pending" && requestStatus !== "rejected";
        const prevApproved = i === 0 || steps[i - 1]?.status === "approved";

        return (
          <div key={step.id} className="flex items-start gap-3 px-3 py-2 rounded-md border border-border bg-card">
            <div className="flex flex-col items-center gap-1">
              <Badge variant="outline" className="text-[10px] h-5 w-5 flex items-center justify-center p-0">{step.step_order}</Badge>
              {i < steps.length - 1 && <div className="w-px h-4 bg-border" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium">{step.approver_name}</span>
                {step.status === "approved" && <CheckCircle2 className="h-3.5 w-3.5 text-success" />}
                {step.status === "rejected" && <XCircle className="h-3.5 w-3.5 text-destructive" />}
                {step.status === "pending" && <Clock className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              {step.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{step.notes}</p>}
              {step.acted_at && (
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {format(new Date(step.acted_at), "MMM d, HH:mm")}
                </p>
              )}
              {isMyTurn && prevApproved && (
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="Notes (optional)"
                    value={noteInputs[step.id] || ""}
                    onChange={(e) => setNoteInputs({ ...noteInputs, [step.id]: e.target.value })}
                    className="h-7 text-xs flex-1"
                  />
                  <Button
                    size="sm" variant="outline"
                    className="h-7 text-xs text-success border-success/30"
                    onClick={() => actOnStep.mutate({ step_id: step.id, request_id: requestId, status: "approved", notes: noteInputs[step.id] })}
                    disabled={actOnStep.isPending}
                  >
                    <Check className="h-3 w-3 mr-1" /> Approve
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    className="h-7 text-xs text-destructive border-destructive/30"
                    onClick={() => actOnStep.mutate({ step_id: step.id, request_id: requestId, status: "rejected", notes: noteInputs[step.id] })}
                    disabled={actOnStep.isPending}
                  >
                    <X className="h-3 w-3 mr-1" /> Reject
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────
export default function ApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: requests = [], isLoading } = useApprovalRequests({
    status: statusFilter === "all" ? undefined : statusFilter as ApprovalRequestStatus,
    type: typeFilter === "all" ? undefined : typeFilter as ApprovalType,
  });

  return (
    <div>
      <PageHeader title="Approvals" description="Multi-level approval workflows" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All types</SelectItem>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 h-8 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All statuses</SelectItem>
              {(["pending", "in_progress", "approved", "rejected", "cancelled"] as ApprovalRequestStatus[]).map((s) => (
                <SelectItem key={s} value={s} className="text-xs">{s.replace("_", " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Request
          </Button>
        </div>

        {isLoading ? <Skeleton className="h-96 w-full rounded-lg" /> : (
          <div className="space-y-3">
            {requests.map((req) => {
              const status = STATUS_BADGE[req.status];
              const isExpanded = expandedId === req.id;

              return (
                <Card key={req.id} className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : req.id)}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-[10px]">{TYPE_LABELS[req.approval_type]}</Badge>
                        <h3 className="text-sm font-medium">{req.title}</h3>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-muted-foreground">
                          by {req.requester_name} • {format(new Date(req.created_at), "MMM d")}
                        </span>
                        <Badge className={`text-[10px] ${status.class}`}>
                          <status.icon className="h-3 w-3 mr-1" />
                          {req.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    {req.description && (
                      <p className="text-xs text-muted-foreground mt-1.5">{req.description}</p>
                    )}
                    {isExpanded && <StepsDetail requestId={req.id} requestStatus={req.status} />}
                  </CardContent>
                </Card>
              );
            })}
            {requests.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-sm text-muted-foreground">
                  No approval requests yet. Create one to start a workflow.
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <CreateRequestDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    </div>
  );
}
