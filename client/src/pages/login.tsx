import { Activity, Lock, Layers, BarChart3, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full bg-background flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[40%] h-[60%] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center gap-10 px-6 max-w-md w-full text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-2xl shadow-primary/30">
            <Activity className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-4xl tracking-wide text-foreground">
              Pipeline<span className="text-primary">Pro</span>
            </h1>
            <p className="text-sm uppercase font-bold tracking-widest text-muted-foreground mt-1">
              APM Dashboard
            </p>
          </div>
        </div>

        <div className="glass-panel w-full p-8 flex flex-col items-center gap-6 rounded-2xl border border-border/60">
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-1">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <h2 className="font-display font-semibold text-xl text-foreground">Welcome back</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Sign in to access your game production dashboard, track milestones, manage blockers, and monitor team health.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 w-full">
            {[
              { icon: Layers, label: "Pipeline Phases" },
              { icon: BarChart3, label: "Team Pulse" },
              { icon: AlertTriangle, label: "Risk Register" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-card/50 border border-border/40">
                <Icon className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-medium text-muted-foreground leading-tight">{label}</span>
              </div>
            ))}
          </div>

          <Button
            data-testid="button-sign-in"
            onClick={handleLogin}
            className="w-full h-12 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
          >
            Sign in with Replit
          </Button>

          <p className="text-xs text-muted-foreground">
            Supports Google, GitHub, Apple, and email login
          </p>
        </div>
      </div>
    </div>
  );
}
