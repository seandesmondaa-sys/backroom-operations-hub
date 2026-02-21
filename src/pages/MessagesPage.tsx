import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useThreads, useMessages, useThreadParticipants } from "@/hooks/use-messaging";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageHeader";
import { MessageSquare, Send, Plus, Hash, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const ENTITY_TYPES = [
  { value: "general", label: "General" },
  { value: "project", label: "Project" },
  { value: "client", label: "Client" },
  { value: "deal", label: "Deal" },
];

const entityBadgeColor: Record<string, string> = {
  general: "bg-muted text-muted-foreground",
  project: "bg-primary/10 text-primary",
  client: "bg-info/10 text-info",
  deal: "bg-warning/10 text-warning",
};

export default function MessagesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedThreadId = searchParams.get("thread");
  const { threads, loading: threadsLoading, createThread } = useThreads();
  const { messages, loading: msgsLoading, sendMessage } = useMessages(selectedThreadId);
  const { participants } = useThreadParticipants(selectedThreadId);
  const { user } = useAuth();
  const [msgInput, setMsgInput] = useState("");
  const [newThreadOpen, setNewThreadOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEntityType, setNewEntityType] = useState("general");
  const [newEntityId, setNewEntityId] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!msgInput.trim()) return;
    await sendMessage(msgInput);
    setMsgInput("");
  };

  const handleCreateThread = async () => {
    if (!newTitle.trim()) return;
    const thread = await createThread(newTitle.trim(), newEntityType, newEntityId || undefined);
    if (thread) {
      setSearchParams({ thread: thread.id });
      setNewThreadOpen(false);
      setNewTitle("");
      setNewEntityType("general");
      setNewEntityId("");
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <PageHeader title="Messages" description="Internal team communication" />

      <div className="flex flex-1 overflow-hidden border-t">
        {/* Thread list */}
        <div className="w-72 border-r flex flex-col shrink-0">
          <div className="p-3 border-b">
            <Dialog open={newThreadOpen} onOpenChange={setNewThreadOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="w-full gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" /> New Thread
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Thread</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Thread title" className="h-9 text-sm" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Category</Label>
                    <Select value={newEntityType} onValueChange={setNewEntityType}>
                      <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ENTITY_TYPES.map((t) => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {newEntityType !== "general" && (
                    <div className="space-y-2">
                      <Label className="text-xs">Reference ID (optional)</Label>
                      <Input value={newEntityId} onChange={(e) => setNewEntityId(e.target.value)} placeholder="e.g. project name or ID" className="h-9 text-sm" />
                    </div>
                  )}
                  <Button onClick={handleCreateThread} className="w-full text-sm">Create</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <ScrollArea className="flex-1">
            {threadsLoading ? (
              <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
            ) : threads.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">No threads yet</p>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => setSearchParams({ thread: thread.id })}
                  className={`w-full text-left px-4 py-3 border-b hover:bg-muted/50 transition-colors ${
                    selectedThreadId === thread.id ? "bg-muted" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-xs font-medium truncate">{thread.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${entityBadgeColor[thread.entity_type] || ""}`}>
                      {thread.entity_type}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(thread.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </button>
              ))
            )}
          </ScrollArea>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          {!selectedThread ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p className="text-sm">Select a thread or create a new one</p>
              </div>
            </div>
          ) : (
            <>
              {/* Thread header */}
              <div className="px-4 py-3 border-b flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                    {selectedThread.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 ${entityBadgeColor[selectedThread.entity_type] || ""}`}>
                      {selectedThread.entity_type}
                    </Badge>
                    {selectedThread.entity_id && (
                      <span className="text-[10px] text-muted-foreground">{selectedThread.entity_id}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">{participants.length}</span>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 px-4 py-3">
                {msgsLoading ? (
                  <p className="text-xs text-muted-foreground text-center py-8">Loading…</p>
                ) : messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user?.id;
                      const initials = (msg.sender_profile?.display_name || "?")
                        .split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <div key={msg.id} className={`flex gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
                          <Avatar className="h-7 w-7 shrink-0">
                            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">{initials}</AvatarFallback>
                          </Avatar>
                          <div className={`max-w-[70%] ${isOwn ? "text-right" : ""}`}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-medium">{msg.sender_profile?.display_name || "Unknown"}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                              </span>
                            </div>
                            <div className={`rounded-lg px-3 py-2 text-sm ${
                              isOwn ? "bg-primary text-primary-foreground" : "bg-muted"
                            }`}>
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="px-4 py-3 border-t">
                <div className="flex gap-2">
                  <Textarea
                    value={msgInput}
                    onChange={(e) => setMsgInput(e.target.value)}
                    placeholder="Type a message…"
                    className="min-h-[40px] max-h-24 resize-none text-sm"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                  <Button size="icon" onClick={handleSend} disabled={!msgInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
