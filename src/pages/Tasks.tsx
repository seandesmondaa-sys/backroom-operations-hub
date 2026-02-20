import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from "@/hooks/use-airtable";
import { RecordDialog, type FieldDef } from "@/components/RecordDialog";
import type { Task } from "@/lib/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

const taskFields: FieldDef[] = [
  { key: "Title", label: "Title", type: "text", required: true },
  { key: "Assignee", label: "Assignee", type: "text" },
  { key: "Due Date", label: "Due Date", type: "date" },
  { key: "Priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
  { key: "Status", label: "Status", type: "select", options: ["To Do", "In Progress", "Done", "Overdue"] },
];

export default function Tasks() {
  const { data: tasks = [], isLoading } = useTasks();
  const create = useCreateTask();
  const update = useUpdateTask();
  const del = useDeleteTask();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const handleSubmit = (fields: Record<string, unknown>) => {
    if (editing) {
      update.mutate({ id: editing.id, fields }, { onSuccess: () => { setDialogOpen(false); setEditing(null); } });
    } else {
      create.mutate(fields, { onSuccess: () => setDialogOpen(false) });
    }
  };

  const overdue = tasks.filter((t) => String(t.Status) === "Overdue");
  const inProgress = tasks.filter((t) => String(t.Status) === "In Progress");
  const todo = tasks.filter((t) => String(t.Status) === "To Do");

  const renderTable = (list: Task[]) => (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">Task</TableHead>
            <TableHead className="text-xs font-semibold">Assignee</TableHead>
            <TableHead className="text-xs font-semibold">Due Date</TableHead>
            <TableHead className="text-xs font-semibold">Priority</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
            <TableHead className="text-xs font-semibold w-20">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((t) => (
            <TableRow key={t.id} className="hover:bg-muted/30">
              <TableCell className="text-sm font-medium">{String(t.Title || "")}</TableCell>
              <TableCell className="text-sm">{String(t.Assignee || "")}</TableCell>
              <TableCell className="text-[11px] font-mono text-muted-foreground">{String(t["Due Date"] || "")}</TableCell>
              <TableCell><StatusBadge status={String(t.Priority || "")} /></TableCell>
              <TableCell><StatusBadge status={String(t.Status || "")} /></TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setEditing(t); setDialogOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => del.mutate(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {list.length === 0 && (
            <TableRow><TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No tasks</TableCell></TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) return <div><PageHeader title="Tasks" description="Task manager" /><div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div></div>;

  return (
    <div>
      <PageHeader title="Tasks" description="Task manager across all projects">
        <Button size="sm" className="h-8 text-xs" onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Task
        </Button>
      </PageHeader>
      <div className="p-6">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="text-xs">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs">Overdue ({overdue.length})</TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">In Progress ({inProgress.length})</TabsTrigger>
            <TabsTrigger value="todo" className="text-xs">To Do ({todo.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderTable(tasks)}</TabsContent>
          <TabsContent value="overdue">{renderTable(overdue)}</TabsContent>
          <TabsContent value="in-progress">{renderTable(inProgress)}</TabsContent>
          <TabsContent value="todo">{renderTable(todo)}</TabsContent>
        </Tabs>
      </div>
      <RecordDialog open={dialogOpen} onOpenChange={setDialogOpen} title={editing ? "Edit Task" : "New Task"} fields={taskFields} initialValues={editing || undefined} onSubmit={handleSubmit} isLoading={create.isPending || update.isPending} />
    </div>
  );
}
