import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useInvoices, useExpenses, useRevenueEntries } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  downloadFile,
  exportInvoicesCsv, exportInvoicesJson,
  exportExpensesCsv, exportExpensesJson,
  exportRevenueCsv, exportRevenueJson,
} from "@/lib/export-utils";
import { Download, FileSpreadsheet, FileJson, FileText } from "lucide-react";

type ExportFormat = "csv" | "json";

const EXPORT_SECTIONS = [
  {
    key: "invoices" as const,
    title: "Invoices",
    description: "QuickBooks IIF / Xero-compatible invoice export",
    icon: FileText,
  },
  {
    key: "expenses" as const,
    title: "Expenses",
    description: "Expense reports with category, vendor, and approval status",
    icon: FileSpreadsheet,
  },
  {
    key: "revenue" as const,
    title: "Revenue",
    description: "Revenue entries with source and project attribution",
    icon: FileJson,
  },
];

export default function ExportsPage() {
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [] } = useExpenses();
  const { data: revenue = [] } = useRevenueEntries();
  const [format, setFormat] = useState<ExportFormat>("csv");

  const handleExport = (section: string) => {
    const ts = new Date().toISOString().slice(0, 10);
    const mime = format === "csv" ? "text/csv" : "application/json";
    let content = "";
    let filename = "";

    switch (section) {
      case "invoices":
        if (invoices.length === 0) { toast.error("No invoices to export"); return; }
        content = format === "csv" ? exportInvoicesCsv(invoices) : exportInvoicesJson(invoices);
        filename = `invoices_${ts}.${format}`;
        break;
      case "expenses":
        if (expenses.length === 0) { toast.error("No expenses to export"); return; }
        content = format === "csv" ? exportExpensesCsv(expenses) : exportExpensesJson(expenses);
        filename = `expenses_${ts}.${format}`;
        break;
      case "revenue":
        if (revenue.length === 0) { toast.error("No revenue entries to export"); return; }
        content = format === "csv" ? exportRevenueCsv(revenue) : exportRevenueJson(revenue);
        filename = `revenue_${ts}.${format}`;
        break;
    }

    downloadFile(content, filename, mime);
    toast.success(`${section} exported as ${format.toUpperCase()}`);
  };

  const counts: Record<string, number> = {
    invoices: invoices.length,
    expenses: expenses.length,
    revenue: revenue.length,
  };

  return (
    <div>
      <PageHeader title="Exports" description="Accounting-ready exports for QuickBooks, Xero, and custom reporting" />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Format:</span>
          <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="json">JSON (Xero)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {EXPORT_SECTIONS.map((sec) => (
            <Card key={sec.key} className="flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <sec.icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{sec.title}</CardTitle>
                </div>
                <CardDescription className="text-xs">{sec.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-end gap-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">{counts[sec.key]} records</Badge>
                  <Badge variant="outline" className="text-xs uppercase">{format}</Badge>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleExport(sec.key)}
                  disabled={counts[sec.key] === 0}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Export {sec.title}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
