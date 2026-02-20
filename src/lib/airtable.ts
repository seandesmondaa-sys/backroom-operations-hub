import { supabase } from "@/integrations/supabase/client";

interface AirtableRecord {
  id: string;
  fields: Record<string, unknown>;
  createdTime?: string;
}

interface AirtableListResponse {
  records: AirtableRecord[];
  offset?: string;
}

interface ListParams {
  table: string;
  view?: string;
  filterByFormula?: string;
  sortField?: string;
  sortDirection?: "asc" | "desc";
}

async function callProxy(
  method: string,
  params: Record<string, string>,
  body?: unknown
): Promise<unknown> {
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const queryString = new URLSearchParams(params).toString();
  const url = `https://${projectId}.supabase.co/functions/v1/airtable-proxy?${queryString}`;

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Proxy error ${res.status}`);
  return data;
}

export async function listRecords(params: ListParams): Promise<AirtableRecord[]> {
  const allRecords: AirtableRecord[] = [];
  let offset: string | undefined;

  do {
    const queryParams: Record<string, string> = { table: params.table };
    if (params.view) queryParams.view = params.view;
    if (params.filterByFormula) queryParams.filterByFormula = params.filterByFormula;
    if (params.sortField) queryParams.sortField = params.sortField;
    if (params.sortDirection) queryParams.sortDirection = params.sortDirection;
    if (offset) queryParams.offset = offset;

    const res = (await callProxy("GET", queryParams)) as AirtableListResponse;
    allRecords.push(...res.records);
    offset = res.offset;
  } while (offset);

  return allRecords;
}

export async function getRecord(table: string, recordId: string): Promise<AirtableRecord> {
  return (await callProxy("GET", { table, recordId })) as AirtableRecord;
}

export async function createRecord(
  table: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await callProxy("POST", { table }, { fields })) as AirtableRecord;
}

export async function updateRecord(
  table: string,
  recordId: string,
  fields: Record<string, unknown>
): Promise<AirtableRecord> {
  return (await callProxy("PATCH", { table, recordId }, { fields })) as AirtableRecord;
}

export async function deleteRecord(table: string, recordId: string): Promise<void> {
  await callProxy("DELETE", { table, recordId });
}

export const airtableKeys = {
  list: (table: string) => ["airtable", table] as const,
  record: (table: string, id: string) => ["airtable", table, id] as const,
};
