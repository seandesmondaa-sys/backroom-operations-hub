import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTermSheets } from "@/hooks/use-airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function DealDesk() {
  const { data: termSheets = [], isLoading } = useTermSheets();

  return (
    <div>
      <PageHeader title="Deal Desk" description="Active term sheets and negotiations" />
      <div className="p-6">
        {isLoading ? <Skeleton className="h-64 w-full rounded-lg" /> : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Terms</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termSheets.map((ts) => (
                  <TableRow key={ts.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm font-semibold text-primary">{String(ts.Amount || "")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{String(ts.Terms || "")}</TableCell>
                    <TableCell><StatusBadge status={String(ts.Status || "")} /></TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{String(ts.Date || "")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
