import { useParams, useNavigate } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { projects, tasks, documents, termSheets, stageColors } from "@/lib/mock-data";
import { ArrowLeft, FileText, CheckSquare, Handshake, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProjectProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const project = projects.find((p) => p.id === id);

  if (!project) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Project not found.</p>
      </div>
    );
  }

  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const projectDocs = documents.filter((d) => d.projectId === project.id);
  const projectTermSheets = termSheets.filter((ts) => ts.projectId === project.id);

  return (
    <div>
      <div className="flex items-center gap-3 px-6 py-4 border-b border-border">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="h-7 px-2">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold">{project.name}</h1>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono ${stageColors[project.stage]}`}>
              {project.stage}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {project.clientName} · {project.dealSize} · Lead: {project.lead}
          </p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Deal Size", value: project.dealSize, icon: BarChart3 },
            { label: "Tasks", value: projectTasks.length, icon: CheckSquare },
            { label: "Documents", value: projectDocs.length, icon: FileText },
            { label: "Term Sheets", value: projectTermSheets.length, icon: Handshake },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-2 mb-1">
                <kpi.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{kpi.label}</span>
              </div>
              <span className="text-xl font-semibold font-mono">{kpi.value}</span>
            </div>
          ))}
        </div>

        {/* Tasks */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-muted-foreground" /> Tasks
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Task</TableHead>
                  <TableHead className="text-xs font-semibold">Assignee</TableHead>
                  <TableHead className="text-xs font-semibold">Due</TableHead>
                  <TableHead className="text-xs font-semibold">Priority</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="text-sm">{task.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{task.assignee}</TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{task.dueDate}</TableCell>
                    <TableCell><StatusBadge status={task.priority} /></TableCell>
                    <TableCell><StatusBadge status={task.status} /></TableCell>
                  </TableRow>
                ))}
                {projectTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No tasks</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Documents */}
        <section>
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" /> Data Room
          </h2>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Document</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Version</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Uploaded</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectDocs.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="text-sm font-medium font-mono">{doc.name}</TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{doc.type}</TableCell>
                    <TableCell className="text-sm font-mono">v{doc.version}</TableCell>
                    <TableCell><StatusBadge status={doc.status} /></TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono">{doc.uploadedAt}</TableCell>
                  </TableRow>
                ))}
                {projectDocs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-6">No documents</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </section>

        {/* Term Sheets */}
        {projectTermSheets.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Handshake className="h-4 w-4 text-muted-foreground" /> Term Sheets
            </h2>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="text-xs font-semibold">Investor</TableHead>
                    <TableHead className="text-xs font-semibold">Amount</TableHead>
                    <TableHead className="text-xs font-semibold">Terms</TableHead>
                    <TableHead className="text-xs font-semibold">Status</TableHead>
                    <TableHead className="text-xs font-semibold">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectTermSheets.map((ts) => (
                    <TableRow key={ts.id}>
                      <TableCell className="text-sm font-medium">{ts.investor}</TableCell>
                      <TableCell className="font-mono text-sm font-semibold text-primary">{ts.amount}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{ts.terms}</TableCell>
                      <TableCell><StatusBadge status={ts.status} /></TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">{ts.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
