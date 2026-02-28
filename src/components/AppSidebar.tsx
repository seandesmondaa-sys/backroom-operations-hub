import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCheck,
  CheckSquare,
  FileText,
  Handshake,
  LogOut,
  Mail,
  Contact,
  UsersRound,
  Activity,
  MessageSquare,
  Shield,
  Workflow,
  Gauge,
  CalendarDays,
  HeartPulse,
  Banknote,
  FolderOpen,
  ClipboardCheck,
  ScrollText,
} from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { SyncStatus } from "@/components/SyncStatus";
import { useIsSuperAdmin } from "@/hooks/use-roles";
import acLogo from "@/assets/logo.jpg";

interface NavSection {
  label: string;
  items: { title: string; url: string; icon: React.ComponentType<{ className?: string }> }[];
}

const crmItems = [
  { title: "Pipeline", url: "/", icon: FolderKanban },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Projects", url: "/projects", icon: LayoutDashboard },
  { title: "Investors", url: "/investors", icon: UserCheck },
  { title: "Contacts", url: "/investor-contacts", icon: Contact },
  { title: "Outreach", url: "/outreach", icon: Mail },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Data Rooms", url: "/data-rooms", icon: FileText },
  { title: "Deal Desk", url: "/deal-desk", icon: Handshake },
];

const opsItems = [
  { title: "Workflow", url: "/workflow", icon: Workflow },
  { title: "Calendar", url: "/calendar", icon: CalendarDays },
  { title: "Messages", url: "/messages", icon: MessageSquare },
  { title: "Documents", url: "/documents", icon: FolderOpen },
  { title: "Approvals", url: "/approvals", icon: ClipboardCheck },
];

const insightItems = [
  { title: "Dashboard", url: "/dashboard", icon: Gauge },
  { title: "KPIs", url: "/portfolio", icon: Activity },
  { title: "Team", url: "/team", icon: UsersRound },
];

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();
  const { isSuperAdmin } = useIsSuperAdmin();

  const sections: NavSection[] = [
    { label: "CRM", items: crmItems },
    { label: "Operations", items: opsItems },
    { label: "Insights", items: insightItems },
    { label: "Departments", items: [
      { title: "HR", url: "/hr", icon: HeartPulse },
      { title: "Finance", url: "/finance", icon: Banknote },
    ]},
  ];

  if (isSuperAdmin) {
    sections.push({
      label: "Admin",
      items: [
        { title: "Roles & Permissions", url: "/admin/roles", icon: Shield },
        { title: "Audit Log", url: "/admin/audit", icon: ScrollText },
      ],
    });
  }

  const renderNavItem = (item: NavSection["items"][0]) => {
    const isActive = location.pathname === item.url ||
      (item.url !== "/" && location.pathname.startsWith(item.url));
    return (
      <NavLink
        key={item.url}
        to={item.url}
        end={item.url === "/"}
        className={`flex items-center gap-3 px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
          isActive ? "" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        }`}
        activeClassName="bg-sidebar-accent text-sidebar-primary"
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.title}</span>
      </NavLink>
    );
  };

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="px-5 py-4 border-b border-sidebar-border flex items-center gap-3">
        <img src={acLogo} alt="AC OS" className="h-8 w-8 rounded" />
        <div>
          <h1 className="text-sm font-bold tracking-wider text-sidebar-primary uppercase font-mono">
            AC OS
          </h1>
          <p className="text-[11px] text-sidebar-muted mt-0.5">Auxilium Consults</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-sidebar-muted">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(renderNavItem)}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
        <div className="flex items-center justify-between px-1">
          <SyncStatus />
          <NotificationBell />
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors w-full"
        >
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
