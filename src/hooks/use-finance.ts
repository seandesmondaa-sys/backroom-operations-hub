import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

// ── Budgets ──────────────────────────────────────────────────
export function useBudgets() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["budgets"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budgets")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (b: {
      name: string;
      category: string;
      allocated_amount: number;
      fiscal_year: string;
      department_id?: string | null;
      project_id?: string | null;
      notes?: string;
      created_by: string;
    }) => {
      const { error } = await supabase.from("budgets").insert(b as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budgets"] });
      toast.success("Budget created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Expenses ─────────────────────────────────────────────────
export function useExpenses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["expenses"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (e: {
      description: string;
      amount: number;
      category: string;
      vendor?: string;
      expense_date: string;
      budget_id?: string | null;
      notes?: string;
      submitted_by: string;
    }) => {
      const { error } = await supabase.from("expenses").insert(e as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense submitted");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateExpenseStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      status,
      approved_by,
    }: {
      id: string;
      status: string;
      approved_by?: string;
    }) => {
      const { error } = await supabase
        .from("expenses")
        .update({ status, approved_by, approved_at: new Date().toISOString() } as any)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      toast.success("Expense updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Revenue ──────────────────────────────────────────────────
export function useRevenueEntries() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["revenue_entries"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("revenue_entries")
        .select("*")
        .order("revenue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: {
      source: string;
      amount: number;
      revenue_date: string;
      description?: string;
      project_id?: string | null;
      recorded_by: string;
    }) => {
      const { error } = await supabase.from("revenue_entries").insert(r as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["revenue_entries"] });
      toast.success("Revenue recorded");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

// ── Invoices ─────────────────────────────────────────────────
export function useInvoices() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["invoices"],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*")
        .order("issue_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inv: {
      invoice_number: string;
      client_name: string;
      amount: number;
      due_date: string;
      issue_date: string;
      description?: string;
      project_id?: string | null;
      created_by: string;
    }) => {
      const { error } = await supabase.from("invoices").insert(inv as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice created");
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateInvoiceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, paid_date }: { id: string; status: string; paid_date?: string }) => {
      const update: any = { status };
      if (paid_date) update.paid_date = paid_date;
      const { error } = await supabase.from("invoices").update(update).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast.success("Invoice updated");
    },
    onError: (e: any) => toast.error(e.message),
  });
}
