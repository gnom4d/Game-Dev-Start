import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePhases } from "@/hooks/use-phases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Plus, X, CheckCircle, FlameKindling, Flame } from "lucide-react";
import type { Blocker } from "@shared/schema";

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; heat: number }> = {
  low:      { label: "Low",      color: "text-chart-3",      bg: "bg-chart-3/15",      heat: 1 },
  medium:   { label: "Medium",   color: "text-chart-4",      bg: "bg-chart-4/15",      heat: 2 },
  high:     { label: "High",     color: "text-chart-5",      bg: "bg-chart-5/15",      heat: 3 },
  critical: { label: "Critical", color: "text-destructive",  bg: "bg-destructive/15",  heat: 4 },
};

function heatColor(count: number, maxCount: number): string {
  if (count === 0) return "bg-muted/30";
  const ratio = count / Math.max(maxCount, 1);
  if (ratio < 0.25) return "bg-chart-3/40";
  if (ratio < 0.5) return "bg-chart-4/50";
  if (ratio < 0.75) return "bg-chart-5/60";
  return "bg-destructive/70";
}

export default function BlockersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phases } = usePhases();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ phaseId: "", author: "", source: "", severity: "medium" });

  const { data: blockerList, isLoading } = useQuery<Blocker[]>({
    queryKey: ['/api/blockers'],
    queryFn: async () => {
      const res = await fetch('/api/blockers', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch blockers');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/blockers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, phaseId: Number(data.phaseId) }),
      });
      if (!res.ok) throw new Error('Failed to create blocker');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/blockers'] });
      setForm({ phaseId: "", author: "", source: "", severity: "medium" });
      setShowForm(false);
      toast({ title: "Blocker logged", description: "The blocker has been added to the heatmap." });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/blockers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resolvedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error('Failed to resolve blocker');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/blockers'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/blockers/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/blockers'] }),
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

  const activeBlockers = blockerList?.filter(b => !b.resolvedAt) || [];
  const resolvedBlockers = blockerList?.filter(b => b.resolvedAt) || [];

  // Build heatmap: phases × severity
  const phaseList = phases?.sort((a, b) => a.order - b.order) || [];
  const severities = ["low", "medium", "high", "critical"];

  const heatmapData = phaseList.map(phase => {
    const phaseBlockers = activeBlockers.filter(b => b.phaseId === phase.id);
    const bySeverity = severities.reduce<Record<string, number>>((acc, sev) => {
      acc[sev] = phaseBlockers.filter(b => b.severity === sev).length;
      return acc;
    }, {});
    return { phase, bySeverity, total: phaseBlockers.length };
  });

  const maxCount = Math.max(...heatmapData.flatMap(d => Object.values(d.bySeverity)), 1);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-bold uppercase tracking-widest mb-3">
            <Flame className="w-3 h-3" /> Risk Tracker
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Blocker Heatmap</h1>
          <p className="text-muted-foreground mt-1">Track bottlenecks by phase, author, and severity</p>
        </div>
        <Button data-testid="button-add-blocker" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Log Blocker
        </Button>
      </div>

      {/* Add Blocker Form */}
      {showForm && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <AlertTriangle className="w-4 h-4 text-destructive" /> New Blocker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="blocker-phase">Phase</Label>
                <Select value={form.phaseId} onValueChange={v => setForm(f => ({ ...f, phaseId: v }))}>
                  <SelectTrigger data-testid="select-blocker-phase" id="blocker-phase">
                    <SelectValue placeholder="Select a phase" />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseList.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blocker-severity">Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger data-testid="select-blocker-severity" id="blocker-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {severities.map(s => (
                      <SelectItem key={s} value={s}>{SEVERITY_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="blocker-author">Author / Reporter</Label>
                <Input
                  id="blocker-author"
                  data-testid="input-blocker-author"
                  placeholder="Who is reporting this?"
                  value={form.author}
                  onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                />
              </div>
              <div className="space-y-2 md:col-span-1">
                <Label htmlFor="blocker-source">Source / Description</Label>
                <Textarea
                  id="blocker-source"
                  data-testid="input-blocker-source"
                  placeholder="Describe the source of the hold-up..."
                  value={form.source}
                  onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-blocker"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.phaseId || !form.author || !form.source || createMutation.isPending}
              >
                {createMutation.isPending ? "Logging..." : "Log Blocker"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Heatmap Grid */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <FlameKindling className="w-5 h-5 text-chart-5" /> Severity × Phase Heatmap
          </CardTitle>
          <CardDescription>Intensity shows the number of active blockers per cell</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-3 pr-4 w-40">Phase</th>
                  {severities.map(sev => (
                    <th key={sev} className="text-center text-xs uppercase tracking-wider pb-3 px-2">
                      <span className={`${SEVERITY_CONFIG[sev].color} font-bold`}>{SEVERITY_CONFIG[sev].label}</span>
                    </th>
                  ))}
                  <th className="text-center text-xs uppercase tracking-wider text-muted-foreground pb-3 px-2">Total</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {heatmapData.map(({ phase, bySeverity, total }) => (
                  <tr key={phase.id} className="group">
                    <td className="py-2 pr-4">
                      <span className="text-sm font-medium text-foreground">{phase.name}</span>
                    </td>
                    {severities.map(sev => {
                      const count = bySeverity[sev];
                      return (
                        <td key={sev} className="py-2 px-2 text-center">
                          <div
                            data-testid={`heatmap-cell-${phase.id}-${sev}`}
                            className={`inline-flex items-center justify-center w-12 h-12 rounded-lg text-sm font-bold transition-all duration-200 ${count > 0 ? heatColor(count, maxCount) + ' text-foreground' : 'bg-muted/20 text-muted-foreground/40'}`}
                          >
                            {count > 0 ? count : "·"}
                          </div>
                        </td>
                      );
                    })}
                    <td className="py-2 px-2 text-center">
                      <Badge variant={total > 0 ? "destructive" : "secondary"} className="text-xs">
                        {total}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/50">
            <span className="text-xs text-muted-foreground font-medium">Heat scale:</span>
            {["bg-chart-3/40", "bg-chart-4/50", "bg-chart-5/60", "bg-destructive/70"].map((cls, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`w-5 h-5 rounded ${cls}`} />
                <span className="text-xs text-muted-foreground">{["Low", "Med", "High", "Critical"][i]}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active Blockers List */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-chart-4" />
            Active Blockers
            <Badge variant="destructive" className="ml-1">{activeBlockers.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeBlockers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active blockers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBlockers.map(blocker => {
                const cfg = SEVERITY_CONFIG[blocker.severity] || SEVERITY_CONFIG.medium;
                const phase = phaseList.find(p => p.id === blocker.phaseId);
                return (
                  <div
                    key={blocker.id}
                    data-testid={`blocker-card-${blocker.id}`}
                    className="flex items-start gap-4 p-4 rounded-xl border border-border/50 bg-card/40 hover:bg-card/70 transition-colors"
                  >
                    <div className={`mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${cfg.bg} ${cfg.color} shrink-0`}>
                      {cfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-foreground text-sm">{blocker.author}</span>
                        <span className="text-muted-foreground text-xs">·</span>
                        <span className="text-muted-foreground text-xs">{phase?.name || "Unknown Phase"}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{blocker.source}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-resolve-blocker-${blocker.id}`}
                        onClick={() => resolveMutation.mutate(blocker.id)}
                        className="text-chart-3 hover:text-chart-3 hover:bg-chart-3/10 h-8 px-2"
                        title="Mark resolved"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        data-testid={`button-delete-blocker-${blocker.id}`}
                        onClick={() => deleteMutation.mutate(blocker.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolved */}
      {resolvedBlockers.length > 0 && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20 opacity-60">
          <CardHeader>
            <CardTitle className="font-display text-muted-foreground flex items-center gap-2 text-base">
              <CheckCircle className="w-4 h-4" /> Resolved ({resolvedBlockers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolvedBlockers.map(blocker => {
                const phase = phaseList.find(p => p.id === blocker.phaseId);
                return (
                  <div key={blocker.id} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/20 line-through decoration-muted-foreground/30">
                    <CheckCircle className="w-4 h-4 text-chart-3 shrink-0" />
                    <span className="text-sm text-muted-foreground">{blocker.author} · {phase?.name}</span>
                    <span className="text-sm text-muted-foreground flex-1 truncate">{blocker.source}</span>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(blocker.id)} className="h-7 w-7 p-0 text-muted-foreground/50">
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
