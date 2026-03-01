import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export function useLeads() {
  return useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      const { error } = await supabase.from("leads").insert({ ...fields, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, unknown> }) => {
      const { error } = await supabase.from("leads").update(fields as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      toast({ title: "Lead deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useConvertLeadToProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ leadId, leadName }: { leadId: string; leadName: string }) => {
      // 1. Create an OS task to track the new project
      const { error: taskErr } = await supabase.from("os_tasks").insert({
        title: `New Project: ${leadName}`,
        description: `Converted from lead. Requires Legal, Finance, and Operations setup.`,
        status: "todo",
        priority: "high",
        created_by: user!.id,
      });
      if (taskErr) throw taskErr;

      // 2. Mark lead as converted
      const { error: leadErr } = await supabase
        .from("leads")
        .update({ status: "converted" as any, converted_project_id: leadName })
        .eq("id", leadId);
      if (leadErr) throw leadErr;

      // 3. Send notifications to all department heads
      const { data: heads } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "department_head");

      if (heads && heads.length > 0) {
        const notifications = heads.map((h) => ({
          user_id: h.user_id,
          type: "system",
          title: `New Project: ${leadName}`,
          body: `A lead has been converted to an active project. Please review and take action for your department.`,
        }));
        await supabase.from("notifications").insert(notifications);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["leads"] });
      qc.invalidateQueries({ queryKey: ["os-tasks"] });
      toast({ title: "Lead converted to project", description: "Department heads have been notified." });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}
