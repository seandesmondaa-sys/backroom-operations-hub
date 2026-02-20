import { PageHeader } from "@/components/PageHeader";
import { useInvestors } from "@/hooks/use-airtable";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Investors() {
  const { data: investors = [], isLoading } = useInvestors();

  return (
    <div>
      <PageHeader title="Investors" description="Investor directory and outreach tracking">
        <Button size="sm" className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Investor
        </Button>
      </PageHeader>

      <div className="p-6">
        {isLoading ? (
          <Skeleton className="h-64 w-full rounded-lg" />
        ) : (
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-semibold">Name</TableHead>
                  <TableHead className="text-xs font-semibold">Firm</TableHead>
                  <TableHead className="text-xs font-semibold">Email</TableHead>
                  <TableHead className="text-xs font-semibold">Type</TableHead>
                  <TableHead className="text-xs font-semibold">Last Contact</TableHead>
                  <TableHead className="text-xs font-semibold">Meetings</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investors.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/30 cursor-pointer">
                    <TableCell className="text-sm font-medium">{inv.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.firm}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{inv.email}</TableCell>
                    <TableCell>
                      <span className="text-[11px] font-mono text-muted-foreground">{inv.type}</span>
                    </TableCell>
                    <TableCell className="text-[11px] font-mono text-muted-foreground">{inv.lastContact}</TableCell>
                    <TableCell className="font-mono text-sm">{inv.meetingCount}</TableCell>
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
