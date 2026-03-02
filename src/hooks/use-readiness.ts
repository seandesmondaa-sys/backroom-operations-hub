import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProjectReadiness {
  id: string;
  project_id: string;
  has_financial_model: boolean;
  has_legal_docs: boolean;
  has_feasibility_study: boolean;
  has_regulatory_approvals: boolean;
  has_revenue_projections: boolean;
  readiness_stage: string;
  auto_score: number;
  manual_override_stage: string | null;
  notes: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export const READINESS_STAGES = [
  { key: "concept", label: "Concept Stage", minScore: 0 },
  { key: "early_development", label: "Early Development", minScore: 20 },
  { key: "structuring", label: "Structuring", minScore: 40 },
  { key: "investment_ready", label: "Investment-Ready", minScore: 70 },
  { key: "capital_deployment", label: "Capital Deployment", minScore: 90 },
];

export const CRITERIA = [
  { key: "has_financial_model", label: "Financial Model", weight: 25 },
  { key: "has_legal_docs", label: "Legal Documentation", weight: 20 },
  { key: "has_feasibility_study", label: "Feasibility Study", weight: 20 },
  { key: "has_regulatory_approvals", label: "Regulatory Approvals", weight: 15 },
  { key: "has_revenue_projections", label: "Revenue Projections", weight: 20 },
] as const;

export function computeScore(criteria: Record<string, any>): number {
  return CRITERIA.reduce((sum, c) => sum + (criteria[c.key] ? c.weight : 0), 0);
}

export function suggestStage(score: number): string {
  const sorted = [...READINESS_STAGES].reverse();
  return sorted.find((s) => score >= s.minScore)?.key || "concept";
}

export function useProjectReadiness(projectId?: string) {
  return useQuery({
    queryKey: ["project-readiness", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("project_readiness")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data as ProjectReadiness | null;
    },
    enabled: !!projectId,
  });
}

export function useAllReadiness() {
  return useQuery({
    queryKey: ["project-readiness", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_readiness")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ProjectReadiness[];
    },
  });
}

export function useUpsertReadiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      project_id: string;
      has_financial_model: boolean;
      has_legal_docs: boolean;
      has_feasibility_study: boolean;
      has_regulatory_approvals: boolean;
      has_revenue_projections: boolean;
      manual_override_stage?: string | null;
      notes?: string | null;
    }) => {
      const score = computeScore(input);
      const stage = input.manual_override_stage || suggestStage(score);

      const { data: existing } = await supabase
        .from("project_readiness")
        .select("id")
        .eq("project_id", input.project_id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("project_readiness")
          .update({
            ...input,
            auto_score: score,
            readiness_stage: stage,
          })
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("project_readiness").insert({
          ...input,
          auto_score: score,
          readiness_stage: stage,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-readiness"] });
      toast.success("Readiness updated");
    },
    onError: (e) => toast.error(e.message),
  });
}
