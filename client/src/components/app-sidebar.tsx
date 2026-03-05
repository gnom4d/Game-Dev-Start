import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, FolderKanban, Activity, ShieldCheck, Rocket,
  LayoutTemplate, BoxSelect, Flame, CalendarClock, Users, ShieldAlert
} from "lucide-react";
import { usePhases } from "@/hooks/use-phases";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

const getPhaseIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("concept")) return LightbulbIcon;
  if (lower.includes("pre-prod")) return LayoutTemplate;
  if (lower.includes("prod")) return BoxSelect;
  if (lower.includes("alpha") || lower.includes("beta")) return ShieldCheck;
  if (lower.includes("launch")) return Rocket;
  return FolderKanban;
};

const LightbulbIcon = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
);

const APM_TOOLS = [
  { href: "/blockers",         label: "Blocker Heatmap",   icon: Flame },
  { href: "/milestones",       label: "Milestone Buffers", icon: CalendarClock },
  { href: "/department-pulse", label: "Department Pulse",  icon: Users },
  { href: "/risks",            label: "Risk Register",     icon: ShieldAlert },
  { href: "/liveops",          label: "LiveOps",           icon: Rocket },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { data: phases, isLoading } = usePhases();

  return (
    <Sidebar className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className="p-4 pt-6 border-b border-sidebar-border/50">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg shadow-primary/20">
            <Activity className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-lg tracking-wide text-foreground">Pipeline<span className="text-primary">Pro</span></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">APM Dashboard</span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="pt-4">
        {/* Overview */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive={location === "/"} asChild className="hover-elevate">
                  <Link href="/">
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="font-medium">Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Game Pipeline */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Game Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i} className="mb-2">
                    <Skeleton className="h-8 w-full bg-sidebar-accent/50 rounded-lg" />
                  </SidebarMenuItem>
                ))
              ) : phases?.sort((a, b) => a.order - b.order).map((phase) => {
                const PhaseIcon = getPhaseIcon(phase.name);
                const phasePath = `/phases/${phase.id}`;
                return (
                  <SidebarMenuItem key={phase.id}>
                    <SidebarMenuButton isActive={location === phasePath} asChild className="hover-elevate">
                      <Link href={phasePath}>
                        <PhaseIcon className="w-4 h-4" />
                        <span className="font-medium">{phase.name}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* APM Tools */}
        <SidebarGroup className="mt-4">
          <SidebarGroupLabel className="text-xs uppercase tracking-wider text-muted-foreground mb-2">APM Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {APM_TOOLS.map(({ href, label, icon: Icon }) => (
                <SidebarMenuItem key={href}>
                  <SidebarMenuButton isActive={location === href} asChild className="hover-elevate">
                    <Link href={href}>
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{label}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
