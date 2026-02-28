import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";
export type LeaveType = "annual" | "sick" | "personal" | "maternity" | "paternity" | "unpaid" | "other";

export interface LeaveRequest {
  id: string;
  user_id: string;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  days_count: number;
  reason: string | null;
  status: LeaveStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
}

export interface PerformanceLog {
  id: string;
  user_id: string;
  logged_by: string;
  period: string;
  rating: number | null;
  strengths: string | null;
  improvements: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
  logged_by_name?: string;
}

export interface HRNote {
  id: string;
  user_id: string;
  author_id: string;
  content: string;
  is_confidential: boolean;
  created_at: string;
  updated_at: string;
  user_name?: string;
  author_name?: string;
}

export const LEAVE_TYPE_LABELS: Record<LeaveType, string> = {
  annual: "Annual", sick: "Sick", personal: "Personal",
  maternity: "Maternity", paternity: "Paternity", unpaid: "Unpaid", other: "Other",
};

export const LEAVE_STATUS_COLORS: Record<LeaveStatus, string> = {
  pending: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

// Helper to enrich with profile names
async function enrichWithNames<T extends Record<string, unknown>>(
  items: T[], userIdField: string, nameField: string
): Promise<T[]> {
  const ids = [...new Set(items.map((i) => i[userIdField] as string).filter(Boolean))];
  if (!ids.length) return items;
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name").in("user_id", ids);
  const map = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));
  return items.map((i) => ({ ...i, [nameField]: map[i[userIdField] as string] || "Unknown" }));
}

// ─── Leave Requests ────────────────────────────────────────
export function useLeaveRequests() {
  return useQuery({
    queryKey: ["hr-leaves"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hr_leave_requests").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return enrichWithNames(data || [], "user_id", "user_name") as Promise<LeaveRequest[]>;
    },
  });
}

export function useCreateLeaveRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (req: Partial<LeaveRequest>) => {
      const { error } = await supabase.from("hr_leave_requests").insert({
        user_id: user!.id,
        leave_type: req.leave_type ?? "annual",
        start_date: req.start_date!,
        end_date: req.end_date!,
        days_count: req.days_count ?? 1,
        reason: req.reason ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leaves"] }); toast.success("Leave request submitted"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useReviewLeaveRequest() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, status, review_note }: { id: string; status: LeaveStatus; review_note?: string }) => {
      const { error } = await supabase.from("hr_leave_requests").update({
        status, reviewed_by: user!.id, reviewed_at: new Date().toISOString(), review_note: review_note ?? null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-leaves"] }); toast.success("Leave request updated"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── Performance Logs ──────────────────────────────────────
export function usePerformanceLogs() {
  return useQuery({
    queryKey: ["hr-performance"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hr_performance_logs").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      let enriched = await enrichWithNames(data || [], "user_id", "user_name");
      enriched = await enrichWithNames(enriched, "logged_by", "logged_by_name");
      return enriched as PerformanceLog[];
    },
  });
}

export function useCreatePerformanceLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (log: Partial<PerformanceLog>) => {
      const { error } = await supabase.from("hr_performance_logs").insert({
        user_id: log.user_id!,
        logged_by: user!.id,
        period: log.period!,
        rating: log.rating ?? null,
        strengths: log.strengths ?? null,
        improvements: log.improvements ?? null,
        notes: log.notes ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-performance"] }); toast.success("Performance log added"); },
    onError: (e) => toast.error(e.message),
  });
}

// ─── HR Notes ──────────────────────────────────────────────
export function useHRNotes() {
  return useQuery({
    queryKey: ["hr-notes"],
    queryFn: async () => {
      const { data, error } = await supabase.from("hr_notes").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      let enriched = await enrichWithNames(data || [], "user_id", "user_name");
      enriched = await enrichWithNames(enriched, "author_id", "author_name");
      return enriched as HRNote[];
    },
  });
}

export function useCreateHRNote() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (note: Partial<HRNote>) => {
      const { error } = await supabase.from("hr_notes").insert({
        user_id: note.user_id!,
        author_id: user!.id,
        content: note.content!,
        is_confidential: note.is_confidential ?? true,
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-notes"] }); toast.success("Note added"); },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteHRNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hr_notes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["hr-notes"] }); toast.success("Note deleted"); },
    onError: (e) => toast.error(e.message),
  });
}
