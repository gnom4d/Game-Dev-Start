import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePhases } from "@/hooks/use-phases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ShieldAlert, Plus, X, ExternalLink, CheckCircle, AlertTriangle, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import type { Risk } from "@shared/schema";

const SEVERITY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  low:      { label: "Low",      color: "text-chart-3",      bg: "bg-chart-3/10",      border: "border-chart-3/30" },
  medium:   { label: "Medium",   color: "text-chart-4",      bg: "bg-chart-4/10",      border: "border-chart-4/30" },
  high:     { label: "High",     color: "text-chart-5",      bg: "bg-chart-5/10",      border: "border-chart-5/30" },
  critical: { label: "Critical", color: "text-destructive",  bg: "bg-destructive/10",  border: "border-destructive/30" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  open:      { label: "Open",      color: "text-chart-5" },
  mitigated: { label: "Mitigated", color: "text-chart-4" },
  closed:    { label: "Closed",    color: "text-chart-3" },
};

export default function RisksPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phases } = usePhases();
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    linkedPhaseId: "",
    severity: "medium",
    status: "open",
    notes: "",
  });

  const { data: risks, isLoading } = useQuery<Risk[]>({
    queryKey: ['/api/risks'],
    queryFn: async () => {
      const res = await fetch('/api/risks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch risks');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/risks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          linkedPhaseId: (data.linkedPhaseId && data.linkedPhaseId !== "none") ? Number(data.linkedPhaseId) : null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create risk');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/risks'] });
      setForm({ title: "", description: "", linkedPhaseId: "", severity: "medium", status: "open", notes: "" });
      setShowForm(false);
      toast({ title: "Risk logged", description: "The risk has been added to the register." });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Risk> }) => {
      const res = await fetch(`/api/risks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error('Failed to update risk');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/risks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/risks/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/risks'] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  const phaseList = phases?.sort((a, b) => a.order - b.order) || [];
  const allRisks = risks || [];
  const filteredRisks = filterStatus === "all" ? allRisks : allRisks.filter(r => r.status === filterStatus);

  const openCount = allRisks.filter(r => r.status === "open").length;
  const mitigatedCount = allRisks.filter(r => r.status === "mitigated").length;
  const closedCount = allRisks.filter(r => r.status === "closed").length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold uppercase tracking-widest mb-3">
            <ShieldAlert className="w-3 h-3" /> Risk Management
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Risk Register</h1>
          <p className="text-muted-foreground mt-1">Log risks, take notes, and link them back to pipeline phases</p>
        </div>
        <Button data-testid="button-add-risk" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Risk
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Open", count: openCount, color: "text-chart-5" },
          { label: "Mitigated", count: mitigatedCount, color: "text-chart-4" },
          { label: "Closed", count: closedCount, color: "text-chart-3" },
        ].map(({ label, count, color }) => (
          <Card key={label} className="glass-panel border-border/50 shadow-xl shadow-black/20">
            <CardContent className="pt-6">
              <div className={`text-3xl font-display font-bold ${color}`}>{count}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <ShieldAlert className="w-4 h-4 text-accent" /> New Risk
            </CardTitle>
            <CardDescription>Example: "Voice Actor's availability has changed." — link to Pre-Production</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Risk Title</Label>
                <Input
                  data-testid="input-risk-title"
                  placeholder="e.g. Voice Actor's availability has changed"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={v => setForm(f => ({ ...f, severity: v }))}>
                  <SelectTrigger data-testid="select-risk-severity">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-risk-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="mitigated">Mitigated</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Pipeline Phase</Label>
                <Select value={form.linkedPhaseId} onValueChange={v => setForm(f => ({ ...f, linkedPhaseId: v }))}>
                  <SelectTrigger data-testid="select-risk-phase">
                    <SelectValue placeholder="Link to a phase (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {phaseList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  data-testid="input-risk-description"
                  placeholder="Describe the risk in detail..."
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Mitigation Notes</Label>
                <Textarea
                  data-testid="input-risk-notes"
                  placeholder="What actions are being taken?"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-risk"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.title || !form.description || createMutation.isPending}
              >
                {createMutation.isPending ? "Logging..." : "Log Risk"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground font-medium">Filter:</span>
        {["all", "open", "mitigated", "closed"].map(f => (
          <Button
            key={f}
            size="sm"
            variant={filterStatus === f ? "default" : "ghost"}
            data-testid={`filter-risk-${f}`}
            onClick={() => setFilterStatus(f)}
            className="capitalize h-8"
          >
            {f === "all" ? "All" : f}
          </Button>
        ))}
      </div>

      {/* Risk Cards */}
      <div className="space-y-4">
        {filteredRisks.length === 0 ? (
          <div className="text-center py-16 bg-card/30 border border-dashed border-border/50 rounded-2xl">
            <ShieldAlert className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="text-lg font-semibold text-foreground">No risks logged</h3>
            <p className="text-muted-foreground">Add a risk to start tracking</p>
          </div>
        ) : (
          filteredRisks.map(risk => {
            const sevCfg = SEVERITY_CONFIG[risk.severity] || SEVERITY_CONFIG.medium;
            const statusCfg = STATUS_CONFIG[risk.status] || STATUS_CONFIG.open;
            const linkedPhase = phaseList.find(p => p.id === risk.linkedPhaseId);

            return (
              <Card
                key={risk.id}
                data-testid={`risk-card-${risk.id}`}
                className={`glass-panel border shadow-xl shadow-black/20 ${sevCfg.border}`}
              >
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 px-2.5 py-1 rounded-md text-xs font-bold ${sevCfg.bg} ${sevCfg.color} shrink-0`}>
                      {sevCfg.label}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <h3 className="font-display font-semibold text-foreground text-base leading-snug">{risk.title}</h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <Select
                            value={risk.status}
                            onValueChange={v => updateMutation.mutate({ id: risk.id, updates: { status: v } })}
                          >
                            <SelectTrigger data-testid={`select-risk-status-${risk.id}`} className="h-7 text-xs w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="open">Open</SelectItem>
                              <SelectItem value="mitigated">Mitigated</SelectItem>
                              <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-delete-risk-${risk.id}`}
                            onClick={() => deleteMutation.mutate(risk.id)}
                            className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive"
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{risk.description}</p>

                      {risk.notes && (
                        <div className="bg-muted/20 border border-border/40 rounded-lg px-3 py-2 mb-3">
                          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Mitigation Notes</p>
                          <p className="text-sm text-foreground/80">{risk.notes}</p>
                        </div>
                      )}

                      {linkedPhase && (
                        <Link href={`/phases/${linkedPhase.id}`}>
                          <div
                            data-testid={`link-risk-phase-${risk.id}`}
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full cursor-pointer transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            View in Pipeline: {linkedPhase.name}
                            <ArrowRight className="w-3 h-3" />
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
