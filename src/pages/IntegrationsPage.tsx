import { PageHeader } from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Cloud, Mail, CalendarDays, HardDrive, FolderSync, Plug, ExternalLink } from "lucide-react";

const INTEGRATIONS = [
  {
    name: "Google Drive",
    description: "Sync documents and data rooms with Google Drive folders. Auto-upload contracts and compliance files.",
    icon: HardDrive,
    status: "ready" as const,
    features: ["Document sync", "Auto-backup", "Shared drives"],
  },
  {
    name: "Gmail",
    description: "Send invoice reminders, approval notifications, and outreach emails directly from AC OS.",
    icon: Mail,
    status: "ready" as const,
    features: ["Email notifications", "Invoice reminders", "Outreach templates"],
  },
  {
    name: "Google Calendar",
    description: "Two-way sync between AC OS calendar events, meetings, and deadlines with Google Calendar.",
    icon: CalendarDays,
    status: "ready" as const,
    features: ["Event sync", "Meeting invites", "Deadline alerts"],
  },
  {
    name: "Dropbox",
    description: "Connect Dropbox for external file storage and partner-shared data rooms.",
    icon: FolderSync,
    status: "planned" as const,
    features: ["File storage", "Partner sharing", "Version history"],
  },
  {
    name: "QuickBooks",
    description: "Export invoices, expenses, and revenue in QuickBooks-compatible format. Use Exports page for manual sync.",
    icon: Cloud,
    status: "export_ready" as const,
    features: ["Invoice export", "Expense export", "Revenue export"],
  },
  {
    name: "Xero",
    description: "Export financial data in Xero-compatible JSON format. Direct API integration planned.",
    icon: Cloud,
    status: "export_ready" as const,
    features: ["JSON export", "Chart of Accounts mapping", "Tax codes"],
  },
];

function statusLabel(status: string) {
  switch (status) {
    case "ready": return { text: "Ready to Connect", variant: "default" as const };
    case "export_ready": return { text: "Export Available", variant: "secondary" as const };
    case "planned": return { text: "Planned", variant: "outline" as const };
    default: return { text: status, variant: "outline" as const };
  }
}

export default function IntegrationsPage() {
  const handleConnect = (name: string) => {
    toast.info(`${name} integration will be configured by your administrator. Contact support for API credentials setup.`);
  };

  return (
    <div>
      <PageHeader title="Integrations" description="Connect AC OS with external tools and accounting platforms" />
      <div className="p-6">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {INTEGRATIONS.map((int) => {
            const st = statusLabel(int.status);
            return (
              <Card key={int.name} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <int.icon className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{int.name}</CardTitle>
                    </div>
                    <Badge variant={st.variant} className="text-[10px]">{st.text}</Badge>
                  </div>
                  <CardDescription className="text-xs mt-1">{int.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col justify-end gap-3">
                  <div className="flex flex-wrap gap-1">
                    {int.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
                    ))}
                  </div>
                  {int.status === "export_ready" ? (
                    <Button size="sm" variant="secondary" className="w-full" asChild>
                      <a href="/exports">
                        <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                        Go to Exports
                      </a>
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant={int.status === "ready" ? "default" : "outline"}
                      className="w-full"
                      onClick={() => handleConnect(int.name)}
                      disabled={int.status === "planned"}
                    >
                      <Plug className="h-3.5 w-3.5 mr-1.5" />
                      {int.status === "planned" ? "Coming Soon" : "Configure"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
