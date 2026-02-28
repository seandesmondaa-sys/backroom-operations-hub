import { useState } from "react";
import { PageHeader } from "@/components/PageHeader";
import { useAuditLogs } from "@/hooks/use-audit-logs";
import { useIsSuperAdmin } from "@/hooks/use-roles";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield, FileText, ArrowUpCircle, ArrowDownCircle, Trash2 } from "lucide-react";
import { format } from "date-fns";

const TABLE_LABELS: Record<string, string> = {
  expenses: "Expenses",
  budgets: "Budgets",
  invoices: "Invoices",
  hr_leave_requests: "Leave Requests",
  os_tasks: "Tasks",
  user_roles: "User Roles",
  documents: "Documents",
  approval_requests: "Approvals",
  approval_steps: "Approval Steps",
};

const ACTION_ICONS: Record<string, typeof ArrowUpCircle> = {
  INSERT: ArrowUpCircle,
  UPDATE: FileText,
  DELETE: Trash2,
};

const ACTION_COLORS: Record<string, string> = {
  INSERT: "text-success",
  UPDATE: "text-info",
  DELETE: "text-destructive",
};

export default function AuditLogPage() {
  const { isSuperAdmin, isLoading: roleLoading } = useIsSuperAdmin();
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [actionFilter, setActionFilter] = useState<string>("all");

  const { data: logs = [], isLoading } = useAuditLogs({
    table_name: tableFilter === "all" ? undefined : tableFilter,
    action: actionFilter === "all" ? undefined : actionFilter,
  });

  if (roleLoading) return <div className="p-6"><Skeleton className="h-64 w-full" /></div>;

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-2">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold">Access Denied</h2>
          <p className="text-sm text-muted-foreground">Super Admin access required.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Log" description="System-wide activity tracking" />
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <Select value={tableFilter} onValueChange={setTableFilter}>
            <SelectTrigger className="w-48 h-8 text-xs"><SelectValue placeholder="All tables" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All tables</SelectItem>
              {Object.entries(TABLE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k} className="text-xs">{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All actions</SelectItem>
              <SelectItem value="INSERT" className="text-xs">Created</SelectItem>
              <SelectItem value="UPDATE" className="text-xs">Updated</SelectItem>
              <SelectItem value="DELETE" className="text-xs">Deleted</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <Badge variant="outline" className="text-xs h-8 px-3 flex items-center">
            {logs.length} entries
          </Badge>
        </div>

        {isLoading ? <Skeleton className="h-96 w-full rounded-lg" /> : (
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold w-10" />
                  <TableHead className="text-xs font-semibold">Action</TableHead>
                  <TableHead className="text-xs font-semibold">Table</TableHead>
                  <TableHead className="text-xs font-semibold">Record</TableHead>
                  <TableHead className="text-xs font-semibold">User</TableHead>
                  <TableHead className="text-xs font-semibold">Timestamp</TableHead>
                  <TableHead className="text-xs font-semibold">Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const Icon = ACTION_ICONS[log.action] || FileText;
                  const changes = log.action === "UPDATE" && log.old_data && log.new_data
                    ? Object.keys(log.new_data).filter(
                        (k) => JSON.stringify(log.old_data?.[k]) !== JSON.stringify(log.new_data?.[k]) && k !== "updated_at"
                      )
                    : [];

                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <Icon className={`h-4 w-4 ${ACTION_COLORS[log.action] || ""}`} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {TABLE_LABELS[log.table_name] || log.table_name}
                      </TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground truncate max-w-[120px]">
                        {log.record_id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-xs">{log.performer_name}</TableCell>
                      <TableCell className="text-[11px] font-mono text-muted-foreground">
                        {format(new Date(log.performed_at), "MMM d, HH:mm:ss")}
                      </TableCell>
                      <TableCell className="text-[11px] text-muted-foreground max-w-[200px] truncate">
                        {changes.length > 0
                          ? changes.join(", ")
                          : log.action === "INSERT"
                          ? (log.new_data as any)?.title || (log.new_data as any)?.name || (log.new_data as any)?.description || "—"
                          : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {logs.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-12">
                      No audit logs yet. Activity will be recorded automatically.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </div>
  );
}
