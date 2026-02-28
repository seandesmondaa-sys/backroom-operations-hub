import { useState } from "react";
import { format } from "date-fns";
import { useAuth } from "@/hooks/use-auth";
import {
  useOSTasks, useCreateOSTask, useUpdateOSTask, useDeleteOSTask, useBatchUpdateTasks,
  type OSTask, type TaskStatus, type TaskPriority, type RecurrenceType,
  STATUS_ORDER, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS,
} from "@/hooks/use-os-tasks";
import { useSubtasks } from "@/hooks/use-os-tasks";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  Plus, Trash2, CalendarIcon, GripVertical, ChevronDown, ChevronRight,
  LayoutGrid, List, CalendarDays,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

// ─── Task Form Dialog ──────────────────────────────────────
function TaskFormDialog({
  open, onOpenChange, initial, onSubmit, isPending,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: Partial<OSTask>;
  onSubmit: (t: Partial<OSTask>) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [status, setStatus] = useState<TaskStatus>(initial?.status || "todo");
  const [priority, setPriority] = useState<TaskPriority>(initial?.priority || "medium");
  const [dueDate, setDueDate] = useState<Date | undefined>(initial?.due_date ? new Date(initial.due_date) : undefined);
  const [recurrence, setRecurrence] = useState<RecurrenceType>(initial?.recurrence || "none");

  const handleSubmit = () => {
    if (!title.trim()) return;
    onSubmit({
      ...initial,
      title: title.trim(),
      description: description || null,
      status,
      priority,
      due_date: dueDate?.toISOString() ?? null,
      recurrence,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-semibold">{initial?.id ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Task title…" value={title} onChange={(e) => setTitle(e.target.value)} className="h-9 text-sm" />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} className="text-sm min-h-[60px]" />
          <div className="grid grid-cols-2 gap-2">
            <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUS_ORDER.map((s) => <SelectItem key={s} value={s} className="text-xs">{STATUS_LABELS[s]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={priority} onValueChange={(v) => setPriority(v as TaskPriority)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["urgent", "high", "medium", "low"] as TaskPriority[]).map((p) => <SelectItem key={p} value={p} className="text-xs">{PRIORITY_LABELS[p]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("h-8 text-xs justify-start", !dueDate && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                  {dueDate ? format(dueDate, "MMM d, yyyy") : "Due date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={dueDate} onSelect={setDueDate} className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <Select value={recurrence} onValueChange={(v) => setRecurrence(v as RecurrenceType)}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(["none", "daily", "weekly", "biweekly", "monthly"] as RecurrenceType[]).map((r) => (
                  <SelectItem key={r} value={r} className="text-xs">{r === "none" ? "No repeat" : r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={isPending || !title.trim()} className="w-full h-8 text-xs">
            {initial?.id ? "Save Changes" : "Create Task"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Subtask Row ──────────────────────────────────────────
function SubtaskList({ parentId }: { parentId: string }) {
  const { data: subtasks = [] } = useSubtasks(parentId);
  const updateTask = useUpdateOSTask();
  const deleteTask = useDeleteOSTask();

  if (!subtasks.length) return null;

  return (
    <div className="pl-8 space-y-1 py-1">
      {subtasks.map((st) => (
        <div key={st.id} className="flex items-center gap-2 px-2 py-1 rounded bg-muted/30 text-xs">
          <input
            type="checkbox"
            checked={st.status === "done"}
            onChange={() => updateTask.mutate({ id: st.id, status: st.status === "done" ? "todo" : "done" })}
            className="rounded"
          />
          <span className={cn("flex-1", st.status === "done" && "line-through text-muted-foreground")}>{st.title}</span>
          <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[st.priority])}>{PRIORITY_LABELS[st.priority]}</Badge>
          <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={() => deleteTask.mutate(st.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      ))}
    </div>
  );
}

// ─── Kanban Board ──────────────────────────────────────────
function KanbanBoard({ tasks, onEdit }: { tasks: OSTask[]; onEdit: (t: OSTask) => void }) {
  const batchUpdate = useBatchUpdateTasks();

  const columns = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_LABELS[status],
    tasks: tasks.filter((t) => t.status === status).sort((a, b) => a.sort_order - b.sort_order),
  }));

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const destStatus = result.destination.droppableId as TaskStatus;
    const sourceStatus = result.source.droppableId as TaskStatus;

    const allInDest = [...columns.find((c) => c.status === destStatus)!.tasks];
    const movedTask = columns.find((c) => c.status === sourceStatus)!.tasks[result.source.index];

    if (sourceStatus === destStatus) {
      allInDest.splice(result.source.index, 1);
    }
    allInDest.splice(result.destination.index, 0, { ...movedTask, status: destStatus });

    const updates = allInDest.map((t, i) => ({ id: t.id, status: destStatus, sort_order: i }));
    if (sourceStatus !== destStatus) {
      updates.push({ id: movedTask.id, status: destStatus, sort_order: result.destination.index });
    }
    batchUpdate.mutate(updates);
  };

  const COLUMN_BORDER: Record<TaskStatus, string> = {
    backlog: "border-t-muted-foreground",
    todo: "border-t-secondary-foreground",
    in_progress: "border-t-info",
    waiting: "border-t-warning",
    done: "border-t-success",
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((col) => (
          <div key={col.status} className={cn("flex-shrink-0 w-64 bg-muted/30 rounded-lg border-t-2", COLUMN_BORDER[col.status])}>
            <div className="px-3 py-2 flex items-center justify-between">
              <h3 className="text-xs font-semibold">{col.label}</h3>
              <Badge variant="secondary" className="text-[10px] h-5">{col.tasks.length}</Badge>
            </div>
            <Droppable droppableId={col.status}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="px-2 pb-2 space-y-1.5 min-h-[100px]">
                  {col.tasks.map((task, idx) => (
                    <Draggable key={task.id} draggableId={task.id} index={idx}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          className={cn("bg-card rounded-md border border-border p-2.5 cursor-pointer hover:shadow-sm transition-shadow", snap.isDragging && "shadow-md")}
                          onClick={() => onEdit(task)}
                        >
                          <div className="flex items-start gap-1.5">
                            <div {...prov.dragHandleProps} className="mt-0.5"><GripVertical className="h-3 w-3 text-muted-foreground" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{task.title}</p>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[task.priority])}>{PRIORITY_LABELS[task.priority]}</Badge>
                                {task.due_date && (
                                  <span className="text-[10px] text-muted-foreground font-mono">
                                    {format(new Date(task.due_date), "MMM d")}
                                  </span>
                                )}
                                {task.recurrence !== "none" && (
                                  <span className="text-[10px] text-accent">↻</span>
                                )}
                              </div>
                              {task.assignee_name && (
                                <p className="text-[10px] text-muted-foreground mt-1">{task.assignee_name}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}

// ─── Table View ──────────────────────────────────────────
function TaskTable({ tasks, onEdit }: { tasks: OSTask[]; onEdit: (t: OSTask) => void }) {
  const deleteTask = useDeleteOSTask();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold w-8" />
            <TableHead className="text-xs font-semibold">Task</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold">Priority</TableHead>
            <TableHead className="text-xs font-semibold">Assignee</TableHead>
            <TableHead className="text-xs font-semibold">Due Date</TableHead>
            <TableHead className="text-xs font-semibold">Recurrence</TableHead>
            <TableHead className="text-xs font-semibold w-16">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((t) => (
            <>
              <TableRow key={t.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => onEdit(t)}>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); toggle(t.id); }}>
                    {expanded.has(t.id) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                  </Button>
                </TableCell>
                <TableCell className="text-sm font-medium">{t.title}</TableCell>
                <TableCell><Badge variant="outline" className={cn("text-[11px]", STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status]}</Badge></TableCell>
                <TableCell><Badge variant="outline" className={cn("text-[11px]", PRIORITY_COLORS[t.priority])}>{PRIORITY_LABELS[t.priority]}</Badge></TableCell>
                <TableCell className="text-sm text-muted-foreground">{t.assignee_name || "—"}</TableCell>
                <TableCell className="text-[11px] font-mono text-muted-foreground">{t.due_date ? format(new Date(t.due_date), "MMM d, yyyy") : "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.recurrence === "none" ? "—" : t.recurrence}</TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); deleteTask.mutate(t.id); }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TableCell>
              </TableRow>
              {expanded.has(t.id) && (
                <TableRow key={`${t.id}-sub`}>
                  <TableCell colSpan={8} className="p-0">
                    <SubtaskList parentId={t.id} />
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
          {tasks.length === 0 && (
            <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No tasks yet</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

// ─── Timeline View ──────────────────────────────────────────
function TimelineView({ tasks }: { tasks: OSTask[] }) {
  const withDates = tasks.filter((t) => t.due_date).sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());
  const noDates = tasks.filter((t) => !t.due_date);

  return (
    <div className="space-y-4">
      {withDates.length > 0 && (
        <div className="relative pl-6">
          <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />
          {withDates.map((t) => (
            <div key={t.id} className="relative flex items-start gap-3 pb-4">
              <div className={cn("absolute left-0 w-[7px] h-[7px] rounded-full mt-1.5 ring-2 ring-background", t.status === "done" ? "bg-success" : t.status === "in_progress" ? "bg-info" : "bg-muted-foreground")} />
              <div className="flex-1 bg-card rounded-md border border-border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium">{t.title}</p>
                  <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status]}</Badge>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-muted-foreground">{format(new Date(t.due_date!), "MMM d, yyyy")}</span>
                  <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[t.priority])}>{PRIORITY_LABELS[t.priority]}</Badge>
                  {t.assignee_name && <span className="text-[10px] text-muted-foreground">→ {t.assignee_name}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {noDates.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">No due date</p>
          <div className="space-y-1">
            {noDates.map((t) => (
              <div key={t.id} className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 text-xs">
                <span className="font-medium">{t.title}</span>
                <Badge variant="outline" className={cn("text-[10px]", STATUS_COLORS[t.status])}>{STATUS_LABELS[t.status]}</Badge>
              </div>
            ))}
          </div>
        </div>
      )}
      {tasks.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No tasks yet</p>}
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────
export default function WorkflowTasksPage() {
  const { data: tasks = [], isLoading } = useOSTasks();
  const createTask = useCreateOSTask();
  const updateTask = useUpdateOSTask();
  const createSubtask = useCreateOSTask();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<OSTask | undefined>(undefined);
  const [subtaskDialogOpen, setSubtaskDialogOpen] = useState(false);
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null);

  const handleEdit = (t: OSTask) => {
    setEditing(t);
    setDialogOpen(true);
  };

  const handleSubmit = (t: Partial<OSTask>) => {
    if (editing?.id) {
      updateTask.mutate({ id: editing.id, ...t }, { onSuccess: () => { setDialogOpen(false); setEditing(undefined); } });
    } else {
      createTask.mutate(t, { onSuccess: () => { setDialogOpen(false); setEditing(undefined); } });
    }
  };

  if (isLoading) {
    return <div><PageHeader title="Workflow" description="Task & workflow engine" /><div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div></div>;
  }

  return (
    <div>
      <PageHeader title="Workflow" description="Task & workflow engine with Kanban, timeline & subtasks">
        <div className="flex gap-2">
          <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(undefined); setDialogOpen(true); }}>
            <Plus className="h-3.5 w-3.5 mr-1.5" /> New Task
          </Button>
        </div>
      </PageHeader>
      <div className="p-6">
        <Tabs defaultValue="kanban">
          <TabsList className="mb-4">
            <TabsTrigger value="kanban" className="text-xs gap-1.5"><LayoutGrid className="h-3.5 w-3.5" /> Kanban</TabsTrigger>
            <TabsTrigger value="table" className="text-xs gap-1.5"><List className="h-3.5 w-3.5" /> Table</TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> Timeline</TabsTrigger>
          </TabsList>
          <TabsContent value="kanban"><KanbanBoard tasks={tasks} onEdit={handleEdit} /></TabsContent>
          <TabsContent value="table"><TaskTable tasks={tasks} onEdit={handleEdit} /></TabsContent>
          <TabsContent value="timeline"><TimelineView tasks={tasks} /></TabsContent>
        </Tabs>
      </div>

      <TaskFormDialog open={dialogOpen} onOpenChange={setDialogOpen} initial={editing} onSubmit={handleSubmit} isPending={createTask.isPending || updateTask.isPending} />

      <TaskFormDialog
        open={subtaskDialogOpen}
        onOpenChange={setSubtaskDialogOpen}
        initial={{ parent_id: subtaskParentId }}
        onSubmit={(t) => {
          createSubtask.mutate(t, { onSuccess: () => setSubtaskDialogOpen(false) });
        }}
        isPending={createSubtask.isPending}
      />
    </div>
  );
}
