import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type EventType = "meeting" | "follow_up" | "deadline" | "reminder" | "other";

export interface OSEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: EventType;
  start_time: string;
  end_time: string;
  all_day: boolean;
  location: string | null;
  created_by: string;
  department_id: string | null;
  project_id: string | null;
  is_global: boolean;
  color: string | null;
  created_at: string;
  updated_at: string;
  // joined
  attendees?: EventAttendee[];
  creator_name?: string;
}

export interface EventAttendee {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  display_name?: string;
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  meeting: "Meeting",
  follow_up: "Follow-up",
  deadline: "Deadline",
  reminder: "Reminder",
  other: "Other",
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  meeting: "hsl(var(--info))",
  follow_up: "hsl(var(--warning))",
  deadline: "hsl(var(--destructive))",
  reminder: "hsl(var(--accent))",
  other: "hsl(var(--muted-foreground))",
};

export function useOSEvents(month?: Date) {
  return useQuery({
    queryKey: ["os-events", month?.toISOString()],
    queryFn: async () => {
      let query = supabase.from("os_events").select("*").order("start_time");

      if (month) {
        const start = new Date(month.getFullYear(), month.getMonth(), 1).toISOString();
        const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59).toISOString();
        query = query.gte("start_time", start).lte("start_time", end);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch attendees for all events
      const eventIds = (data || []).map((e) => e.id);
      let attendeeMap: Record<string, EventAttendee[]> = {};
      if (eventIds.length) {
        const { data: att } = await supabase
          .from("os_event_attendees")
          .select("*")
          .in("event_id", eventIds);

        if (att?.length) {
          const userIds = [...new Set(att.map((a) => a.user_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name")
            .in("user_id", userIds);
          const nameMap = Object.fromEntries((profiles || []).map((p) => [p.user_id, p.display_name]));

          att.forEach((a) => {
            if (!attendeeMap[a.event_id]) attendeeMap[a.event_id] = [];
            attendeeMap[a.event_id].push({ ...a, display_name: nameMap[a.user_id] });
          });
        }
      }

      return (data || []).map((e) => ({
        ...e,
        attendees: attendeeMap[e.id] || [],
      })) as OSEvent[];
    },
  });
}

export function useCreateOSEvent() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (event: Partial<OSEvent> & { attendee_ids?: string[] }) => {
      const { data, error } = await supabase.from("os_events").insert({
        title: event.title!,
        description: event.description ?? null,
        event_type: event.event_type ?? "meeting",
        start_time: event.start_time!,
        end_time: event.end_time!,
        all_day: event.all_day ?? false,
        location: event.location ?? null,
        created_by: user!.id,
        department_id: event.department_id ?? null,
        project_id: event.project_id ?? null,
        is_global: event.is_global ?? false,
        color: event.color ?? null,
      }).select().single();
      if (error) throw error;

      // Add attendees
      if (event.attendee_ids?.length) {
        const { error: attErr } = await supabase.from("os_event_attendees").insert(
          event.attendee_ids.map((uid) => ({ event_id: data.id, user_id: uid }))
        );
        if (attErr) throw attErr;
      }

      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-events"] });
      toast.success("Event created");
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useUpdateOSEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<OSEvent> & { id: string }) => {
      const update: Record<string, unknown> = {};
      if (fields.title !== undefined) update.title = fields.title;
      if (fields.description !== undefined) update.description = fields.description;
      if (fields.event_type !== undefined) update.event_type = fields.event_type;
      if (fields.start_time !== undefined) update.start_time = fields.start_time;
      if (fields.end_time !== undefined) update.end_time = fields.end_time;
      if (fields.all_day !== undefined) update.all_day = fields.all_day;
      if (fields.location !== undefined) update.location = fields.location;
      if (fields.department_id !== undefined) update.department_id = fields.department_id;
      if (fields.is_global !== undefined) update.is_global = fields.is_global;

      const { error } = await supabase.from("os_events").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-events"] });
    },
    onError: (e) => toast.error(e.message),
  });
}

export function useDeleteOSEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("os_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["os-events"] });
      toast.success("Event deleted");
    },
    onError: (e) => toast.error(e.message),
  });
}
