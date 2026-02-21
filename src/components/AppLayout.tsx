import { AppSidebar } from "@/components/AppSidebar";
import { AiChatPanel } from "@/components/AiChatPanel";
import { Outlet } from "react-router-dom";

export function AppLayout({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex min-h-screen w-full">
      <AppSidebar onLogout={onLogout} />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      <AiChatPanel />
    </div>
  );
}
