import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: string;
  old_data: Record<string, any> | null;
  new_data: Record<string, any> | null;
  performed_by: string | null;
  performed_at: string;
  performer_name?: string;
}

export function useAuditLogs(filters?: { table_name?: string; action?: string }) {
  return useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("*")
        .order("performed_at", { ascending: false })
        .limit(200);

      if (filters?.table_name) q = q.eq("table_name", filters.table_name);
      if (filters?.action) q = q.eq("action", filters.action);

      const { data, error } = await q;
      if (error) throw error;

      // Enrich with performer names
      const userIds = [...new Set((data || []).map((l: any) => l.performed_by).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((l: any) => ({
        ...l,
        performer_name: l.performed_by ? profileMap[l.performed_by] || "System" : "System",
      })) as AuditLog[];
    },
  });
}
