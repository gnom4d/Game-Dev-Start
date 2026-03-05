import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import Dashboard from "@/pages/dashboard";
import PhaseDetail from "@/pages/phase-detail";
import BlockersPage from "@/pages/blockers";
import MilestonesPage from "@/pages/milestones";
import DepartmentPulsePage from "@/pages/department-pulse";
import RisksPage from "@/pages/risks";
import LiveOpsPage from "@/pages/liveops";
import TimelinePage from "@/pages/timeline";
import NotFound from "@/pages/not-found";
import { Menu } from "lucide-react";
import React from "react";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard}/>
      <Route path="/phases/:id" component={PhaseDetail}/>
      <Route path="/blockers" component={BlockersPage}/>
      <Route path="/milestones" component={MilestonesPage}/>
      <Route path="/department-pulse" component={DepartmentPulsePage}/>
      <Route path="/risks" component={RisksPage}/>
      <Route path="/liveops" component={LiveOpsPage}/>
      <Route path="/timeline" component={TimelinePage}/>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={style as React.CSSProperties}>
          <div className="flex h-screen w-full bg-background overflow-hidden selection:bg-primary/30 selection:text-primary-foreground text-foreground">
            <AppSidebar />
            <div className="flex flex-col flex-1 relative overflow-hidden h-full">
              <header className="flex h-14 lg:h-0 items-center justify-between px-4 lg:px-0 lg:absolute lg:top-4 lg:left-4 z-50 border-b border-border/50 lg:border-none bg-background/80 backdrop-blur-md lg:bg-transparent">
                <div className="flex items-center gap-2">
                  <SidebarTrigger data-testid="button-sidebar-toggle" className="hover-elevate bg-card border border-border shadow-sm text-foreground">
                    <Menu className="h-5 w-5" />
                  </SidebarTrigger>
                  <span className="lg:hidden font-display font-bold tracking-wide">Pipeline<span className="text-primary">Pro</span></span>
                </div>
              </header>
              <main className="flex-1 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
                  <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px]" />
                  <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-accent/5 blur-[120px]" />
                </div>
                <div className="h-full w-full relative z-10">
                  <Router />
                </div>
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
