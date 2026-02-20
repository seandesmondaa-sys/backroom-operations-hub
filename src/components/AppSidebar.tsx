import {
  LayoutDashboard,
  Users,
  FolderKanban,
  UserCheck,
  CheckSquare,
  FileText,
  Handshake,
  BarChart3,
  LogOut,
  Mail,
  Contact,
  UsersRound,
  Activity,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { SyncStatus } from "@/components/SyncStatus";

const navItems = [
  { title: "Pipeline", url: "/", icon: FolderKanban },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Projects", url: "/projects", icon: LayoutDashboard },
  { title: "Investors", url: "/investors", icon: UserCheck },
  { title: "Contacts", url: "/investor-contacts", icon: Contact },
  { title: "Outreach", url: "/outreach", icon: Mail },
  { title: "Tasks", url: "/tasks", icon: CheckSquare },
  { title: "Data Rooms", url: "/data-rooms", icon: FileText },
  { title: "Deal Desk", url: "/deal-desk", icon: Handshake },
  { title: "KPIs", url: "/portfolio", icon: Activity },
  { title: "Team", url: "/team", icon: UsersRound },
];

export function AppSidebar({ onLogout }: { onLogout: () => void }) {
  const location = useLocation();

  return (
    <aside className="flex flex-col w-56 min-h-screen bg-sidebar border-r border-sidebar-border shrink-0">
      <div className="px-5 py-5 border-b border-sidebar-border">
        <h1 className="text-sm font-bold tracking-wider text-sidebar-primary uppercase font-mono">
          OpsDesk
        </h1>
        <p className="text-[11px] text-sidebar-muted mt-0.5">Backroom CRM</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.url ||
            (item.url !== "/" && location.pathname.startsWith(item.url));
          return (
            <NavLink
              key={item.url}
              to={item.url}
              end={item.url === "/"}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                isActive ? "" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              activeClassName="bg-sidebar-accent text-sidebar-primary"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-sidebar-border space-y-2">
        <SyncStatus />
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
