import { PageHeader } from "@/components/PageHeader";
import { projects, tasks, termSheets } from "@/lib/mock-data";
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

export default function Portfolio() {
  const activeProjects = projects.filter((p) => !["Closed", "Dead"].includes(p.stage));
  const closedProjects = projects.filter((p) => p.stage === "Closed");
  const overdueTasks = tasks.filter((t) => t.status === "Overdue");
  const signedSheets = termSheets.filter((ts) => ts.status === "Signed");

  const stats = [
    { label: "Active Deals", value: activeProjects.length, icon: TrendingUp, color: "text-primary" },
    { label: "Closed Deals", value: closedProjects.length, icon: CheckCircle, color: "text-success" },
    { label: "Overdue Tasks", value: overdueTasks.length, icon: AlertTriangle, color: "text-warning" },
    { label: "Signed Term Sheets", value: signedSheets.length, icon: BarChart3, color: "text-info" },
  ];

  const totalDealValue = projects
    .filter((p) => !["Dead"].includes(p.stage))
    .reduce((sum, p) => sum + parseFloat(p.dealSize.replace(/[$M]/g, "")), 0);

  return (
    <div>
      <PageHeader title="Portfolio" description="Monitoring dashboard" />

      <div className="p-6 space-y-6">
        {/* Top-level KPI */}
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Pipeline Value</p>
          <p className="text-3xl font-bold font-mono text-primary">${totalDealValue}M</p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-lg border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold font-mono">{stat.value}</span>
            </div>
          ))}
        </div>

        {/* Active deals summary */}
        <section>
          <h2 className="text-sm font-semibold mb-3">Active Pipeline</h2>
          <div className="grid grid-cols-3 gap-3">
            {activeProjects.map((project) => (
              <div key={project.id} className="rounded-lg border border-border bg-card p-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm font-medium">{project.name}</span>
                  <span className="font-mono text-sm font-semibold text-primary">{project.dealSize}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mb-1">{project.clientName}</p>
                <p className="text-[11px] font-mono text-muted-foreground">{project.stage} · {project.lead}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
