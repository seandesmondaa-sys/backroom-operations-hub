interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

export interface ListParams {
  table: string;
  view?: string;
  filterByFormula?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
  maxRecords?: number;
}

function buildUrl(params: Record<string, string>): string {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const qs = new URLSearchParams(params).toString();
  return `https://${projectId}.supabase.co/functions/v1/airtable-proxy?${qs}`;
}

function headers(): Record<string, string> {
  return {
    "Content-Type": "application/json",
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function request(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    const detail = data?.details?.error?.message || data?.error || `Error ${res.status}`;
    throw new Error(typeof detail === "string" ? detail : JSON.stringify(detail));
  }
  return data;
}

// ── Public API ───────────────────────────────────────────────

export async function listRecords(params: ListParams): Promise<AirtableRecord[]> {
  const all: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const qp: Record<string, string> = { table: params.table };
    if (params.view) qp.view = params.view;
    if (params.filterByFormula) qp.filterByFormula = params.filterByFormula;
    if (params.sortField) qp.sortField = params.sortField;
    if (params.sortDirection) qp.sortDirection = params.sortDirection;
    if (params.maxRecords) qp.maxRecords = String(params.maxRecords);
    if (offset) qp.offset = offset;

    const res = (await request(buildUrl(qp), "GET")) as AirtableListResponse;
    all.push(...res.records);
    offset = res.offset;
  } while (offset);

  return all;
}

export async function getRecord(table: string, recordId: string): Promise<AirtableRecord> {
  return request(buildUrl({ table, recordId }), "GET") as Promise<AirtableRecord>;
}

export async function createRecord(table: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
  return request(buildUrl({ table }), "POST", { fields }) as Promise<AirtableRecord>;
}

export async function updateRecord(table: string, recordId: string, fields: Record<string, unknown>): Promise<AirtableRecord> {
  return request(buildUrl({ table, recordId }), "PATCH", { fields }) as Promise<AirtableRecord>;
}

export async function deleteRecord(table: string, recordId: string): Promise<void> {
  await request(buildUrl({ table, recordId }), "DELETE");
}

export const airtableKeys = {
  list: (table: string) => ["airtable", table] as const,
  record: (table: string, id: string) => ["airtable", table, id] as const,
};

// Helper: map Airtable record → typed object
export function mapRecord<T>(record: AirtableRecord): T {
  return { id: record.id, ...record.fields } as T;
}
