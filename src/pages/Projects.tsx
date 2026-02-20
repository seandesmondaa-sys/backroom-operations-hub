import { PageHeader } from "@/components/PageHeader";
import { useProjects } from "@/hooks/use-airtable";
import { stageColors } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

export default function Projects() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();

  return (
    <div>
      <PageHeader title="Projects" description="All deals and engagements" />
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Project</TableHead>
                  <TableHead className="text-xs font-semibold">Stage</TableHead>
                  <TableHead className="text-xs font-semibold">Deal Size</TableHead>
                  <TableHead className="text-xs font-semibold">Lead</TableHead>
                  <TableHead className="text-xs font-semibold">Last Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => navigate(`/projects/${p.id}`)}>
                    <TableCell className="text-sm font-medium">{String(p.Name || "")}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono ${stageColors[String(p.Stage)] || ""}`}>
                        {String(p.Stage || "")}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{String(p["Deal Size"] || "")}</TableCell>
                    <TableCell className="text-sm">{String(p.Lead || "")}</TableCell>
                    <TableCell className="text-[11px] text-muted-foreground font-mono">{String(p["Last Activity"] || "")}</TableCell>
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
