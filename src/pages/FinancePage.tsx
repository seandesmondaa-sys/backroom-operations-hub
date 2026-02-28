import { useState, useMemo } from "react";
import { PageHeader } from "@/components/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/use-auth";
import {
  useBudgets, useCreateBudget,
  useExpenses, useCreateExpense, useUpdateExpenseStatus,
  useRevenueEntries, useCreateRevenue,
  useInvoices, useCreateInvoice, useUpdateInvoiceStatus,
} from "@/hooks/use-finance";
import {
  Plus, DollarSign, TrendingUp, TrendingDown, Receipt,
  FileText, CheckCircle, XCircle, Clock,
} from "lucide-react";
import { format } from "date-fns";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";

const CATEGORIES = ["operational", "marketing", "staffing", "legal", "technology", "travel", "other"] as const;
const CHART_COLORS = [
  "hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))",
  "hsl(var(--destructive))", "hsl(var(--muted-foreground))", "hsl(212 60% 40%)", "hsl(30 80% 55%)",
];

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
    paid: "bg-blue-100 text-blue-800",
    draft: "bg-muted text-muted-foreground",
    sent: "bg-sky-100 text-sky-800",
    overdue: "bg-red-100 text-red-800",
    cancelled: "bg-muted text-muted-foreground",
  };
  return <Badge className={map[status] || ""}>{status}</Badge>;
}

function money(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

// ── Dashboard Tab ────────────────────────────────────────────
function DashboardTab() {
  const { data: budgets = [] } = useBudgets();
  const { data: expenses = [] } = useExpenses();
  const { data: revenue = [] } = useRevenueEntries();
  const { data: invoices = [] } = useInvoices();

  const totalBudget = budgets.reduce((s, b) => s + Number(b.allocated_amount), 0);
  const totalSpent = expenses.filter((e: any) => e.status === "approved" || e.status === "paid").reduce((s: number, e: any) => s + Number(e.amount), 0);
  const totalRevenue = revenue.reduce((s: number, r: any) => s + Number(r.amount), 0);
  const pendingInvoices = invoices.filter((i: any) => i.status === "sent" || i.status === "overdue");
  const pendingAmount = pendingInvoices.reduce((s: number, i: any) => s + Number(i.amount), 0);

  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e: any) => { map[e.category] = (map[e.category] || 0) + Number(e.amount); });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const monthlyData = useMemo(() => {
    const map: Record<string, { expenses: number; revenue: number }> = {};
    expenses.forEach((e: any) => {
      const m = format(new Date(e.expense_date), "MMM");
      if (!map[m]) map[m] = { expenses: 0, revenue: 0 };
      map[m].expenses += Number(e.amount);
    });
    revenue.forEach((r: any) => {
      const m = format(new Date(r.revenue_date), "MMM");
      if (!map[m]) map[m] = { expenses: 0, revenue: 0 };
      map[m].revenue += Number(r.amount);
    });
    return Object.entries(map).map(([month, d]) => ({ month, ...d }));
  }, [expenses, revenue]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Budget", value: money(totalBudget), icon: DollarSign, color: "text-primary" },
          { label: "Total Spent", value: money(totalSpent), icon: TrendingDown, color: "text-destructive" },
          { label: "Total Revenue", value: money(totalRevenue), icon: TrendingUp, color: "text-success" },
          { label: "Pending Invoices", value: money(pendingAmount), icon: Clock, color: "text-accent" },
        ].map((c) => (
          <Card key={c.label}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                </div>
                <c.icon className={`h-8 w-8 ${c.color} opacity-40`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-sm">Monthly Overview</CardTitle></CardHeader>
          <CardContent className="h-64">
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="hsl(var(--success))" name="Revenue" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" fill="hsl(var(--destructive))" name="Expenses" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Expenses by Category</CardTitle></CardHeader>
          <CardContent className="h-64">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => money(v)} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Budgets Tab ──────────────────────────────────────────────
function BudgetsTab() {
  const { user } = useAuth();
  const { data: budgets = [] } = useBudgets();
  const createBudget = useCreateBudget();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", category: "operational", allocated_amount: "", fiscal_year: "2026", notes: "" });

  const handleSubmit = () => {
    if (!form.name || !form.allocated_amount) return;
    createBudget.mutate({
      ...form,
      allocated_amount: parseFloat(form.allocated_amount),
      created_by: user!.id,
    }, { onSuccess: () => { setOpen(false); setForm({ name: "", category: "operational", allocated_amount: "", fiscal_year: "2026", notes: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Add Budget</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Budget</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Budget name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Allocated amount" value={form.allocated_amount} onChange={(e) => setForm({ ...form, allocated_amount: e.target.value })} />
              <Input placeholder="Fiscal year" value={form.fiscal_year} onChange={(e) => setForm({ ...form, fiscal_year: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSubmit} disabled={createBudget.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((b: any) => {
          const pct = b.allocated_amount > 0 ? (Number(b.spent_amount) / Number(b.allocated_amount)) * 100 : 0;
          return (
            <Card key={b.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{b.name}</h3>
                  <Badge variant="outline">{b.category}</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Spent: {money(Number(b.spent_amount))}</span>
                    <span>Budget: {money(Number(b.allocated_amount))}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${pct > 90 ? "bg-destructive" : pct > 70 ? "bg-yellow-500" : "bg-primary"}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground text-right">{pct.toFixed(0)}% used • FY {b.fiscal_year}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
        {budgets.length === 0 && <p className="text-sm text-muted-foreground col-span-full text-center py-8">No budgets yet</p>}
      </div>
    </div>
  );
}

// ── Expenses Tab ─────────────────────────────────────────────
function ExpensesTab() {
  const { user } = useAuth();
  const { data: expenses = [] } = useExpenses();
  const createExpense = useCreateExpense();
  const updateStatus = useUpdateExpenseStatus();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", category: "operational", vendor: "", expense_date: format(new Date(), "yyyy-MM-dd"), notes: "" });

  const handleSubmit = () => {
    if (!form.description || !form.amount) return;
    createExpense.mutate({
      ...form,
      amount: parseFloat(form.amount),
      submitted_by: user!.id,
    }, { onSuccess: () => { setOpen(false); setForm({ description: "", amount: "", category: "operational", vendor: "", expense_date: format(new Date(), "yyyy-MM-dd"), notes: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Submit Expense</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Submit Expense</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input placeholder="Vendor" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
              <Input type="date" value={form.expense_date} onChange={(e) => setForm({ ...form, expense_date: e.target.value })} />
              <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <Button onClick={handleSubmit} disabled={createExpense.isPending} className="w-full">Submit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Vendor</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((e: any) => (
              <TableRow key={e.id}>
                <TableCell className="text-xs">{format(new Date(e.expense_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm font-medium">{e.description}</TableCell>
                <TableCell><Badge variant="outline" className="text-[11px]">{e.category}</Badge></TableCell>
                <TableCell className="text-xs">{e.vendor || "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{money(Number(e.amount))}</TableCell>
                <TableCell>{statusBadge(e.status)}</TableCell>
                <TableCell>
                  {e.status === "pending" && (
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-success" onClick={() => updateStatus.mutate({ id: e.id, status: "approved", approved_by: user!.id })}>
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => updateStatus.mutate({ id: e.id, status: "rejected", approved_by: user!.id })}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No expenses yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ── Revenue Tab ──────────────────────────────────────────────
function RevenueTab() {
  const { user } = useAuth();
  const { data: revenue = [] } = useRevenueEntries();
  const createRevenue = useCreateRevenue();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ source: "", amount: "", revenue_date: format(new Date(), "yyyy-MM-dd"), description: "" });

  const handleSubmit = () => {
    if (!form.source || !form.amount) return;
    createRevenue.mutate({
      ...form,
      amount: parseFloat(form.amount),
      recorded_by: user!.id,
    }, { onSuccess: () => { setOpen(false); setForm({ source: "", amount: "", revenue_date: format(new Date(), "yyyy-MM-dd"), description: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> Record Revenue</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Revenue</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <Input type="date" value={form.revenue_date} onChange={(e) => setForm({ ...form, revenue_date: e.target.value })} />
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button onClick={handleSubmit} disabled={createRevenue.isPending} className="w-full">Record</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {revenue.map((r: any) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{format(new Date(r.revenue_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm font-medium">{r.source}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{r.description || "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm text-success">{money(Number(r.amount))}</TableCell>
              </TableRow>
            ))}
            {revenue.length === 0 && (
              <TableRow><TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">No revenue recorded yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ── Invoices Tab ─────────────────────────────────────────────
function InvoicesTab() {
  const { user } = useAuth();
  const { data: invoices = [] } = useInvoices();
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ invoice_number: "", client_name: "", amount: "", due_date: "", issue_date: format(new Date(), "yyyy-MM-dd"), description: "" });

  const handleSubmit = () => {
    if (!form.invoice_number || !form.client_name || !form.amount || !form.due_date) return;
    createInvoice.mutate({
      ...form,
      amount: parseFloat(form.amount),
      created_by: user!.id,
    }, { onSuccess: () => { setOpen(false); setForm({ invoice_number: "", client_name: "", amount: "", due_date: "", issue_date: format(new Date(), "yyyy-MM-dd"), description: "" }); } });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New Invoice</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
            <div className="space-y-3 pt-2">
              <Input placeholder="Invoice # (e.g. INV-001)" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} />
              <Input placeholder="Client name" value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
              <Input type="number" placeholder="Amount" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Issue Date</label>
                  <Input type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Due Date</label>
                  <Input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
                </div>
              </div>
              <Textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <Button onClick={handleSubmit} disabled={createInvoice.isPending} className="w-full">Create</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice #</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Issue Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv: any) => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-sm">{inv.invoice_number}</TableCell>
                <TableCell className="text-sm font-medium">{inv.client_name}</TableCell>
                <TableCell className="text-xs">{format(new Date(inv.issue_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-xs">{format(new Date(inv.due_date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right font-mono text-sm">{money(Number(inv.amount))}</TableCell>
                <TableCell>{statusBadge(inv.status)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {inv.status === "draft" && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: inv.id, status: "sent" })}>Send</Button>
                    )}
                    {(inv.status === "sent" || inv.status === "overdue") && (
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => updateStatus.mutate({ id: inv.id, status: "paid", paid_date: format(new Date(), "yyyy-MM-dd") })}>Mark Paid</Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {invoices.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">No invoices yet</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────
export default function FinancePage() {
  return (
    <div>
      <PageHeader title="Finance" description="Budgets, expenses, revenue & invoices" />
      <div className="p-6">
        <Tabs defaultValue="dashboard">
          <TabsList>
            <TabsTrigger value="dashboard"><DollarSign className="h-3.5 w-3.5 mr-1.5" />Dashboard</TabsTrigger>
            <TabsTrigger value="budgets"><Receipt className="h-3.5 w-3.5 mr-1.5" />Budgets</TabsTrigger>
            <TabsTrigger value="expenses"><TrendingDown className="h-3.5 w-3.5 mr-1.5" />Expenses</TabsTrigger>
            <TabsTrigger value="revenue"><TrendingUp className="h-3.5 w-3.5 mr-1.5" />Revenue</TabsTrigger>
            <TabsTrigger value="invoices"><FileText className="h-3.5 w-3.5 mr-1.5" />Invoices</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
          <TabsContent value="budgets"><BudgetsTab /></TabsContent>
          <TabsContent value="expenses"><ExpensesTab /></TabsContent>
          <TabsContent value="revenue"><RevenueTab /></TabsContent>
          <TabsContent value="invoices"><InvoicesTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
