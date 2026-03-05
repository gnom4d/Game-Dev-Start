import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePhases } from "@/hooks/use-phases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity, Plus, X, Users } from "lucide-react";
import type { DepartmentPulse } from "@shared/schema";

const DEPARTMENTS = ["Art", "Engineering", "Marketing", "QA", "Audio", "Design", "Production", "Narrative"];

const DEPT_COLORS: Record<string, string> = {
  Art:         "hsl(var(--chart-1))",
  Engineering: "hsl(var(--chart-2))",
  Marketing:   "hsl(var(--chart-3))",
  QA:          "hsl(var(--chart-4))",
  Audio:       "hsl(var(--chart-5))",
  Design:      "hsl(217 91% 75%)",
  Production:  "hsl(280 85% 75%)",
  Narrative:   "hsl(160 84% 55%)",
};

function getCurrentWeek(): string {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1);
  const week = Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

export default function DepartmentPulsePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phases } = usePhases();
  const [showForm, setShowForm] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>("all");
  const [form, setForm] = useState({ department: "", phaseId: "", score: "7", weekOf: getCurrentWeek(), notes: "" });

  const { data: pulseData, isLoading } = useQuery<DepartmentPulse[]>({
    queryKey: ['/api/department-pulse'],
    queryFn: async () => {
      const res = await fetch('/api/department-pulse', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch department pulse');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/department-pulse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ...data, phaseId: Number(data.phaseId), score: Number(data.score) }),
      });
      if (!res.ok) throw new Error('Failed to create pulse entry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/department-pulse'] });
      setForm({ department: "", phaseId: "", score: "7", weekOf: getCurrentWeek(), notes: "" });
      setShowForm(false);
      toast({ title: "Pulse recorded" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/department-pulse/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/department-pulse'] }),
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

  // Filter by selected phase
  const filteredData = selectedPhase === "all"
    ? (pulseData || [])
    : (pulseData || []).filter(d => d.phaseId === Number(selectedPhase));

  // Build chart data: weeks as x-axis, departments as lines
  const weekSet = Array.from(new Set(filteredData.map(d => d.weekOf))).sort();
  const deptSet = Array.from(new Set(filteredData.map(d => d.department))).sort();

  const chartData = weekSet.map(week => {
    const point: Record<string, any> = { week };
    deptSet.forEach(dept => {
      const entries = filteredData.filter(d => d.weekOf === week && d.department === dept);
      if (entries.length > 0) {
        point[dept] = Math.round(entries.reduce((sum, e) => sum + e.score, 0) / entries.length);
      }
    });
    return point;
  });

  // Summary table: average score per dept per phase
  const summaryData = phaseList.map(phase => {
    const phaseEntries = (pulseData || []).filter(d => d.phaseId === phase.id);
    const deptScores = DEPARTMENTS.map(dept => {
      const deptEntries = phaseEntries.filter(d => d.department === dept);
      const avg = deptEntries.length > 0
        ? Math.round(deptEntries.reduce((sum, e) => sum + e.score, 0) / deptEntries.length)
        : null;
      return { dept, avg };
    });
    return { phase, deptScores };
  });

  function scoreColor(score: number | null): string {
    if (score === null) return "text-muted-foreground/30";
    if (score >= 8) return "text-chart-3";
    if (score >= 5) return "text-chart-4";
    return "text-destructive";
  }

  function scoreBg(score: number | null): string {
    if (score === null) return "bg-muted/20";
    if (score >= 8) return "bg-chart-3/15";
    if (score >= 5) return "bg-chart-4/15";
    return "bg-destructive/15";
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest mb-3">
            <Users className="w-3 h-3" /> Team Health
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Department Pulse</h1>
          <p className="text-muted-foreground mt-1">Track team health trends across all phases (score: 1–10)</p>
        </div>
        <Button data-testid="button-add-pulse" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Record Pulse
        </Button>
      </div>

      {/* Add Form */}
      {showForm && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Activity className="w-4 h-4 text-primary" /> New Pulse Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={v => setForm(f => ({ ...f, department: v }))}>
                  <SelectTrigger data-testid="select-pulse-department">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phase</Label>
                <Select value={form.phaseId} onValueChange={v => setForm(f => ({ ...f, phaseId: v }))}>
                  <SelectTrigger data-testid="select-pulse-phase">
                    <SelectValue placeholder="Select phase..." />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Week</Label>
                <Input
                  type="week"
                  data-testid="input-pulse-week"
                  value={form.weekOf}
                  onChange={e => setForm(f => ({ ...f, weekOf: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Score (1–10): <span className="font-bold text-foreground">{form.score}</span></Label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  data-testid="input-pulse-score"
                  value={form.score}
                  onChange={e => setForm(f => ({ ...f, score: e.target.value }))}
                  className="w-full accent-primary"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea
                  data-testid="input-pulse-notes"
                  placeholder="Context for this score..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-pulse"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.department || !form.phaseId || createMutation.isPending}
              >
                {createMutation.isPending ? "Saving..." : "Record Pulse"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader className="flex flex-col md:flex-row md:items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 font-display">
              <Activity className="w-5 h-5 text-primary" /> Trend Over Time
            </CardTitle>
            <CardDescription>Department scores by week</CardDescription>
          </div>
          <Select value={selectedPhase} onValueChange={setSelectedPhase}>
            <SelectTrigger data-testid="select-filter-phase" className="w-52">
              <SelectValue placeholder="Filter by phase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Phases</SelectItem>
              {phaseList.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No pulse data yet. Record the first entry to see trends.</p>
            </div>
          ) : (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Legend />
                  {deptSet.map(dept => (
                    <Line
                      key={dept}
                      type="monotone"
                      dataKey={dept}
                      stroke={DEPT_COLORS[dept] || "hsl(var(--primary))"}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Grid */}
      <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
        <CardHeader>
          <CardTitle className="font-display">Phase × Department Scorecard</CardTitle>
          <CardDescription>Average pulse score per department per phase</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left text-xs uppercase tracking-wider text-muted-foreground pb-3 pr-4">Phase</th>
                  {DEPARTMENTS.map(d => (
                    <th key={d} className="text-center text-xs uppercase tracking-wider text-muted-foreground pb-3 px-1">
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summaryData.map(({ phase, deptScores }) => (
                  <tr key={phase.id} className="border-t border-border/30">
                    <td className="py-3 pr-4">
                      <span className="text-sm font-medium text-foreground">{phase.name}</span>
                    </td>
                    {deptScores.map(({ dept, avg }) => (
                      <td key={dept} className="py-3 px-1 text-center">
                        <span
                          data-testid={`pulse-cell-${phase.id}-${dept}`}
                          className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-sm font-bold ${scoreBg(avg)} ${scoreColor(avg)}`}
                        >
                          {avg !== null ? avg : "—"}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recent Entries */}
      {pulseData && pulseData.length > 0 && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="font-display text-base text-muted-foreground">Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...pulseData].reverse().slice(0, 10).map(entry => {
                const phase = phaseList.find(p => p.id === entry.phaseId);
                return (
                  <div key={entry.id} data-testid={`pulse-entry-${entry.id}`} className="flex items-center gap-3 p-3 rounded-lg border border-border/30 bg-card/30 hover:bg-card/50 transition-colors">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${scoreBg(entry.score)} ${scoreColor(entry.score)}`}
                    >
                      {entry.score}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">{entry.department}</span>
                        <span className="text-xs text-muted-foreground">· {phase?.name} · {entry.weekOf}</span>
                      </div>
                      {entry.notes && <p className="text-xs text-muted-foreground truncate">{entry.notes}</p>}
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(entry.id)} className="h-7 w-7 p-0 text-muted-foreground/50 hover:text-destructive shrink-0">
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
