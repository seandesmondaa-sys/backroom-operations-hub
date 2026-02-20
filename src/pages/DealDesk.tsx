import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { useTermSheets } from "@/hooks/use-airtable";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function DealDesk() {
  const { data: termSheets = [], isLoading } = useTermSheets();

  return (
    <div>
      <PageHeader title="Deal Desk" description="Active term sheets and negotiations" />
      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Project</TableHead>
                  <TableHead className="text-xs font-semibold">Investor</TableHead>
                  <TableHead className="text-xs font-semibold">Amount</TableHead>
                  <TableHead className="text-xs font-semibold">Terms</TableHead>
                  <TableHead className="text-xs font-semibold">Status</TableHead>
                  <TableHead className="text-xs font-semibold">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {termSheets.map((ts) => (
                  <TableRow key={ts.id} className="hover:bg-muted/30">
                    <TableCell className="text-sm font-medium">{ts.projectName}</TableCell>
                    <TableCell className="text-sm">{ts.investor}</TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-primary">{ts.amount}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{ts.terms}</TableCell>
                    <TableCell><StatusBadge status={ts.status} /></TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{ts.date}</TableCell>
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
