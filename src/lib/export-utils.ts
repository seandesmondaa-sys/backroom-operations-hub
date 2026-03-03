/**
 * Accounting-ready export utilities (QuickBooks / Xero compatible)
 */

// ── CSV helpers ──────────────────────────────────────────────
function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(escapeCsv).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsv(row[h])).join(","));
  }
  return lines.join("\n");
}

// ── Invoice export (QuickBooks IIF / Xero compatible) ────────
export function exportInvoicesCsv(invoices: any[]): string {
  const headers = [
    "InvoiceNumber", "CustomerName", "InvoiceDate", "DueDate",
    "Amount", "Status", "PaidDate", "Description", "ProjectId",
  ];
  const rows = invoices.map((inv) => ({
    InvoiceNumber: inv.invoice_number,
    CustomerName: inv.client_name,
    InvoiceDate: inv.issue_date,
    DueDate: inv.due_date,
    Amount: inv.amount,
    Status: inv.status,
    PaidDate: inv.paid_date || "",
    Description: inv.description || "",
    ProjectId: inv.project_id || "",
  }));
  return toCsv(headers, rows);
}

export function exportInvoicesJson(invoices: any[]): string {
  const mapped = invoices.map((inv) => ({
    Type: "ACCREC",
    InvoiceNumber: inv.invoice_number,
    Contact: { Name: inv.client_name },
    Date: inv.issue_date,
    DueDate: inv.due_date,
    Status: inv.status?.toUpperCase(),
    LineItems: [
      {
        Description: inv.description || inv.invoice_number,
        Quantity: 1,
        UnitAmount: inv.amount,
        AccountCode: "200",
      },
    ],
    Total: inv.amount,
  }));
  return JSON.stringify({ Invoices: mapped }, null, 2);
}

// ── Expense export ───────────────────────────────────────────
export function exportExpensesCsv(expenses: any[]): string {
  const headers = [
    "Date", "Description", "Amount", "Category", "Vendor",
    "Status", "Notes", "BudgetId",
  ];
  const rows = expenses.map((e) => ({
    Date: e.expense_date,
    Description: e.description,
    Amount: e.amount,
    Category: e.category,
    Vendor: e.vendor || "",
    Status: e.status,
    Notes: e.notes || "",
    BudgetId: e.budget_id || "",
  }));
  return toCsv(headers, rows);
}

export function exportExpensesJson(expenses: any[]): string {
  const mapped = expenses.map((e) => ({
    Type: "ACCPAY",
    Contact: { Name: e.vendor || "Unknown" },
    Date: e.expense_date,
    Status: e.status?.toUpperCase(),
    LineItems: [
      {
        Description: e.description,
        Quantity: 1,
        UnitAmount: e.amount,
        AccountCode: "400",
        TaxType: "NONE",
      },
    ],
    Total: e.amount,
  }));
  return JSON.stringify({ Expenses: mapped }, null, 2);
}

// ── Revenue export ───────────────────────────────────────────
export function exportRevenueCsv(entries: any[]): string {
  const headers = ["Date", "Source", "Amount", "Description", "ProjectId"];
  const rows = entries.map((r) => ({
    Date: r.revenue_date,
    Source: r.source,
    Amount: r.amount,
    Description: r.description || "",
    ProjectId: r.project_id || "",
  }));
  return toCsv(headers, rows);
}

export function exportRevenueJson(entries: any[]): string {
  const mapped = entries.map((r) => ({
    Type: "REVENUE",
    Date: r.revenue_date,
    Source: r.source,
    Amount: r.amount,
    Description: r.description || "",
    AccountCode: "100",
  }));
  return JSON.stringify({ RevenueEntries: mapped }, null, 2);
}

// ── Download trigger ─────────────────────────────────────────
export function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
