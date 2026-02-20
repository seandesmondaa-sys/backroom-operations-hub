import { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Pipeline from "./pages/Pipeline";
import Clients from "./pages/Clients";
import Projects from "./pages/Projects";
import ProjectProfile from "./pages/ProjectProfile";
import Investors from "./pages/Investors";
import Tasks from "./pages/Tasks";
import DataRooms from "./pages/DataRooms";
import DealDesk from "./pages/DealDesk";
import Portfolio from "./pages/Portfolio";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  if (!isLoggedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Login onLogin={() => setIsLoggedIn(true)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout onLogout={() => setIsLoggedIn(false)} />}>
              <Route path="/" element={<Pipeline />} />
              <Route path="/clients" element={<Clients />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:id" element={<ProjectProfile />} />
              <Route path="/investors" element={<Investors />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/data-rooms" element={<DataRooms />} />
              <Route path="/deal-desk" element={<DealDesk />} />
              <Route path="/portfolio" element={<Portfolio />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
