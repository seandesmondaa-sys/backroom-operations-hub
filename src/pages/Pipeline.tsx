import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useProjects, useUpdateProject } from "@/hooks/use-airtable";
import { STAGE_ORDER, stageColumnBorder, type Project } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";

export default function Pipeline() {
  const navigate = useNavigate();
  const { data: projects = [], isLoading } = useProjects();
  const updateProject = useUpdateProject();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStage = result.destination.droppableId;
    const projectId = result.draggableId;
    const project = projects.find((p) => p.id === projectId);
    if (!project || String(project.Stage) === newStage) return;

    updateProject.mutate({ id: projectId, fields: { Stage: newStage } });
  };

  return (
    <div className="h-full flex flex-col">
      <PageHeader title="Pipeline" description="Drag cards between stages to update Airtable" />
      
      <div className="flex-1 overflow-x-auto p-6">
        {isLoading ? (
          <div className="flex gap-4">
            {STAGE_ORDER.map((s) => (
              <Skeleton key={s} className="w-72 h-96 rounded-lg" />
            ))}
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 min-w-max h-full">
              {STAGE_ORDER.map((stage) => {
                const stageProjects = projects.filter((p) => String(p.Stage) === stage);
                return (
                  <Droppable droppableId={stage} key={stage}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`w-72 flex flex-col rounded-lg border border-border bg-card border-t-2 ${stageColumnBorder[stage] || ""} ${
                          snapshot.isDraggingOver ? "ring-2 ring-primary/30" : ""
                        }`}
                      >
                        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            {stage}
                          </h3>
                          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {stageProjects.length}
                          </span>
                        </div>

                        <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-[100px]">
                          {stageProjects.map((project, index) => (
                            <Draggable key={project.id} draggableId={project.id} index={index}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  onClick={() => navigate(`/projects/${project.id}`)}
                                  className={`w-full text-left p-3 rounded-md border border-border bg-background hover:border-primary/30 hover:shadow-sm transition-all group cursor-pointer ${
                                    snap.isDragging ? "shadow-lg ring-2 ring-primary/20" : ""
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-1.5">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                                      {String(project.Name || "")}
                                    </span>
                                    <span className="text-xs font-mono font-semibold text-primary">
                                      {String(project["Deal Size"] || "")}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground mb-2">
                                    {String(project.Lead || "")}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                      {String(project["Last Activity"] || "")}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {stageProjects.length === 0 && (
                            <div className="text-center py-8 text-xs text-muted-foreground">
                              No deals
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Droppable>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
    </div>
  );
}
