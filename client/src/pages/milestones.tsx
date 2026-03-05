import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePhases } from "@/hooks/use-phases";
import { useTasks } from "@/hooks/use-tasks";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, Plus, X, AlertTriangle, CheckCircle, TrendingDown } from "lucide-react";
import type { MilestoneBuffer } from "@shared/schema";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  "on-track":  { label: "On Track",  color: "text-chart-3",     bg: "bg-chart-3/15",     icon: CheckCircle },
  "at-risk":   { label: "At Risk",   color: "text-chart-4",     bg: "bg-chart-4/15",     icon: AlertTriangle },
  "slipping":  { label: "Slipping",  color: "text-destructive", bg: "bg-destructive/15", icon: TrendingDown },
};

export default function MilestonesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phases } = usePhases();
  const { data: tasks } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    taskId: "",
    productionPhaseId: "",
    slippingFromPhaseId: "",
    bufferDays: "0",
    status: "on-track",
    notes: "",
  });

  const { data: buffers, isLoading } = useQuery<MilestoneBuffer[]>({
    queryKey: ['/api/milestone-buffers'],
    queryFn: async () => {
      const res = await fetch('/api/milestone-buffers', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch milestone buffers');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/milestone-buffers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          taskId: Number(data.taskId),
          productionPhaseId: Number(data.productionPhaseId),
          slippingFromPhaseId: Number(data.slippingFromPhaseId),
          bufferDays: Number(data.bufferDays),
          status: data.status,
          notes: data.notes,
        }),
      });
      if (!res.ok) throw new Error('Failed to create milestone buffer');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/milestone-buffers'] });
      setForm({ taskId: "", productionPhaseId: "", slippingFromPhaseId: "", bufferDays: "0", status: "on-track", notes: "" });
      setShowForm(false);
      toast({ title: "Milestone buffer added" });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/milestone-buffers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update milestone buffer');
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/milestone-buffers'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/milestone-buffers/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/milestone-buffers'] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  const phaseList = phases?.sort((a, b) => a.order - b.order) || [];
  const taskList = tasks || [];

  const slippingCount = buffers?.filter(b => b.status === "slipping").length || 0;
  const atRiskCount = buffers?.filter(b => b.status === "at-risk").length || 0;
  const onTrackCount = buffers?.filter(b => b.status === "on-track").length || 0;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-4/10 text-chart-4 text-xs font-bold uppercase tracking-widest mb-3">
            <CalendarClock className="w-3 h-3" /> Schedule Tracking
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Milestone Buffer Tracker</h1>
          <p className="text-muted-foreground mt-1">Monitor Production tasks slipping during Alpha phase</p>
        </div>
        <Button data-testid="button-add-milestone" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Buffer Entry
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "On Track", count: onTrackCount, color: "text-chart-3", bg: "bg-chart-3/10" },
          { label: "At Risk", count: atRiskCount, color: "text-chart-4", bg: "bg-chart-4/10" },
          { label: "Slipping", count: slippingCount, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(({ label, count, color, bg }) => (
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
              <CalendarClock className="w-4 h-4 text-chart-4" /> New Milestone Buffer
            </CardTitle>
            <CardDescription>Track a Production task that is slipping when observed during Alpha</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Task (Production)</Label>
                <Select value={form.taskId} onValueChange={v => setForm(f => ({ ...f, taskId: v }))}>
                  <SelectTrigger data-testid="select-milestone-task">
                    <SelectValue placeholder="Select task..." />
                  </SelectTrigger>
                  <SelectContent>
                    {taskList.map(t => (
                      <SelectItem key={t.id} value={String(t.id)}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger data-testid="select-milestone-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="on-track">On Track</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="slipping">Slipping</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Production Phase</Label>
                <Select value={form.productionPhaseId} onValueChange={v => setForm(f => ({ ...f, productionPhaseId: v }))}>
                  <SelectTrigger data-testid="select-production-phase">
                    <SelectValue placeholder="Select production phase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseList.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Observed During Phase (e.g. Alpha)</Label>
                <Select value={form.slippingFromPhaseId} onValueChange={v => setForm(f => ({ ...f, slippingFromPhaseId: v }))}>
                  <SelectTrigger data-testid="select-slipping-phase">
                    <SelectValue placeholder="Select observing phase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseList.map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Buffer Days (over schedule)</Label>
                <Input
                  type="number"
                  min="0"
                  data-testid="input-buffer-days"
                  value={form.bufferDays}
                  onChange={e => setForm(f => ({ ...f, bufferDays: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  data-testid="input-milestone-notes"
                  placeholder="What caused the slip?"
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-milestone"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.taskId || !form.productionPhaseId || !form.slippingFromPhaseId || createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add Buffer Entry"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Buffers List */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-chart-4" /> Tracked Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!buffers || buffers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No milestone buffers tracked yet</p>
              <p className="text-sm">Add entries to monitor schedule slippage</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buffers.map(buffer => {
                const task = taskList.find(t => t.id === buffer.taskId);
                const prodPhase = phaseList.find(p => p.id === buffer.productionPhaseId);
                const slipPhase = phaseList.find(p => p.id === buffer.slippingFromPhaseId);
                const cfg = STATUS_CONFIG[buffer.status] || STATUS_CONFIG["on-track"];
                const StatusIcon = cfg.icon;

                return (
                  <div
                    key={buffer.id}
                    data-testid={`milestone-card-${buffer.id}`}
                    className="p-5 rounded-xl border border-border/50 bg-card/40 hover:bg-card/60 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${cfg.bg} ${cfg.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                          <span className="text-sm font-bold text-foreground truncate">{task?.title || `Task #${buffer.taskId}`}</span>
                        </div>
                        <div className="text-xs text-muted-foreground space-x-3 mb-2">
                          <span>Production: <span className="text-foreground font-medium">{prodPhase?.name}</span></span>
                          <span>·</span>
                          <span>Observed in: <span className="text-foreground font-medium">{slipPhase?.name}</span></span>
                          <span>·</span>
                          <span className={buffer.bufferDays > 0 ? "text-chart-4 font-medium" : "text-muted-foreground"}>
                            {buffer.bufferDays} days over schedule
                          </span>
                        </div>
                        {/* Buffer bar */}
                        <div className="w-full bg-muted/40 rounded-full h-2 mb-3 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              buffer.status === "slipping" ? "bg-destructive" :
                              buffer.status === "at-risk" ? "bg-chart-4" : "bg-chart-3"
                            }`}
                            style={{ width: `${Math.min(100, (buffer.bufferDays / 30) * 100)}%` }}
                          />
                        </div>
                        {buffer.notes && <p className="text-sm text-muted-foreground">{buffer.notes}</p>}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Select
                          value={buffer.status}
                          onValueChange={v => updateStatusMutation.mutate({ id: buffer.id, status: v })}
                        >
                          <SelectTrigger data-testid={`select-status-${buffer.id}`} className="h-8 text-xs w-28">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="on-track">On Track</SelectItem>
                            <SelectItem value="at-risk">At Risk</SelectItem>
                            <SelectItem value="slipping">Slipping</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          data-testid={`button-delete-milestone-${buffer.id}`}
                          onClick={() => deleteMutation.mutate(buffer.id)}
                          className="h-8 text-muted-foreground hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
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
