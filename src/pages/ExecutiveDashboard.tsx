import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useOSTasks, STATUS_LABELS, STATUS_COLORS, PRIORITY_LABELS, PRIORITY_COLORS, type OSTask } from "@/hooks/use-os-tasks";
import { useProjects } from "@/hooks/use-airtable";
import { useDepartments, useAllUserRoles } from "@/hooks/use-roles";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, addDays } from "date-fns";
import {
  FolderKanban, AlertTriangle, Users, CheckCircle2, Clock, TrendingUp, BarChart3,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

// ─── Stat Card ─────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, color }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Overdue Task Row ──────────────────────────────────────
function OverdueRow({ task }: { task: OSTask }) {
  const daysOverdue = task.due_date
    ? Math.floor((Date.now() - new Date(task.due_date).getTime()) / 86400000)
    : 0;
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-md bg-destructive/5 border border-destructive/10">
      <div className="flex items-center gap-2 min-w-0">
        <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />
        <span className="text-xs font-medium truncate">{task.title}</span>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant="outline" className={cn("text-[10px]", PRIORITY_COLORS[task.priority])}>
          {PRIORITY_LABELS[task.priority]}
        </Badge>
        <span className="text-[10px] text-destructive font-mono">{daysOverdue}d overdue</span>
      </div>
    </div>
  );
}

const PIE_COLORS = [
  "hsl(var(--info))",
  "hsl(var(--warning))",
  "hsl(var(--success))",
  "hsl(var(--destructive))",
  "hsl(var(--accent))",
  "hsl(var(--muted-foreground))",
];

export default function ExecutiveDashboard() {
  const { data: tasks = [], isLoading: tasksLoading } = useOSTasks();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: departments = [], isLoading: deptsLoading } = useDepartments();
  const { data: users = [], isLoading: usersLoading } = useAllUserRoles();

  const isLoading = tasksLoading || projectsLoading || deptsLoading || usersLoading;

  const stats = useMemo(() => {
    const overdueTasks = tasks.filter(
      (t) => t.due_date && isPast(new Date(t.due_date)) && t.status !== "done"
    );
    const completedTasks = tasks.filter((t) => t.status === "done");
    const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
    const dueSoon = tasks.filter(
      (t) => t.due_date && !isPast(new Date(t.due_date)) && new Date(t.due_date) <= addDays(new Date(), 7) && t.status !== "done"
    );

    const activeProjects = projects.filter(
      (p) => !["Closed", "Dead"].includes(String(p.Stage || ""))
    );

    // Tasks by status for chart
    const tasksByStatus = [
      { name: "Backlog", count: tasks.filter((t) => t.status === "backlog").length },
      { name: "To Do", count: tasks.filter((t) => t.status === "todo").length },
      { name: "In Progress", count: inProgressTasks.length },
      { name: "Waiting", count: tasks.filter((t) => t.status === "waiting").length },
      { name: "Done", count: completedTasks.length },
    ];

    // Projects by stage for pie chart
    const stageMap: Record<string, number> = {};
    projects.forEach((p) => {
      const stage = String(p.Stage || "Unknown");
      stageMap[stage] = (stageMap[stage] || 0) + 1;
    });
    const projectsByStage = Object.entries(stageMap).map(([name, value]) => ({ name, value }));

    // Department performance (tasks assigned to users in each department)
    const deptPerf = departments.map((d) => {
      const deptUserIds = users.filter((u) => u.department_id === d.id).map((u) => u.user_id);
      const deptTasks = tasks.filter((t) => t.assignee_id && deptUserIds.includes(t.assignee_id));
      const done = deptTasks.filter((t) => t.status === "done").length;
      const total = deptTasks.length;
      return {
        name: d.name,
        total,
        done,
        completion: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    return {
      overdueTasks,
      completedTasks,
      inProgressTasks,
      dueSoon,
      activeProjects,
      tasksByStatus,
      projectsByStage,
      deptPerf,
      completionRate: tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
    };
  }, [tasks, projects, departments, users]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="Executive Dashboard" description="Organization overview" />
        <div className="p-6 grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
          <Skeleton className="h-64 col-span-2 rounded-lg" />
          <Skeleton className="h-64 col-span-2 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Executive Dashboard" description="Real-time organization overview" />
      <div className="p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            title="Active Projects"
            value={stats.activeProjects.length}
            subtitle={`${projects.length} total`}
            icon={FolderKanban}
            color="bg-info/10 text-info"
          />
          <StatCard
            title="Overdue Tasks"
            value={stats.overdueTasks.length}
            subtitle={`${stats.dueSoon.length} due this week`}
            icon={AlertTriangle}
            color="bg-destructive/10 text-destructive"
          />
          <StatCard
            title="In Progress"
            value={stats.inProgressTasks.length}
            subtitle={`${tasks.length} total tasks`}
            icon={Clock}
            color="bg-warning/10 text-warning"
          />
          <StatCard
            title="Completion Rate"
            value={`${stats.completionRate}%`}
            subtitle={`${stats.completedTasks.length} completed`}
            icon={CheckCircle2}
            color="bg-success/10 text-success"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks by Status Bar Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" /> Tasks by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stats.tasksByStatus} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Projects by Stage Pie Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FolderKanban className="h-4 w-4 text-muted-foreground" /> Projects by Stage
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.projectsByStage.length > 0 ? (
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={stats.projectsByStage} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                        {stats.projectsByStage.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5">
                    {stats.projectsByStage.map((s, i) => (
                      <div key={s.name} className="flex items-center gap-2 text-xs">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{s.name}</span>
                        <span className="font-semibold">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No project data</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row: Overdue + Department Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Overdue Tasks */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" /> Overdue Tasks
                {stats.overdueTasks.length > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5">{stats.overdueTasks.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.overdueTasks.length > 0 ? (
                <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                  {stats.overdueTasks
                    .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
                    .map((t) => <OverdueRow key={t.id} task={t} />)}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-success" /> No overdue tasks
                </div>
              )}
            </CardContent>
          </Card>

          {/* Department Performance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" /> Department Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats.deptPerf.length > 0 ? (
                <div className="space-y-3">
                  {stats.deptPerf.map((d) => (
                    <div key={d.name} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{d.name}</span>
                        <span className="text-[11px] text-muted-foreground">{d.done}/{d.total} tasks · {d.completion}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all bg-info"
                          style={{ width: `${d.completion}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">Create departments to track performance</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
