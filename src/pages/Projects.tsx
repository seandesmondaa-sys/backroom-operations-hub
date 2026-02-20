import { PageHeader } from "@/components/PageHeader";
import { useProjects } from "@/hooks/use-airtable";
import { stageColors } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();

  return (
    <div>
      <PageHeader title="Projects" description="All deals and engagements" />

      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Project</TableHead>
                  <TableHead className="text-xs font-semibold">Client</TableHead>
                  <TableHead className="text-xs font-semibold">Stage</TableHead>
                  <TableHead className="text-xs font-semibold">Deal Size</TableHead>
                  <TableHead className="text-xs font-semibold">Lead</TableHead>
                  <TableHead className="text-xs font-semibold">Tasks</TableHead>
                  <TableHead className="text-xs font-semibold">Docs</TableHead>
                  <TableHead className="text-xs font-semibold">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow
                    key={project.id}
                    className="hover:bg-muted/30 cursor-pointer"
                    onClick={() => navigate(`/projects/${project.id}`)}
                  >
                    <TableCell className="text-sm font-medium">{project.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{project.clientName}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono ${stageColors[project.stage] || ""}`}>
                        {project.stage}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{project.dealSize}</TableCell>
                    <TableCell className="text-sm">{project.lead}</TableCell>
                    <TableCell className="font-mono text-sm">{project.taskCount}</TableCell>
                    <TableCell className="font-mono text-sm">{project.docCount}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono">{project.lastActivity}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
