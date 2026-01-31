import React, { useEffect, useState } from "react";
import { HashRouter as Router, Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { ROUTE_PATHS } from "@/lib/index";
import { Navigation } from "@/components/Navigation";
import Home from "@/pages/Home";
import Search from "@/pages/Search";
import Orders from "@/pages/Orders";
import Profile from "@/pages/Profile";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

/**
 * AppContent component handles the layout and route-based navigation state.
 * This allows useLocation and useNavigate to be used within the Router context.
 */
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(location.pathname);

  // Synchronize active navigation tab with the current route
  useEffect(() => {
    // Ensure the active tab reflects the current path, defaulting to HOME if needed
    const currentPath = location.pathname === "/" ? ROUTE_PATHS.HOME : location.pathname;
    setActiveTab(currentPath);
  }, [location.pathname]);

  /**
   * Handles tab switching from the bottom navigation bar.
   * @param tab The target route path
   */
  const handleTabChange = (tab: string) => {
    navigate(tab);
  };

  return (
    <div className="relative flex flex-col h-screen w-full max-w-md mx-auto bg-background shadow-2xl overflow-hidden border-x border-border/5 select-none">
      {/* Main Content Area: TikTok-style immersive scroll area */}
      <main className="relative flex-1 w-full overflow-hidden">
        <Routes>
          <Route path={ROUTE_PATHS.HOME} element={<Home />} />
          <Route path={ROUTE_PATHS.SEARCH} element={<Search />} />
          <Route path={ROUTE_PATHS.ORDERS} element={<Orders />} />
          <Route path={ROUTE_PATHS.PROFILE} element={<Profile />} />
          {/* Fallback to Home for unknown routes */}
          <Route path="*" element={<Home />} />
        </Routes>
      </main>

      {/* Persistent Bottom Navigation */}
      <Navigation activeTab={activeTab} onTabChange={handleTabChange} />

      {/* Immersive rim-light for mobile-feel */}
      <div className="pointer-events-none absolute inset-0 border border-white/5 rounded-[inherit] z-50" />
    </div>
  );
};

/**
 * Root Application component providing global contexts and router setup.
 * OrderUZ: A video-first food ordering experience.
 * © 2026 OrderUZ Technology
 */
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={0}>
        <Toaster />
        <Sonner position="top-center" expand={false} richColors />
        <Router>
          <AppContent />
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
