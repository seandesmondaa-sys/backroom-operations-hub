import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface Document {
  id: string;
  name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  version: number;
  parent_document_id: string | null;
  project_id: string | null;
  department_id: string | null;
  tags: string[];
  description: string | null;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
  uploader_name?: string;
}

export function useDocuments(filters?: { department_id?: string; project_id?: string }) {
  return useQuery({
    queryKey: ["documents", filters],
    queryFn: async () => {
      let q = supabase
        .from("documents")
        .select("*")
        .is("parent_document_id", null) // Only top-level docs
        .order("created_at", { ascending: false });

      if (filters?.department_id) q = q.eq("department_id", filters.department_id);
      if (filters?.project_id) q = q.eq("project_id", filters.project_id);

      const { data, error } = await q;
      if (error) throw error;

      const userIds = [...new Set((data || []).map((d: any) => d.uploaded_by))];
      let profileMap: Record<string, string> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", userIds);
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.display_name]));
      }

      return (data || []).map((d: any) => ({
        ...d,
        tags: d.tags || [],
        uploader_name: profileMap[d.uploaded_by] || "Unknown",
      })) as Document[];
    },
  });
}

export function useDocumentVersions(parentId: string | null) {
  return useQuery({
    queryKey: ["document-versions", parentId],
    enabled: !!parentId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("documents")
        .select("*")
        .eq("parent_document_id", parentId!)
        .order("version", { ascending: false });
      if (error) throw error;
      return (data || []) as Document[];
    },
  });
}

export function useUploadDocument() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      file,
      name,
      description,
      department_id,
      project_id,
      tags,
      parent_document_id,
      version,
    }: {
      file: File;
      name: string;
      description?: string;
      department_id?: string | null;
      project_id?: string | null;
      tags?: string[];
      parent_document_id?: string | null;
      version?: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const filePath = `${user.id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        description: description || null,
        department_id: department_id || null,
        project_id: project_id || null,
        tags: tags || [],
        parent_document_id: parent_document_id || null,
        version: version || 1,
        uploaded_by: user.id,
      } as any);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      qc.invalidateQueries({ queryKey: ["document-versions"] });
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file_path }: { id: string; file_path: string }) => {
      await supabase.storage.from("documents").remove([file_path]);
      const { error } = await supabase.from("documents").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["documents"] }),
  });
}

export function getDocumentUrl(filePath: string) {
  const { data } = supabase.storage.from("documents").getPublicUrl(filePath);
  return data.publicUrl;
}

export async function getDocumentDownloadUrl(filePath: string) {
  const { data } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600);
  return data?.signedUrl || "";
}
