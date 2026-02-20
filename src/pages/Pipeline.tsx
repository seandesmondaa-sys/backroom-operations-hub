import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { projects, stageOrder, stageColors } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

const stageColumnColors: Record<string, string> = {
  "Sourcing": "border-t-muted-foreground",
  "Due Diligence": "border-t-info",
  "Structuring": "border-t-warning",
  "Closing": "border-t-primary",
  "Closed": "border-t-success",
  "Dead": "border-t-destructive",
};

export default function Pipeline() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Pipeline" description="Deal flow by stage" />
      
      <div className="flex-1 overflow-x-auto p-6">
        <div className="flex gap-4 min-w-max h-full">
          {stageOrder.map((stage) => {
            const stageProjects = projects.filter((p) => p.stage === stage);
            return (
              <div
                key={stage}
                className={`w-72 flex flex-col rounded-lg border border-border bg-card border-t-2 ${stageColumnColors[stage]}`}
              >
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {stage}
                  </h3>
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    {stageProjects.length}
                  </span>
                </div>

                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                  {stageProjects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => navigate(`/projects/${project.id}`)}
                      className="w-full text-left p-3 rounded-md border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all group"
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                          {project.name}
                        </span>
                        <span className="text-xs font-mono font-semibold text-primary">
                          {project.dealSize}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-2">
                        {project.clientName}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-muted-foreground">
                          {project.lead}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {project.lastActivity}
                        </span>
                      </div>
                    </button>
                  ))}

                  {stageProjects.length === 0 && (
                    <div className="text-center py-8 text-xs text-muted-foreground">
                      No deals
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
