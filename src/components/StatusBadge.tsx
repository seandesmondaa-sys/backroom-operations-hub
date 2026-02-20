import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  Active: "bg-success/10 text-success",
  Inactive: "bg-muted text-muted-foreground",
  Prospect: "bg-info/10 text-info",
  "To Do": "bg-muted text-muted-foreground",
  "In Progress": "bg-info/10 text-info",
  Done: "bg-success/10 text-success",
  Overdue: "bg-destructive/10 text-destructive",
  Draft: "bg-muted text-muted-foreground",
  "Under Review": "bg-warning/10 text-warning",
  Final: "bg-success/10 text-success",
  Expired: "bg-destructive/10 text-destructive",
  Proposed: "bg-info/10 text-info",
  Negotiating: "bg-warning/10 text-warning",
  Signed: "bg-success/10 text-success",
  Declined: "bg-destructive/10 text-destructive",
  High: "bg-destructive/10 text-destructive",
  Medium: "bg-warning/10 text-warning",
  Low: "bg-muted text-muted-foreground",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium font-mono",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {status}
    </span>
  );
}
