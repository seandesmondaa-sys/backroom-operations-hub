import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface AttendanceRecord {
  id: string;
  user_id: string;
  clock_in: string;
  clock_out: string | null;
  total_hours: number | null;
  notes: string | null;
  created_at: string;
  user_name?: string;
}

export function useAttendance() {
  return useQuery({
    queryKey: ["hr-attendance"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hr_attendance")
        .select("*")
        .order("clock_in", { ascending: false })
        .limit(200);
      if (error) throw error;

      const userIds = [...new Set((data || []).map((r: any) => r.user_id))];
      let profileMap: Record<string, string> = {};
      if (userIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((r: any) => ({
        ...r,
        user_name: profileMap[r.user_id] || "Unknown",
      })) as AttendanceRecord[];
    },
  });
}

export function useActiveClockIn() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["hr-attendance", "active", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("hr_attendance")
        .select("*")
        .eq("user_id", user.id)
        .is("clock_out", null)
        .order("clock_in", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as AttendanceRecord | null;
    },
    enabled: !!user,
  });
}

export function useClockIn() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (notes?: string) => {
      const { error } = await supabase.from("hr_attendance").insert({
        user_id: user!.id,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-attendance"] });
      toast.success("Clocked in");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useClockOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("hr_attendance")
        .update({ clock_out: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hr-attendance"] });
      toast.success("Clocked out");
    },
    onError: (e) => toast.error(e.message),
  });
}
