import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type AppRole = "super_admin" | "department_head" | "department_staff" | "general_staff";

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
  department_id: string | null;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

// Fetch current user's role
export function useCurrentUserRole() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as UserRole | null;
    },
    enabled: !!user,
  });
}

// Check if current user is super admin
export function useIsSuperAdmin() {
  const { data: role, isLoading } = useCurrentUserRole();
  return { isSuperAdmin: role?.role === "super_admin", isLoading };
}

// Fetch all user roles (with profile info)
export function useAllUserRoles() {
  return useQuery({
    queryKey: ["all-user-roles"],
    queryFn: async () => {
      const { data: roles, error: rolesErr } = await supabase
        .from("user_roles")
        .select("*");
      if (rolesErr) throw rolesErr;

      const { data: profiles, error: profErr } = await supabase
        .from("profiles")
        .select("*");
      if (profErr) throw profErr;

      return (profiles || []).map((p) => {
        const userRole = (roles || []).find((r: UserRole) => r.user_id === p.user_id);
        return {
          ...p,
          role: userRole?.role as AppRole | undefined,
          role_id: userRole?.id,
          department_id: userRole?.department_id,
        };
      });
    },
  });
}

// Fetch departments
export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Department[];
    },
  });
}

// Assign or update a user's role
export function useAssignRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role, departmentId }: { userId: string; role: AppRole; departmentId?: string | null }) => {
      // Upsert: delete existing then insert
      await supabase.from("user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("user_roles").insert({
        user_id: userId,
        role,
        department_id: departmentId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-user-roles"] });
      qc.invalidateQueries({ queryKey: ["user-role"] });
    },
  });
}

// Create department
export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      const { error } = await supabase.from("departments").insert({ name, description: description ?? null });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}

// Delete department
export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["departments"] }),
  });
}
