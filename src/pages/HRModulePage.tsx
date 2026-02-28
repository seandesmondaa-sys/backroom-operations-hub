import { useState } from "react";
import { format, differenceInBusinessDays } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import { useIsSuperAdmin, useAllUserRoles } from "@/hooks/use-roles";
import {
  useLeaveRequests, useCreateLeaveRequest, useReviewLeaveRequest,
  usePerformanceLogs, useCreatePerformanceLog,
  useHRNotes, useCreateHRNote, useDeleteHRNote,
  type LeaveType, type LeaveStatus,
  LEAVE_TYPE_LABELS, LEAVE_STATUS_COLORS,
} from "@/hooks/use-hr";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import {
  Plus, CalendarIcon, Users, Star, FileText, Shield, Check, X, Trash2, Lock,
} from "lucide-react";

// ─── Leave Request Form ────────────────────────────────────
function LeaveFormDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const createLeave = useCreateLeaveRequest();
  const [leaveType, setLeaveType] = useState<LeaveType>("annual");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");

  const daysCount = startDate && endDate ? Math.max(1, differenceInBusinessDays(endDate, startDate) + 1) : 1;

  const handleSubmit = () => {
    if (!startDate || !endDate) return;
    createLeave.mutate({
      leave_type: leaveType,
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
      days_count: daysCount,
      reason: reason || null,
    }, { onSuccess: () => { onOpenChange(false); setStartDate(undefined); setEndDate(undefined); setReason(""); } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Request Leave</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={leaveType} onValueChange={(v) => setLeaveType(v as LeaveType)}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(LEAVE_TYPE_LABELS) as LeaveType[]).map((t) => (
                <SelectItem key={t} value={t} className="text-xs">{LEAVE_TYPE_LABELS[t]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 text-xs justify-start", !startDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />{startDate ? format(startDate, "MMM d") : "Start"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={startDate} onSelect={setStartDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 text-xs justify-start", !endDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-1" />{endDate ? format(endDate, "MMM d") : "End"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={endDate} onSelect={setEndDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
          </div>
          {startDate && endDate && <p className="text-xs text-muted-foreground">{daysCount} business day{daysCount !== 1 ? "s" : ""}</p>}
          <Textarea placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} className="text-sm min-h-[50px]" />
          <Button onClick={handleSubmit} disabled={createLeave.isPending || !startDate || !endDate} className="w-full h-8 text-xs">Submit Request</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Performance Log Form ──────────────────────────────────
function PerfLogDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: members = [] } = useAllUserRoles();
  const createLog = useCreatePerformanceLog();
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState("");
  const [rating, setRating] = useState("3");
  const [strengths, setStrengths] = useState("");
  const [improvements, setImprovements] = useState("");
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    if (!userId || !period) return;
    createLog.mutate({
      user_id: userId, period, rating: parseInt(rating),
      strengths: strengths || null, improvements: improvements || null, notes: notes || null,
    }, { onSuccess: () => { onOpenChange(false); setUserId(""); setPeriod(""); setStrengths(""); setImprovements(""); setNotes(""); } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle className="text-sm font-semibold">Add Performance Log</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select staff member…" /></SelectTrigger>
            <SelectContent>{members.map((m) => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.display_name}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Period (e.g. Q1 2026)" value={period} onChange={(e) => setPeriod(e.target.value)} className="h-8 text-xs" />
          <div>
            <p className="text-xs font-medium mb-1">Rating</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((r) => (
                <button key={r} onClick={() => setRating(String(r))} className={cn("h-8 w-8 rounded-md text-xs font-medium transition-colors", parseInt(rating) >= r ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground")}>
                  <Star className={cn("h-4 w-4 mx-auto", parseInt(rating) >= r && "fill-warning")} />
                </button>
              ))}
            </div>
          </div>
          <Textarea placeholder="Strengths" value={strengths} onChange={(e) => setStrengths(e.target.value)} className="text-sm min-h-[40px]" />
          <Textarea placeholder="Areas for improvement" value={improvements} onChange={(e) => setImprovements(e.target.value)} className="text-sm min-h-[40px]" />
          <Textarea placeholder="Additional notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="text-sm min-h-[40px]" />
          <Button onClick={handleSubmit} disabled={createLog.isPending || !userId || !period} className="w-full h-8 text-xs">Save Log</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── HR Note Form ──────────────────────────────────────────
function NoteDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { data: members = [] } = useAllUserRoles();
  const createNote = useCreateHRNote();
  const [userId, setUserId] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = () => {
    if (!userId || !content.trim()) return;
    createNote.mutate({ user_id: userId, content: content.trim(), is_confidential: true }, {
      onSuccess: () => { onOpenChange(false); setUserId(""); setContent(""); },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-sm font-semibold flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Confidential Note</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Select value={userId} onValueChange={setUserId}>
            <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select staff member…" /></SelectTrigger>
            <SelectContent>{members.map((m) => <SelectItem key={m.user_id} value={m.user_id} className="text-xs">{m.display_name}</SelectItem>)}</SelectContent>
          </Select>
          <Textarea placeholder="Confidential note…" value={content} onChange={(e) => setContent(e.target.value)} className="text-sm min-h-[80px]" />
          <Button onClick={handleSubmit} disabled={createNote.isPending || !userId || !content.trim()} className="w-full h-8 text-xs">Save Note</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main HR Page ──────────────────────────────────────────
export default function HRModulePage() {
  const { user } = useAuth();
  const { isSuperAdmin } = useIsSuperAdmin();
  const { data: members = [], isLoading: membersLoading } = useAllUserRoles();
  const { data: leaves = [], isLoading: leavesLoading } = useLeaveRequests();
  const { data: perfLogs = [], isLoading: perfLoading } = usePerformanceLogs();
  const { data: hrNotes = [], isLoading: notesLoading } = useHRNotes();
  const reviewLeave = useReviewLeaveRequest();
  const deleteNote = useDeleteHRNote();

  const [leaveOpen, setLeaveOpen] = useState(false);
  const [perfOpen, setPerfOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  const isManager = isSuperAdmin; // department_head check also applies via RLS

  const isLoading = membersLoading || leavesLoading;

  if (isLoading) {
    return <div><PageHeader title="HR" description="Human Resources" /><div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div></div>;
  }

  return (
    <div>
      <PageHeader title="HR Module" description="Staff profiles, leave, performance & notes" />
      <div className="p-6">
        <Tabs defaultValue="staff">
          <TabsList>
            <TabsTrigger value="staff" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Staff</TabsTrigger>
            <TabsTrigger value="leave" className="text-xs gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Leave</TabsTrigger>
            {isManager && <TabsTrigger value="performance" className="text-xs gap-1.5"><Star className="h-3.5 w-3.5" /> Performance</TabsTrigger>}
            {isManager && <TabsTrigger value="notes" className="text-xs gap-1.5"><Lock className="h-3.5 w-3.5" /> Notes</TabsTrigger>}
          </TabsList>

          {/* ── Staff Profiles ── */}
          <TabsContent value="staff" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((m) => (
                <Card key={m.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                          {m.display_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{m.display_name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      {m.role && (
                        <Badge variant="outline" className="text-[10px]">
                          {m.role.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ── Leave Tracking ── */}
          <TabsContent value="leave" className="mt-4 space-y-4">
            <div className="flex justify-end">
              <Button size="sm" className="h-8 text-xs" onClick={() => setLeaveOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Request Leave
              </Button>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Staff</TableHead>
                    <TableHead className="text-xs font-semibold">Type</TableHead>
                    <TableHead className="text-xs font-semibold">Dates</TableHead>
                    <TableHead className="text-xs font-semibold">Days</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Reason</TableHead>
                    {isManager && <TableHead className="text-xs font-semibold w-24">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((l) => (
                    <TableRow key={l.id}>
                      <TableCell className="text-xs font-medium">{l.user_name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{LEAVE_TYPE_LABELS[l.leave_type]}</Badge></TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">
                        {format(new Date(l.start_date), "MMM d")} – {format(new Date(l.end_date), "MMM d")}
                      </TableCell>
                      <TableCell className="text-xs">{l.days_count}</TableCell>
                      <TableCell><Badge variant="outline" className={cn("text-[10px]", LEAVE_STATUS_COLORS[l.status])}>{l.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{l.reason || "—"}</TableCell>
                      {isManager && (
                        <TableCell>
                          {l.status === "pending" && (
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-success" onClick={() => reviewLeave.mutate({ id: l.id, status: "approved" })}>
                                <Check className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => reviewLeave.mutate({ id: l.id, status: "rejected" })}>
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow><TableCell colSpan={isManager ? 7 : 6} className="text-center text-sm text-muted-foreground py-8">No leave requests</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Performance Logs ── */}
          {isManager && (
            <TabsContent value="performance" className="mt-4 space-y-4">
              <div className="flex justify-end">
                <Button size="sm" className="h-8 text-xs" onClick={() => setPerfOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Log
                </Button>
              </div>
              {perfLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-3">
                  {perfLogs.map((log) => (
                    <Card key={log.id}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{log.user_name}</p>
                            <Badge variant="outline" className="text-[10px]">{log.period}</Badge>
                          </div>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((r) => (
                              <Star key={r} className={cn("h-3.5 w-3.5", (log.rating ?? 0) >= r ? "fill-warning text-warning" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                        {log.strengths && (
                          <div><p className="text-[10px] font-semibold text-success">Strengths</p><p className="text-xs text-muted-foreground">{log.strengths}</p></div>
                        )}
                        {log.improvements && (
                          <div><p className="text-[10px] font-semibold text-warning">Improvements</p><p className="text-xs text-muted-foreground">{log.improvements}</p></div>
                        )}
                        {log.notes && <p className="text-xs text-muted-foreground">{log.notes}</p>}
                        <p className="text-[10px] text-muted-foreground">Logged by {log.logged_by_name} · {format(new Date(log.created_at), "MMM d, yyyy")}</p>
                      </CardContent>
                    </Card>
                  ))}
                  {perfLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No performance logs yet</p>}
                </div>
              )}
            </TabsContent>
          )}

          {/* ── Confidential Notes ── */}
          {isManager && (
            <TabsContent value="notes" className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" /> Visible only to Super Admins & Department Heads</p>
                <Button size="sm" className="h-8 text-xs" onClick={() => setNoteOpen(true)}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Note
                </Button>
              </div>
              {notesLoading ? <Skeleton className="h-48 w-full" /> : (
                <div className="space-y-2">
                  {hrNotes.map((note) => (
                    <Card key={note.id} className="border-warning/20">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs font-medium">{note.user_name}</p>
                              <Badge variant="outline" className="text-[9px] h-4 bg-warning/5 text-warning border-warning/20">
                                <Lock className="h-2.5 w-2.5 mr-0.5" /> Confidential
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                            <p className="text-[10px] text-muted-foreground mt-1.5">By {note.author_name} · {format(new Date(note.created_at), "MMM d, yyyy")}</p>
                          </div>
                          {note.author_id === user?.id && (
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive shrink-0" onClick={() => deleteNote.mutate(note.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {hrNotes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">No confidential notes</p>}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      <LeaveFormDialog open={leaveOpen} onOpenChange={setLeaveOpen} />
      <PerfLogDialog open={perfOpen} onOpenChange={setPerfOpen} />
      <NoteDialog open={noteOpen} onOpenChange={setNoteOpen} />
    </div>
  );
}
