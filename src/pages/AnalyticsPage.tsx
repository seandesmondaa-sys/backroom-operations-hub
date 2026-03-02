import { useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useOSTasks } from "@/hooks/use-os-tasks";
import { useAllUserRoles, useDepartments } from "@/hooks/use-roles";
import { useAttendance } from "@/hooks/use-attendance";
import { useLeads } from "@/hooks/use-leads";
import { useAllReadiness, READINESS_STAGES } from "@/hooks/use-readiness";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { Users, TrendingUp, Target, Clock } from "lucide-react";

const PIE_COLORS = ["hsl(var(--info))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(var(--accent))"];

export default function AnalyticsPage() {
  const { data: tasks = [], isLoading: tL } = useOSTasks();
  const { data: users = [], isLoading: uL } = useAllUserRoles();
  const { data: departments = [], isLoading: dL } = useDepartments();
  const { data: attendance = [], isLoading: aL } = useAttendance();
  const { data: leads = [] } = useLeads();
  const { data: readiness = [] } = useAllReadiness();

  const isLoading = tL || uL || dL || aL;

  // ── Per-Staff Metrics ──
  const staffMetrics = useMemo(() => {
    return users.map((u) => {
      const userTasks = tasks.filter((t) => t.assignee_id === u.user_id);
      const assigned = userTasks.length;
      const completed = userTasks.filter((t) => t.status === "done").length;
      const overdue = userTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
      const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

      // Average turnaround (days from created to completed)
      const completedWithDates = userTasks.filter((t) => t.status === "done" && t.completed_at);
      const avgTurnaround = completedWithDates.length > 0
        ? Math.round(completedWithDates.reduce((sum, t) => {
            const days = (new Date(t.completed_at!).getTime() - new Date(t.created_at).getTime()) / 86400000;
            return sum + days;
          }, 0) / completedWithDates.length)
        : 0;

      // Attendance hours this month
      const thisMonth = new Date().getMonth();
      const userAttendance = attendance.filter((a) => a.user_id === u.user_id && new Date(a.clock_in).getMonth() === thisMonth);
      const totalHours = userAttendance.reduce((sum, a) => sum + (a.total_hours || 0), 0);

      // Workload score (active tasks weighted by priority)
      const weights = { urgent: 4, high: 3, medium: 2, low: 1 };
      const workload = userTasks
        .filter((t) => t.status !== "done")
        .reduce((sum, t) => sum + (weights[t.priority as keyof typeof weights] || 2), 0);

      return {
        name: u.display_name,
        role: u.role,
        assigned,
        completed,
        completionRate,
        overdue,
        avgTurnaround,
        totalHours: Math.round(totalHours * 10) / 10,
        workload,
      };
    }).sort((a, b) => b.workload - a.workload);
  }, [users, tasks, attendance]);

  // ── Per-Department Metrics ──
  const deptMetrics = useMemo(() => {
    return departments.map((d) => {
      const deptUserIds = users.filter((u) => u.department_id === d.id).map((u) => u.user_id);
      const deptTasks = tasks.filter((t) => t.assignee_id && deptUserIds.includes(t.assignee_id));
      const total = deptTasks.length;
      const done = deptTasks.filter((t) => t.status === "done").length;
      const inProgress = deptTasks.filter((t) => t.status === "in_progress").length;
      const overdue = deptTasks.filter((t) => t.due_date && new Date(t.due_date) < new Date() && t.status !== "done").length;
      const efficiency = total > 0 ? Math.round((done / total) * 100) : 0;

      return { name: d.name, staffCount: deptUserIds.length, total, done, inProgress, overdue, efficiency };
    });
  }, [departments, users, tasks]);

  // ── Executive Metrics ──
  const execMetrics = useMemo(() => {
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.status === "done").length;
    const firmProductivity = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const pipelineValue = leads.reduce((sum, l: any) => sum + (Number(l.funding_target) || 0), 0);
    const convertedLeads = leads.filter((l: any) => l.status === "converted").length;
    const conversionRate = leads.length > 0 ? Math.round((convertedLeads / leads.length) * 100) : 0;

    const readinessDistribution = READINESS_STAGES.map((s) => ({
      name: s.label,
      value: readiness.filter((r) => (r.manual_override_stage || r.readiness_stage) === s.key).length,
    }));

    return { firmProductivity, pipelineValue, conversionRate, convertedLeads, totalLeads: leads.length, readinessDistribution };
  }, [tasks, leads, readiness]);

  if (isLoading) {
    return <div><PageHeader title="Analytics" description="Loading…" /><div className="p-6"><Skeleton className="h-96 w-full" /></div></div>;
  }

  return (
    <div>
      <PageHeader title="Analytics & Reporting" description="Multi-layer performance analytics" />
      <div className="p-6">
        <Tabs defaultValue="staff">
          <TabsList>
            <TabsTrigger value="staff" className="text-xs gap-1.5"><Users className="h-3.5 w-3.5" /> Per Staff</TabsTrigger>
            <TabsTrigger value="department" className="text-xs gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Per Department</TabsTrigger>
            <TabsTrigger value="executive" className="text-xs gap-1.5"><Target className="h-3.5 w-3.5" /> Executive</TabsTrigger>
          </TabsList>

          {/* ── Per Staff ── */}
          <TabsContent value="staff" className="mt-4">
            <div className="rounded-lg border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Staff</TableHead>
                    <TableHead className="text-xs font-semibold">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Assigned</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Completed</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Rate</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Overdue</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Avg Days</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Hours (Mo)</TableHead>
                    <TableHead className="text-xs font-semibold text-center">Workload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staffMetrics.map((s) => (
                    <TableRow key={s.name}>
                      <TableCell className="text-sm font-medium">{s.name}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{s.role?.replace("_", " ") || "—"}</Badge></TableCell>
                      <TableCell className="text-center text-sm">{s.assigned}</TableCell>
                      <TableCell className="text-center text-sm">{s.completed}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <Progress value={s.completionRate} className="w-12 h-1.5" />
                          <span className="text-xs font-mono">{s.completionRate}%</span>
                        </div>
                      </TableCell>
                      <TableCell className={cn("text-center text-sm", s.overdue > 0 && "text-destructive font-semibold")}>{s.overdue}</TableCell>
                      <TableCell className="text-center text-sm font-mono">{s.avgTurnaround}d</TableCell>
                      <TableCell className="text-center text-sm font-mono">{s.totalHours}h</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={s.workload > 10 ? "destructive" : s.workload > 5 ? "secondary" : "outline"} className="text-[10px]">
                          {s.workload}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                  {staffMetrics.length === 0 && (
                    <TableRow><TableCell colSpan={9} className="text-center text-sm text-muted-foreground py-8">No staff data</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* ── Per Department ── */}
          <TabsContent value="department" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Department Efficiency</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={deptMetrics} barSize={24}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="done" name="Done" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="inProgress" name="In Progress" fill="hsl(var(--info))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="overdue" name="Overdue" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <div className="space-y-3">
                {deptMetrics.map((d) => (
                  <Card key={d.name}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold">{d.name}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{d.staffCount} staff</Badge>
                          <Badge variant={d.efficiency >= 70 ? "default" : "secondary"} className="text-[10px]">{d.efficiency}% efficiency</Badge>
                        </div>
                      </div>
                      <Progress value={d.efficiency} className="h-2" />
                      <div className="flex gap-4 mt-2 text-[11px] text-muted-foreground">
                        <span>{d.total} tasks</span>
                        <span className="text-success">{d.done} done</span>
                        <span className="text-info">{d.inProgress} active</span>
                        {d.overdue > 0 && <span className="text-destructive">{d.overdue} overdue</span>}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {deptMetrics.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Create departments first</p>}
              </div>
            </div>
          </TabsContent>

          {/* ── Executive ── */}
          <TabsContent value="executive" className="mt-4 space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card><CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Firm Productivity</p>
                <p className="text-2xl font-bold mt-1">{execMetrics.firmProductivity}%</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Pipeline Value</p>
                <p className="text-2xl font-bold mt-1">${execMetrics.pipelineValue.toLocaleString()}</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Lead Conversion</p>
                <p className="text-2xl font-bold mt-1">{execMetrics.conversionRate}%</p>
                <p className="text-[11px] text-muted-foreground">{execMetrics.convertedLeads}/{execMetrics.totalLeads} leads</p>
              </CardContent></Card>
              <Card><CardContent className="p-4">
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Scored Projects</p>
                <p className="text-2xl font-bold mt-1">{readiness.length}</p>
              </CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Investment Readiness Distribution</CardTitle></CardHeader>
                <CardContent>
                  {execMetrics.readinessDistribution.some((r) => r.value > 0) ? (
                    <div className="flex items-center gap-6">
                      <ResponsiveContainer width="50%" height={200}>
                        <PieChart>
                          <Pie data={execMetrics.readinessDistribution.filter((r) => r.value > 0)} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40}>
                            {execMetrics.readinessDistribution.filter((r) => r.value > 0).map((_, i) => (
                              <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-1.5">
                        {execMetrics.readinessDistribution.filter((r) => r.value > 0).map((s, i) => (
                          <div key={s.name} className="flex items-center gap-2 text-xs">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-muted-foreground">{s.name}</span>
                            <span className="font-semibold">{s.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">No readiness data yet</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Department Comparison</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={deptMetrics} barSize={20}>
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                      <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="efficiency" name="Efficiency %" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
