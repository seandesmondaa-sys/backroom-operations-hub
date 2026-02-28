import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type TaskStatus = "backlog" | "todo" | "in_progress" | "waiting" | "done";
export type TaskPriority = "urgent" | "high" | "medium" | "low";
export type RecurrenceType = "none" | "daily" | "weekly" | "biweekly" | "monthly";

export interface OSTask {
  id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignee_id: string | null;
  created_by: string;
  project_id: string | null;
  department_id: string | null;
  due_date: string | null;
  completed_at: string | null;
  recurrence: RecurrenceType;
  recurrence_next: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // joined
  subtasks?: OSTask[];
  assignee_name?: string;
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  waiting: "Waiting",
  done: "Done",
};

export const STATUS_ORDER: TaskStatus[] = ["backlog", "todo", "in_progress", "waiting", "done"];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  urgent: "Urgent",
  high: "High",
  medium: "Medium",
  low: "Low",
};

export const STATUS_COLORS: Record<TaskStatus, string> = {
  backlog: "bg-muted text-muted-foreground",
  todo: "bg-secondary text-secondary-foreground",
  in_progress: "bg-info/10 text-info",
  waiting: "bg-warning/10 text-warning",
  done: "bg-success/10 text-success",
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-warning/10 text-warning",
  medium: "bg-info/10 text-info",
  low: "bg-muted text-muted-foreground",
};

// Fetch all top-level tasks with subtask counts
export function useOSTasks() {
  return useQuery({
    queryKey: ["os-tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("os_tasks")
        .select("*")
        .is("parent_id", null)
        .order("sort_order")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // Fetch profiles for assignee names
      const assigneeIds = [...new Set((data || []).map(t => t.assignee_id).filter(Boolean))];
      let profileMap: Record<string, string> = {};
      if (assigneeIds.length) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", assigneeIds);
        profileMap = Object.fromEntries((profiles || []).map(p => [p.user_id, p.display_name]));
      }

      return (data || []).map(t => ({
        ...t,
        assignee_name: t.assignee_id ? profileMap[t.assignee_id] : undefined,
      })) as OSTask[];
    },
  });
}

// Fetch subtasks for a parent
export function useSubtasks(parentId: string | null) {
  return useQuery({
    queryKey: ["os-tasks", "subtasks", parentId],
    queryFn: async () => {
      if (!parentId) return [];
      const { data, error } = await supabase
        .from("os_tasks")
        .select("*")
        .eq("parent_id", parentId)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return (data || []) as OSTask[];
    },
    enabled: !!parentId,
  });
}

export function useCreateOSTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (task: Partial<OSTask>) => {
      const { error } = await supabase.from("os_tasks").insert({
        title: task.title!,
        description: task.description ?? null,
        status: task.status ?? "todo",
        priority: task.priority ?? "medium",
        assignee_id: task.assignee_id ?? null,
        created_by: user!.id,
        parent_id: task.parent_id ?? null,
        project_id: task.project_id ?? null,
        department_id: task.department_id ?? null,
        due_date: task.due_date ?? null,
        recurrence: task.recurrence ?? "none",
        sort_order: task.sort_order ?? 0,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-tasks"] });
      toast.success("Task created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateOSTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<OSTask> & { id: string }) => {
      const update: Record<string, unknown> = {};
      if (fields.title !== undefined) update.title = fields.title;
      if (fields.description !== undefined) update.description = fields.description;
      if (fields.status !== undefined) {
        update.status = fields.status;
        if (fields.status === "done") update.completed_at = new Date().toISOString();
        else update.completed_at = null;
      }
      if (fields.priority !== undefined) update.priority = fields.priority;
      if (fields.assignee_id !== undefined) update.assignee_id = fields.assignee_id;
      if (fields.due_date !== undefined) update.due_date = fields.due_date;
      if (fields.recurrence !== undefined) update.recurrence = fields.recurrence;
      if (fields.sort_order !== undefined) update.sort_order = fields.sort_order;
      if (fields.department_id !== undefined) update.department_id = fields.department_id;
      if (fields.project_id !== undefined) update.project_id = fields.project_id;

      const { error } = await supabase.from("os_tasks").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-tasks"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteOSTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("os_tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-tasks"] });
      toast.success("Task deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}

// Batch update sort_order and status (for Kanban drag)
export function useBatchUpdateTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: { id: string; status: TaskStatus; sort_order: number }[]) => {
      for (const u of updates) {
        const upd: Record<string, unknown> = { status: u.status, sort_order: u.sort_order };
        if (u.status === "done") upd.completed_at = new Date().toISOString();
        const { error } = await supabase.from("os_tasks").update(upd).eq("id", u.id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["os-tasks"] }),
    onError: (e) => toast.error(e.message),
  });
}
