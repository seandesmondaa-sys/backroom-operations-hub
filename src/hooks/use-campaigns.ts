import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (fields: Record<string, unknown>) => {
      const { error } = await supabase.from("campaigns").insert({ ...fields, created_by: user!.id } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campaign created" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, fields }: { id: string; fields: Record<string, unknown> }) => {
      const { error } = await supabase.from("campaigns").update(fields as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campaign updated" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["campaigns"] });
      toast({ title: "Campaign deleted" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });
}

export function useMediaAssets(campaignId?: string) {
  return useQuery({
    queryKey: ["media-assets", campaignId],
    queryFn: async () => {
      let q = supabase.from("media_assets").select("*").order("created_at", { ascending: false });
      if (campaignId) q = q.eq("campaign_id", campaignId);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
}

export function useUploadMediaAsset() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ file, name, campaignId, tags }: { file: File; name: string; campaignId?: string; tags?: string[] }) => {
      const path = `${user!.id}/${Date.now()}_${file.name}`;
      const { error: upErr } = await supabase.storage.from("media-assets").upload(path, file);
      if (upErr) throw upErr;
      const { error: dbErr } = await supabase.from("media_assets").insert({
        name,
        asset_type: file.type.startsWith("image") ? "image" : file.type.startsWith("video") ? "video" : "document",
        file_path: path,
        file_size: file.size,
        mime_type: file.type,
        campaign_id: campaignId || null,
        tags: tags || [],
        uploaded_by: user!.id,
      } as any);
      if (dbErr) throw dbErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media-assets"] });
      toast({ title: "Asset uploaded" });
    },
    onError: (e: Error) => toast({ title: "Upload error", description: e.message, variant: "destructive" }),
  });
}
