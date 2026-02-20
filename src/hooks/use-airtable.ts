import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecords, createRecord, updateRecord, deleteRecord, airtableKeys, mapRecord, type ListParams } from "@/lib/airtable";
import { toast } from "@/hooks/use-toast";
import {
  TABLES,
  type Client, type Project, type Investor, type InvestorContact,
  type Outreach, type Task, type Document, type TermSheet, type KPI, type TeamMember,
} from "@/lib/types";

// ── Generic hooks ─────────────────────────────────────────

function useAirtableList<T>(table: string, opts?: Omit<ListParams, "table">) {
  return useQuery({
    queryKey: [...airtableKeys.list(table), opts],
    queryFn: async () => {
      const records = await listRecords({ table, ...opts });
      return records.map(mapRecord<T>);
    },
    staleTime: 15_000,
    retry: 1,
    meta: { table },
  });
}

function useAirtableCreate<T = unknown>(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: Record<string, unknown>) => createRecord(table, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: airtableKeys.list(table) });
      toast({ title: "Created", description: `Record added to ${table}` });
    },
    onError: (err: Error) => {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    },
  });
}

function useAirtableUpdate(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, unknown> }) =>
      updateRecord(table, id, fields),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: airtableKeys.list(table) });
      toast({ title: "Updated", description: `Record saved to ${table}` });
    },
    onError: (err: Error) => {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    },
  });
}

function useAirtableDelete(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecord(table, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: airtableKeys.list(table) });
      toast({ title: "Deleted", description: `Record removed from ${table}` });
    },
    onError: (err: Error) => {
      toast({ title: "Sync Error", description: err.message, variant: "destructive" });
    },
  });
}

// ── Projects ────────────────────────────────────────────────
export function useProjects(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Project>(TABLES.PROJECTS, opts);
}
export function useCreateProject() { return useAirtableCreate(TABLES.PROJECTS); }
export function useUpdateProject() { return useAirtableUpdate(TABLES.PROJECTS); }
export function useDeleteProject() { return useAirtableDelete(TABLES.PROJECTS); }

// ── Clients ─────────────────────────────────────────────────
export function useClients(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Client>(TABLES.CLIENTS, opts);
}
export function useCreateClient() { return useAirtableCreate(TABLES.CLIENTS); }
export function useUpdateClient() { return useAirtableUpdate(TABLES.CLIENTS); }
export function useDeleteClient() { return useAirtableDelete(TABLES.CLIENTS); }

// ── Investors ───────────────────────────────────────────────
export function useInvestors(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Investor>(TABLES.INVESTORS, opts);
}
export function useCreateInvestor() { return useAirtableCreate(TABLES.INVESTORS); }
export function useUpdateInvestor() { return useAirtableUpdate(TABLES.INVESTORS); }
export function useDeleteInvestor() { return useAirtableDelete(TABLES.INVESTORS); }

// ── Investor Contacts ───────────────────────────────────────
export function useInvestorContacts(opts?: Omit<ListParams, "table">) {
  return useAirtableList<InvestorContact>(TABLES.INVESTOR_CONTACTS, opts);
}
export function useCreateInvestorContact() { return useAirtableCreate(TABLES.INVESTOR_CONTACTS); }
export function useUpdateInvestorContact() { return useAirtableUpdate(TABLES.INVESTOR_CONTACTS); }
export function useDeleteInvestorContact() { return useAirtableDelete(TABLES.INVESTOR_CONTACTS); }

// ── Outreach ────────────────────────────────────────────────
export function useOutreach(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Outreach>(TABLES.OUTREACH, opts);
}
export function useCreateOutreach() { return useAirtableCreate(TABLES.OUTREACH); }
export function useUpdateOutreach() { return useAirtableUpdate(TABLES.OUTREACH); }
export function useDeleteOutreach() { return useAirtableDelete(TABLES.OUTREACH); }

// ── Tasks ───────────────────────────────────────────────────
export function useTasks(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Task>(TABLES.TASKS, opts);
}
export function useCreateTask() { return useAirtableCreate(TABLES.TASKS); }
export function useUpdateTask() { return useAirtableUpdate(TABLES.TASKS); }
export function useDeleteTask() { return useAirtableDelete(TABLES.TASKS); }

// ── Documents ───────────────────────────────────────────────
export function useDocuments(opts?: Omit<ListParams, "table">) {
  return useAirtableList<Document>(TABLES.DOCUMENTS, opts);
}
export function useCreateDocument() { return useAirtableCreate(TABLES.DOCUMENTS); }
export function useUpdateDocument() { return useAirtableUpdate(TABLES.DOCUMENTS); }
export function useDeleteDocument() { return useAirtableDelete(TABLES.DOCUMENTS); }

// ── Term Sheets ─────────────────────────────────────────────
export function useTermSheets(opts?: Omit<ListParams, "table">) {
  return useAirtableList<TermSheet>(TABLES.TERM_SHEETS, opts);
}
export function useCreateTermSheet() { return useAirtableCreate(TABLES.TERM_SHEETS); }
export function useUpdateTermSheet() { return useAirtableUpdate(TABLES.TERM_SHEETS); }
export function useDeleteTermSheet() { return useAirtableDelete(TABLES.TERM_SHEETS); }

// ── KPIs ────────────────────────────────────────────────────
export function useKPIs(opts?: Omit<ListParams, "table">) {
  return useAirtableList<KPI>(TABLES.KPIS, opts);
}
export function useCreateKPI() { return useAirtableCreate(TABLES.KPIS); }
export function useUpdateKPI() { return useAirtableUpdate(TABLES.KPIS); }
export function useDeleteKPI() { return useAirtableDelete(TABLES.KPIS); }

// ── Team ────────────────────────────────────────────────────
export function useTeam(opts?: Omit<ListParams, "table">) {
  return useAirtableList<TeamMember>(TABLES.TEAM, opts);
}
export function useCreateTeamMember() { return useAirtableCreate(TABLES.TEAM); }
export function useUpdateTeamMember() { return useAirtableUpdate(TABLES.TEAM); }
export function useDeleteTeamMember() { return useAirtableDelete(TABLES.TEAM); }
