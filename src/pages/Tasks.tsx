import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTasks } from "@/hooks/use-airtable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import type { Task } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Tasks() {
  const { data: tasks = [], isLoading } = useTasks();

  const overdueTasks = tasks.filter((t) => t.status === "Overdue");
  const inProgressTasks = tasks.filter((t) => t.status === "In Progress");
  const todoTasks = tasks.filter((t) => t.status === "To Do");

  const renderTable = (filteredTasks: Task[]) => (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="text-xs font-semibold">Task</TableHead>
            <TableHead className="text-xs font-semibold">Project</TableHead>
            <TableHead className="text-xs font-semibold">Assignee</TableHead>
            <TableHead className="text-xs font-semibold">Due Date</TableHead>
            <TableHead className="text-xs font-semibold">Priority</TableHead>
            <TableHead className="text-xs font-semibold">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredTasks.map((task) => (
            <TableRow key={task.id} className="hover:bg-muted/30">
              <TableCell className="text-sm font-medium">{task.title}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{task.projectName}</TableCell>
              <TableCell className="text-sm">{task.assignee}</TableCell>
              <TableCell className="text-[11px] font-mono text-muted-foreground">{task.dueDate}</TableCell>
              <TableCell><StatusBadge status={task.priority} /></TableCell>
              <TableCell><StatusBadge status={task.status} /></TableCell>
            </TableRow>
          ))}
          {filteredTasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">No tasks</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Tasks" description="Task manager across all projects" />
        <div className="p-6"><Skeleton className="h-64 w-full rounded-lg" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Tasks" description="Task manager across all projects" />
      <div className="p-6">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all" className="text-xs">All ({tasks.length})</TabsTrigger>
            <TabsTrigger value="overdue" className="text-xs">Overdue ({overdueTasks.length})</TabsTrigger>
            <TabsTrigger value="in-progress" className="text-xs">In Progress ({inProgressTasks.length})</TabsTrigger>
            <TabsTrigger value="todo" className="text-xs">To Do ({todoTasks.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="all">{renderTable(tasks)}</TabsContent>
          <TabsContent value="overdue">{renderTable(overdueTasks)}</TabsContent>
          <TabsContent value="in-progress">{renderTable(inProgressTasks)}</TabsContent>
          <TabsContent value="todo">{renderTable(todoTasks)}</TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
