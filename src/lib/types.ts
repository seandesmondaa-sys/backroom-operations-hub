// ─── Types ─────────────────────────────────────────────────
// All types match Airtable field names. The `id` is the Airtable record ID.
// Fields use string unions loosely — Airtable values may differ, so we accept string.

export interface Client {
  id: string;
  Name: string;
  Type: string;
  Industry: string;
  "Contact Name": string;
  "Contact Email": string;
  Status: string;
  // linked
  Projects?: string[];
  [key: string]: unknown;
}

export interface Project {
  id: string;
  Name: string;
  Stage: string;
  "Deal Size": string;
  Lead: string;
  "Last Activity": string;
  // linked
  Client?: string[];
  Tasks?: string[];
  Documents?: string[];
  "Term Sheets"?: string[];
  Outreach?: string[];
  KPIs?: string[];
  [key: string]: unknown;
}

export interface Investor {
  id: string;
  Name: string;
  Firm: string;
  Type: string;
  Notes: string;
  // linked
  Contacts?: string[];
  [key: string]: unknown;
}

export interface InvestorContact {
  id: string;
  Name: string;
  Email: string;
  Phone: string;
  Role: string;
  // linked
  Investor?: string[];
  [key: string]: unknown;
}

export interface Outreach {
  id: string;
  Subject: string;
  Type: string; // Email, Call, Meeting
  Date: string;
  Status: string;
  Notes: string;
  // linked
  Project?: string[];
  Investor?: string[];
  [key: string]: unknown;
}

export interface Task {
  id: string;
  Title: string;
  Assignee: string;
  "Due Date": string;
  Status: string;
  Priority: string;
  // linked
  Project?: string[];
  [key: string]: unknown;
}

export interface Document {
  id: string;
  Name: string;
  Type: string;
  Version: string;
  Status: string;
  "Uploaded By": string;
  "Uploaded At": string;
  // linked
  Project?: string[];
  [key: string]: unknown;
}

export interface TermSheet {
  id: string;
  Amount: string;
  Terms: string;
  Status: string;
  Date: string;
  // linked
  Project?: string[];
  Investor?: string[];
  [key: string]: unknown;
}

export interface KPI {
  id: string;
  Metric: string;
  Value: string;
  Period: string;
  Target: string;
  Status: string;
  // linked
  Project?: string[];
  [key: string]: unknown;
}

export interface TeamMember {
  id: string;
  Name: string;
  Email: string;
  Role: string;
  Department: string;
  Status: string;
  [key: string]: unknown;
}

// ─── Airtable table name constants ──────────────────────────
export const TABLES = {
  PROJECTS: "Projects",
  CLIENTS: "Sponsors / Clients",
  INVESTORS: "Investors",
  INVESTOR_CONTACTS: "Investor Contacts",
  OUTREACH: "Outreach",
  TASKS: "Tasks",
  DOCUMENTS: "Documents",
  TERM_SHEETS: "Term Sheet Tracker",
  KPIS: "KPIs / Monitoring",
  TEAM: "Team",
} as const;

// ─── Stage pipeline config ──────────────────────────────────
export const STAGE_ORDER = [
  "Sourcing",
  "Due Diligence",
  "Structuring",
  "Closing",
  "Closed",
  "Dead",
] as const;

export const stageColors: Record<string, string> = {
  Sourcing: "bg-muted text-muted-foreground",
  "Due Diligence": "bg-info/10 text-info",
  Structuring: "bg-warning/10 text-warning",
  Closing: "bg-primary/10 text-primary",
  Closed: "bg-success/10 text-success",
  Dead: "bg-destructive/10 text-destructive",
};

export const stageColumnBorder: Record<string, string> = {
  Sourcing: "border-t-muted-foreground",
  "Due Diligence": "border-t-info",
  Structuring: "border-t-warning",
  Closing: "border-t-primary",
  Closed: "border-t-success",
  Dead: "border-t-destructive",
};
