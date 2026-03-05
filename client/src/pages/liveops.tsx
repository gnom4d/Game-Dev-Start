import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Rocket, Plus, X, MessageSquare, Server, Zap, Heart, ThumbsUp, ThumbsDown, AlertTriangle } from "lucide-react";
import type { LiveopsLog } from "@shared/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string }> = {
  feedback:  { label: "Player Feedback", icon: MessageSquare, color: "text-primary" },
  stability: { label: "Server Stability", icon: Server, color: "text-accent" },
};

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  info:     { label: "Info",     color: "text-primary",     bg: "bg-primary/10" },
  positive: { label: "Positive", color: "text-chart-3",     bg: "bg-chart-3/10" },
  warning:  { label: "Warning",  color: "text-chart-4",     bg: "bg-chart-4/10" },
  critical: { label: "Critical", color: "text-destructive", bg: "bg-destructive/10" },
};

const SOURCE_OPTIONS: Record<string, string[]> = {
  feedback:  ["Player Review", "Community Forum", "Support Ticket", "Discord", "Social Media", "Survey"],
  stability: ["Server Monitor", "On-Call Engineer", "Automated Alert", "Player Report", "CDN Provider"],
};

function HealthBar({ logs }: { logs: LiveopsLog[] }) {
  const recent = logs.slice(0, 20);
  const critCount = recent.filter(l => l.severity === "critical").length;
  const warnCount = recent.filter(l => l.severity === "warning").length;
  const posCount = recent.filter(l => l.severity === "positive").length;

  const total = recent.length || 1;
  const healthScore = Math.max(0, Math.min(100,
    Math.round(100 - (critCount / total) * 60 - (warnCount / total) * 25 + (posCount / total) * 15)
  ));

  const getHealthLabel = (score: number) => {
    if (score >= 85) return { label: "Healthy", color: "text-chart-3", barColor: "from-chart-3 to-chart-3" };
    if (score >= 65) return { label: "Stable", color: "text-chart-4", barColor: "from-chart-4 to-chart-4" };
    if (score >= 40) return { label: "Degraded", color: "text-chart-5", barColor: "from-chart-5 to-chart-5" };
    return { label: "Critical", color: "text-destructive", barColor: "from-destructive to-destructive" };
  };

  const { label, color, barColor } = getHealthLabel(healthScore);

  return (
    <Card className="glass-panel border-border/50 shadow-xl shadow-black/20 relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-48 h-48 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display">
          <Heart className="w-5 h-5 text-chart-5" /> Post-Launch Health
        </CardTitle>
        <CardDescription>Based on last {recent.length} log entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-6 mb-6">
          <div>
            <div className={`text-6xl font-display font-bold ${color}`}>{healthScore}</div>
            <div className="text-sm text-muted-foreground">out of 100</div>
          </div>
          <div className={`text-2xl font-display font-bold ${color} mb-1`}>{label}</div>
        </div>

        {/* Health bar */}
        <div className="w-full bg-muted/40 rounded-full h-4 overflow-hidden mb-6">
          <div
            className={`h-4 rounded-full bg-gradient-to-r ${barColor} transition-all duration-700`}
            style={{ width: `${healthScore}%` }}
          />
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Critical Issues", count: critCount, color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle },
            { label: "Warnings", count: warnCount, color: "text-chart-4", bg: "bg-chart-4/10", icon: AlertTriangle },
            { label: "Positive", count: posCount, color: "text-chart-3", bg: "bg-chart-3/10", icon: ThumbsUp },
            { label: "Informational", count: recent.filter(l => l.severity === "info").length, color: "text-primary", bg: "bg-primary/10", icon: Zap },
          ].map(({ label, count, color, bg, icon: Icon }) => (
            <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
              <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
              <div className={`text-xl font-display font-bold ${color}`}>{count}</div>
              <div className="text-xs text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function LiveOpsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({ type: "feedback", source: "", content: "", severity: "info" });

  const { data: logs, isLoading } = useQuery<LiveopsLog[]>({
    queryKey: ['/api/liveops-logs'],
    queryFn: async () => {
      const res = await fetch('/api/liveops-logs', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch liveops logs');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/liveops-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create liveops log');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/liveops-logs'] });
      setForm({ type: "feedback", source: "", content: "", severity: "info" });
      setShowForm(false);
      toast({ title: "Log entry added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/liveops-logs/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/liveops-logs'] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[300px] w-full rounded-2xl" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const allLogs = logs || [];
  const filteredLogs = filterType === "all" ? allLogs : allLogs.filter(l => l.type === filterType);
  const sourceOptions = SOURCE_OPTIONS[form.type] || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-3/10 text-chart-3 text-xs font-bold uppercase tracking-widest mb-3">
            <Rocket className="w-3 h-3" /> LiveOps
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Post-Launch Operations</h1>
          <p className="text-muted-foreground mt-1">Health tracking, player feedback, and server stability reporting</p>
        </div>
        <Button data-testid="button-add-liveops-log" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Entry
        </Button>
      </div>

      {/* Health Bar */}
      <HealthBar logs={allLogs} />

      {/* Add Log Form */}
      {showForm && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Zap className="w-4 h-4 text-primary" /> New Log Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v, source: "" }))}>
                  <SelectTrigger data-testid="select-log-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feedback">Player Feedback</SelectItem>
                    <SelectItem value="stability">Server Stability</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger data-testid="select-log-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="info">Informational</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Source</Label>
                <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
                  <SelectTrigger data-testid="select-log-source">
                    <SelectValue placeholder="Select source..." />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Content</Label>
                <Textarea
                  data-testid="input-log-content"
                  placeholder={form.type === "feedback" ? "What are players saying?" : "Describe the stability event..."}
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-liveops-log"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.source || !form.content || createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Log Entry"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters & Log */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" /> Activity Log
              <Badge variant="secondary" className="ml-1">{filteredLogs.length}</Badge>
            </CardTitle>
            <CardDescription>Player feedback and server reports</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {["all", "feedback", "stability"].map(f => (
              <Button
                key={f}
                size="sm"
                variant={filterType === f ? "default" : "ghost"}
                data-testid={`filter-liveops-${f}`}
                onClick={() => setFilterType(f)}
                className="capitalize h-8"
              >
                {f === "all" ? "All" : f === "feedback" ? "Feedback" : "Stability"}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Rocket className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No log entries yet</p>
              <p className="text-sm">Start logging player feedback and server stability reports</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredLogs.map(log => {
                const typeCfg = TYPE_CONFIG[log.type] || TYPE_CONFIG.feedback;
                const sevCfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                const TypeIcon = typeCfg.icon;

                return (
                  <div
                    key={log.id}
                    data-testid={`liveops-log-${log.id}`}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-colors"
                  >
                    <div className={`mt-0.5 p-2 rounded-lg ${sevCfg.bg} shrink-0`}>
                      <TypeIcon className={`w-4 h-4 ${typeCfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${sevCfg.bg} ${sevCfg.color}`}>
                          {sevCfg.label}
                        </span>
                        <span className="text-xs text-muted-foreground">{typeCfg.label}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{log.source}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed">{log.content}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`button-delete-log-${log.id}`}
                      onClick={() => deleteMutation.mutate(log.id)}
                      className="h-8 w-8 p-0 text-muted-foreground/50 hover:text-destructive shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
