import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { clients } from "@/lib/mock-data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function Clients() {
  return (
    <div>
      <PageHeader title="Clients" description="Sponsors and client organizations">
        <Button size="sm" className="h-8 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Add Client
        </Button>
      </PageHeader>

      <div className="p-6">
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-semibold">Name</TableHead>
                <TableHead className="text-xs font-semibold">Type</TableHead>
                <TableHead className="text-xs font-semibold">Industry</TableHead>
                <TableHead className="text-xs font-semibold">Contact</TableHead>
                <TableHead className="text-xs font-semibold">Projects</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="hover:bg-muted/30 cursor-pointer">
                  <TableCell className="text-sm font-medium">{client.name}</TableCell>
                  <TableCell>
                    <span className="text-[11px] font-mono text-muted-foreground">{client.type}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{client.industry}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{client.contactName}</p>
                      <p className="text-[11px] text-muted-foreground">{client.contactEmail}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-sm">{client.projectCount}</span>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
