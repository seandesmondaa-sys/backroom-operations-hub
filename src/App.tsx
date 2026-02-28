import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/AppLayout";
import AuthPage from "./pages/AuthPage";
import Pipeline from "./pages/Pipeline";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectProfile from "./pages/ProjectProfile";
import Investors from "./pages/Investors";
import InvestorContactsPage from "./pages/InvestorContactsPage";
import OutreachPage from "./pages/OutreachPage";
import Tasks from "./pages/Tasks";
import DataRooms from "./pages/DataRooms";
import DealDesk from "./pages/DealDesk";
import Portfolio from "./pages/Portfolio";
import TeamPage from "./pages/TeamPage";
import MessagesPage from "./pages/MessagesPage";
import AdminRolesPage from "./pages/AdminRolesPage";
import WorkflowTasksPage from "./pages/WorkflowTasksPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: true,
      staleTime: 15_000,
    },
  },
});

function AppRoutes() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Sonner />
      <Routes>
        <Route element={<AppLayout onLogout={signOut} />}>
          <Route path="/" element={<Pipeline />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectProfile />} />
          <Route path="/investors" element={<Investors />} />
          <Route path="/investor-contacts" element={<InvestorContactsPage />} />
          <Route path="/outreach" element={<OutreachPage />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/data-rooms" element={<DataRooms />} />
          <Route path="/deal-desk" element={<DealDesk />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/admin/roles" element={<AdminRolesPage />} />
          <Route path="/workflow" element={<WorkflowTasksPage />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
