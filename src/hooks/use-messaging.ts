import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export interface MessageThread {
  id: string;
  title: string;
  entity_type: string;
  entity_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  sender_profile?: { display_name: string; avatar_url: string | null };
}

export interface ThreadParticipant {
  id: string;
  thread_id: string;
  user_id: string;
  joined_at: string;
  profile?: { display_name: string; avatar_url: string | null };
}

export function useThreads() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchThreads = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("message_threads")
      .select("*")
      .order("updated_at", { ascending: false });
    if (data) setThreads(data as unknown as MessageThread[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchThreads(); }, [fetchThreads]);

  const createThread = async (title: string, entityType: string, entityId?: string) => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("message_threads")
      .insert({ title, entity_type: entityType, entity_id: entityId || null, created_by: user.id } as never)
      .select()
      .single();
    if (error) return null;
    const thread = data as unknown as MessageThread;
    // Add creator as participant
    await supabase.from("thread_participants").insert({ thread_id: thread.id, user_id: user.id } as never);
    setThreads((prev) => [thread, ...prev]);
    return thread;
  };

  return { threads, loading, createThread, refetch: fetchThreads };
}

export function useMessages(threadId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!threadId) { setMessages([]); setLoading(false); return; }
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch sender profiles
      const senderIds = [...new Set((data as any[]).map((m) => m.sender_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, avatar_url")
        .in("user_id", senderIds);

      const profileMap = new Map((profiles as any[] || []).map((p) => [p.user_id, p]));
      const enriched = (data as any[]).map((m) => ({
        ...m,
        sender_profile: profileMap.get(m.sender_id) || { display_name: "Unknown", avatar_url: null },
      }));
      setMessages(enriched as Message[]);
    }
    setLoading(false);
  }, [threadId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!threadId) return;
    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `thread_id=eq.${threadId}` },
        async (payload) => {
          const msg = payload.new as any;
          const { data: profile } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .eq("user_id", msg.sender_id)
            .single();
          setMessages((prev) => [...prev, { ...msg, sender_profile: profile || { display_name: "Unknown", avatar_url: null } }]);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [threadId]);

  const sendMessage = async (content: string) => {
    if (!user || !threadId || !content.trim()) return;
    await supabase.from("messages").insert({
      thread_id: threadId,
      sender_id: user.id,
      content: content.trim(),
    } as never);
  };

  return { messages, loading, sendMessage };
}

export function useThreadParticipants(threadId: string | null) {
  const [participants, setParticipants] = useState<ThreadParticipant[]>([]);

  useEffect(() => {
    if (!threadId) return;
    (async () => {
      const { data } = await supabase
        .from("thread_participants")
        .select("*")
        .eq("thread_id", threadId);
      if (data) {
        const userIds = (data as any[]).map((p) => p.user_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", userIds);
        const profileMap = new Map((profiles as any[] || []).map((p) => [p.user_id, p]));
        setParticipants(
          (data as any[]).map((p) => ({ ...p, profile: profileMap.get(p.user_id) }))
        );
      }
    })();
  }, [threadId]);

  const addParticipant = async (userId: string) => {
    if (!threadId) return;
    await supabase.from("thread_participants").insert({ thread_id: threadId, user_id: userId } as never);
  };

  return { participants, addParticipant };
}
