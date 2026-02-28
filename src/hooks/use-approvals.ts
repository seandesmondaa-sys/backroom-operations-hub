import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type ApprovalType = "expense" | "leave" | "budget" | "contract" | "document";
export type ApprovalRequestStatus = "pending" | "in_progress" | "approved" | "rejected" | "cancelled";
export type ApprovalStepStatus = "pending" | "approved" | "rejected" | "skipped";

export interface ApprovalRequest {
  id: string;
  approval_type: ApprovalType;
  reference_id: string;
  title: string;
  description: string | null;
  status: ApprovalRequestStatus;
  requested_by: string;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  steps?: ApprovalStep[];
}

export interface ApprovalStep {
  id: string;
  request_id: string;
  step_order: number;
  approver_id: string;
  status: ApprovalStepStatus;
  notes: string | null;
  acted_at: string | null;
  created_at: string;
  approver_name?: string;
}

export function useApprovalRequests(filters?: { status?: ApprovalRequestStatus; type?: ApprovalType }) {
  return useQuery({
    queryKey: ["approval-requests", filters],
    queryFn: async () => {
      let q = supabase
        .from("approval_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.status) q = q.eq("status", filters.status);
      if (filters?.type) q = q.eq("approval_type", filters.type);

      const { data, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((data || []).map((r: any) => r.requested_by))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((r: any) => ({
        ...r,
        requester_name: profileMap[r.requested_by] || "Unknown",
      })) as ApprovalRequest[];
    },
  });
}

export function useApprovalSteps(requestId: string | null) {
  return useQuery({
    queryKey: ["approval-steps", requestId],
    enabled: !!requestId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("approval_steps")
        .select("*")
        .eq("request_id", requestId!)
        .order("step_order");
      if (error) throw error;

      const userIds = [...new Set((data || []).map((s: any) => s.approver_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((s: any) => ({
        ...s,
        approver_name: profileMap[s.approver_id] || "Unknown",
      })) as ApprovalStep[];
    },
  });
}

export function useCreateApprovalRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      approval_type,
      reference_id,
      title,
      description,
      approver_ids,
    }: {
      approval_type: ApprovalType;
      reference_id: string;
      title: string;
      description?: string;
      approver_ids: string[];
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: request, error: reqErr } = await supabase
        .from("approval_requests")
        .insert({
          approval_type,
          reference_id,
          title,
          description: description || null,
          requested_by: user.id,
          status: approver_ids.length > 0 ? "in_progress" : "pending",
        } as any)
        .select()
        .single();
      if (reqErr) throw reqErr;

      if (approver_ids.length > 0) {
        const steps = approver_ids.map((approver_id, i) => ({
          request_id: (request as any).id,
          step_order: i + 1,
          approver_id,
        }));
        const { error: stepsErr } = await supabase.from("approval_steps").insert(steps as any);
        if (stepsErr) throw stepsErr;
      }

      return request;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-requests"] });
    },
  });
}

export function useActOnApprovalStep() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      step_id,
      request_id,
      status,
      notes,
    }: {
      step_id: string;
      request_id: string;
      status: "approved" | "rejected";
      notes?: string;
    }) => {
      // Update the step
      const { error: stepErr } = await supabase
        .from("approval_steps")
        .update({ status, notes: notes || null, acted_at: new Date().toISOString() } as any)
        .eq("id", step_id);
      if (stepErr) throw stepErr;

      // Check if all steps are done
      const { data: allSteps } = await supabase
        .from("approval_steps")
        .select("*")
        .eq("request_id", request_id)
        .order("step_order");

      const steps = allSteps || [];
      const allActed = steps.every((s: any) => s.status !== "pending");
      const anyRejected = steps.some((s: any) => s.status === "rejected");

      if (allActed || anyRejected) {
        const finalStatus = anyRejected ? "rejected" : "approved";
        await supabase
          .from("approval_requests")
          .update({ status: finalStatus, updated_at: new Date().toISOString() } as any)
          .eq("id", request_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-requests"] });
      qc.invalidateQueries({ queryKey: ["approval-steps"] });
    },
  });
}
