import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRecords, createRecord, updateRecord, deleteRecord, airtableKeys } from "@/lib/airtable";
import {
  clients as mockClients,
  projects as mockProjects,
  investors as mockInvestors,
  tasks as mockTasks,
  documents as mockDocuments,
  termSheets as mockTermSheets,
  type Client,
  type Project,
  type Investor,
  type Task,
  type Document,
  type TermSheet,
} from "@/lib/mock-data";

// Table name constants — must match your Airtable base table names
const TABLES = {
  CLIENTS: "Clients",
  PROJECTS: "Projects",
  INVESTORS: "Investors",
  TASKS: "Tasks",
  DOCUMENTS: "Documents",
  TERM_SHEETS: "Term Sheets",
} as const;

// Generic mapper: Airtable record → app type
function mapRecord<T>(record: { id: string; fields: Record<string, unknown> }, defaults: Partial<T>): T {
  return { id: record.id, ...defaults, ...record.fields } as T;
}

function useAirtableList<T>(
  table: string,
  mockData: T[],
  mapper: (r: { id: string; fields: Record<string, unknown> }) => T,
  options?: { filterByFormula?: string; sortField?: string; sortDirection?: "asc" | "desc" }
) {
  return useQuery({
    queryKey: [...airtableKeys.list(table), options],
    queryFn: async () => {
      try {
        const records = await listRecords({ table, ...options });
        return records.map(mapper);
      } catch {
        // Fallback to mock data if Airtable isn't configured
        console.warn(`Airtable table "${table}" not available, using mock data`);
        return mockData;
      }
    },
    staleTime: 30_000,
  });
}

function useAirtableCreate(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fields: Record<string, unknown>) => createRecord(table, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: airtableKeys.list(table) }),
  });
}

function useAirtableUpdate(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fields }: { id: string; fields: Record<string, unknown> }) =>
      updateRecord(table, id, fields),
    onSuccess: () => qc.invalidateQueries({ queryKey: airtableKeys.list(table) }),
  });
}

function useAirtableDelete(table: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteRecord(table, id),
    onSuccess: () => qc.invalidateQueries({ queryKey: airtableKeys.list(table) }),
  });
}

// ─── Clients ────────────────────────────────────────────────

export function useClients() {
  return useAirtableList<Client>(TABLES.CLIENTS, mockClients, (r) =>
    mapRecord<Client>(r, {
      name: "",
      type: "Client",
      industry: "",
      contactName: "",
      contactEmail: "",
      projectCount: 0,
      status: "Active",
    })
  );
}

export function useCreateClient() { return useAirtableCreate(TABLES.CLIENTS); }
export function useUpdateClient() { return useAirtableUpdate(TABLES.CLIENTS); }
export function useDeleteClient() { return useAirtableDelete(TABLES.CLIENTS); }

// ─── Projects ───────────────────────────────────────────────

export function useProjects() {
  return useAirtableList<Project>(TABLES.PROJECTS, mockProjects, (r) =>
    mapRecord<Project>(r, {
      name: "",
      clientId: "",
      clientName: "",
      stage: "Sourcing",
      dealSize: "",
      lead: "",
      lastActivity: "",
      taskCount: 0,
      docCount: 0,
    })
  );
}

export function useCreateProject() { return useAirtableCreate(TABLES.PROJECTS); }
export function useUpdateProject() { return useAirtableUpdate(TABLES.PROJECTS); }
export function useDeleteProject() { return useAirtableDelete(TABLES.PROJECTS); }

// ─── Investors ──────────────────────────────────────────────

export function useInvestors() {
  return useAirtableList<Investor>(TABLES.INVESTORS, mockInvestors, (r) =>
    mapRecord<Investor>(r, {
      name: "",
      firm: "",
      email: "",
      phone: "",
      type: "LP",
      lastContact: "",
      meetingCount: 0,
    })
  );
}

export function useCreateInvestor() { return useAirtableCreate(TABLES.INVESTORS); }
export function useUpdateInvestor() { return useAirtableUpdate(TABLES.INVESTORS); }
export function useDeleteInvestor() { return useAirtableDelete(TABLES.INVESTORS); }

// ─── Tasks ──────────────────────────────────────────────────

export function useTasks() {
  return useAirtableList<Task>(TABLES.TASKS, mockTasks, (r) =>
    mapRecord<Task>(r, {
      title: "",
      projectId: "",
      projectName: "",
      assignee: "",
      dueDate: "",
      status: "To Do",
      priority: "Medium",
    })
  );
}

export function useCreateTask() { return useAirtableCreate(TABLES.TASKS); }
export function useUpdateTask() { return useAirtableUpdate(TABLES.TASKS); }
export function useDeleteTask() { return useAirtableDelete(TABLES.TASKS); }

// ─── Documents ──────────────────────────────────────────────

export function useDocuments() {
  return useAirtableList<Document>(TABLES.DOCUMENTS, mockDocuments, (r) =>
    mapRecord<Document>(r, {
      name: "",
      projectId: "",
      projectName: "",
      type: "CIM",
      version: "",
      status: "Draft",
      uploadedBy: "",
      uploadedAt: "",
    })
  );
}

export function useCreateDocument() { return useAirtableCreate(TABLES.DOCUMENTS); }
export function useUpdateDocument() { return useAirtableUpdate(TABLES.DOCUMENTS); }
export function useDeleteDocument() { return useAirtableDelete(TABLES.DOCUMENTS); }

// ─── Term Sheets ────────────────────────────────────────────

export function useTermSheets() {
  return useAirtableList<TermSheet>(TABLES.TERM_SHEETS, mockTermSheets, (r) =>
    mapRecord<TermSheet>(r, {
      projectId: "",
      projectName: "",
      investor: "",
      amount: "",
      terms: "",
      status: "Proposed",
      date: "",
    })
  );
}

export function useCreateTermSheet() { return useAirtableCreate(TABLES.TERM_SHEETS); }
export function useUpdateTermSheet() { return useAirtableUpdate(TABLES.TERM_SHEETS); }
export function useDeleteTermSheet() { return useAirtableDelete(TABLES.TERM_SHEETS); }
