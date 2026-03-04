import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export type WorkflowStage = "sales" | "legal" | "finance" | "operations" | "completed";
export type PipelineStatus = "active" | "paused" | "completed" | "cancelled";
export type StageGateStatus = "pending" | "approved" | "rejected" | "skipped";

export const STAGE_ORDER: WorkflowStage[] = ["sales", "legal", "finance", "operations", "completed"];

export const STAGE_LABELS: Record<WorkflowStage, string> = {
  sales: "Sales / Biz Dev",
  legal: "Legal & Compliance",
  finance: "Finance",
  operations: "Operations",
  completed: "Completed",
};

export const STAGE_COLORS: Record<WorkflowStage, string> = {
  sales: "bg-info/15 text-info border-info/30",
  legal: "bg-warning/15 text-warning border-warning/30",
  finance: "bg-accent/15 text-accent-foreground border-accent/30",
  operations: "bg-primary/15 text-primary border-primary/30",
  completed: "bg-success/15 text-success border-success/30",
};

export interface WorkflowPipeline {
  id: string;
  title: string;
  description: string | null;
  lead_id: string | null;
  current_stage: WorkflowStage;
  status: PipelineStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
  creator_name?: string;
  gates?: StageGate[];
}

export interface StageGate {
  id: string;
  pipeline_id: string;
  from_stage: WorkflowStage;
  to_stage: WorkflowStage;
  status: StageGateStatus;
  approver_id: string | null;
  notes: string | null;
  acted_at: string | null;
  created_at: string;
  approver_name?: string;
}

export function useWorkflowPipelines(statusFilter?: PipelineStatus) {
  return useQuery({
    queryKey: ["workflow-pipelines", statusFilter],
    queryFn: async () => {
      let q = supabase
        .from("workflow_pipelines")
        .select("*")
        .order("created_at", { ascending: false });
      if (statusFilter) q = q.eq("status", statusFilter);
      const { data, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((data || []).map((p: any) => p.created_by))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((p: any) => ({
        ...p,
        creator_name: profileMap[p.created_by] || "Unknown",
      })) as WorkflowPipeline[];
    },
  });
}

export function useStageGates(pipelineId: string | null) {
  return useQuery({
    queryKey: ["stage-gates", pipelineId],
    enabled: !!pipelineId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workflow_stage_gates")
        .select("*")
        .eq("pipeline_id", pipelineId!)
        .order("created_at");
      if (error) throw error;

      const approverIds = [...new Set((data || []).filter((g: any) => g.approver_id).map((g: any) => g.approver_id))];
      let profileMap: Record<string, string> = {};
      if (approverIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", approverIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((g: any) => ({
        ...g,
        approver_name: g.approver_id ? profileMap[g.approver_id] || "Unknown" : null,
      })) as StageGate[];
    },
  });
}

export function useCreateWorkflowPipeline() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ title, description, lead_id }: { title: string; description?: string; lead_id?: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("workflow_pipelines")
        .insert({ title, description: description || null, lead_id: lead_id || null, created_by: user.id } as any)
        .select()
        .single();
      if (error) throw error;

      // Pre-create all stage gate records
      const transitions: { from_stage: WorkflowStage; to_stage: WorkflowStage }[] = [
        { from_stage: "sales", to_stage: "legal" },
        { from_stage: "legal", to_stage: "finance" },
        { from_stage: "finance", to_stage: "operations" },
        { from_stage: "operations", to_stage: "completed" },
      ];
      const gates = transitions.map((t) => ({ pipeline_id: (data as any).id, ...t }));
      await supabase.from("workflow_stage_gates").insert(gates as any);

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-pipelines"] });
      toast({ title: "Workflow pipeline created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useApproveStageGate() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ gate_id, pipeline_id, notes, action }: { gate_id: string; pipeline_id: string; notes?: string; action: "approved" | "rejected" }) => {
      if (!user) throw new Error("Not authenticated");

      // Update the gate
      const { error: gateErr } = await supabase
        .from("workflow_stage_gates")
        .update({ status: action, approver_id: user.id, notes: notes || null, acted_at: new Date().toISOString() } as any)
        .eq("id", gate_id);
      if (gateErr) throw gateErr;

      if (action === "approved") {
        // Get the gate to find the next stage
        const { data: gate } = await supabase
          .from("workflow_stage_gates")
          .select("*")
          .eq("id", gate_id)
          .single();
        if (!gate) throw new Error("Gate not found");

        const nextStage = (gate as any).to_stage as WorkflowStage;
        const updates: any = { current_stage: nextStage };
        if (nextStage === "completed") {
          updates.status = "completed";
          updates.completed_at = new Date().toISOString();
        }
        await supabase.from("workflow_pipelines").update(updates).eq("id", pipeline_id);

        // Notify department heads
        const { data: heads } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "department_head");
        if (heads && heads.length > 0) {
          const { data: pipeline } = await supabase.from("workflow_pipelines").select("title").eq("id", pipeline_id).single();
          const notifications = heads.map((h) => ({
            user_id: h.user_id,
            type: "system",
            title: `Workflow Advanced: ${(pipeline as any)?.title || "Pipeline"}`,
            body: `Stage transition approved. Now in ${STAGE_LABELS[nextStage]}.`,
          }));
          await supabase.from("notifications").insert(notifications);
        }
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workflow-pipelines"] });
      qc.invalidateQueries({ queryKey: ["stage-gates"] });
      toast({ title: "Stage gate updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
