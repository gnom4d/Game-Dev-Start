import { useState } from "react";
import { useRoute } from "wouter";
import { usePhases } from "@/hooks/use-phases";
import { useTasksByPhase } from "@/hooks/use-tasks";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TaskCard } from "@/components/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  FolderKanban, CheckCircle2, ListTodo, BookOpen, Lightbulb, StickyNote,
  Plus, X, ShieldCheck, ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import type { PostMortem, Risk } from "@shared/schema";

const TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  lesson: { label: "Lesson Learned", icon: Lightbulb, color: "text-chart-4",   bg: "bg-chart-4/10" },
  note:   { label: "Note",           icon: StickyNote, color: "text-primary",   bg: "bg-primary/10" },
  action: { label: "Action Item",    icon: CheckCircle2, color: "text-chart-3", bg: "bg-chart-3/10" },
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "text-chart-3", medium: "text-chart-4", high: "text-chart-5", critical: "text-destructive",
};

export default function PhaseDetail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/phases/:id");
  const phaseId = params?.id ? parseInt(params.id, 10) : undefined;
  const [showPMForm, setShowPMForm] = useState(false);
  const [pmForm, setPmForm] = useState({ type: "lesson", content: "" });

  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: tasks, isLoading: tasksLoading } = useTasksByPhase(phaseId);

  const { data: postMortems, isLoading: pmLoading } = useQuery<PostMortem[]>({
    queryKey: ['/api/post-mortems/phase', phaseId],
    queryFn: async () => {
      if (!phaseId) return [];
      const res = await fetch(`/api/post-mortems/phase/${phaseId}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch post mortems');
      return res.json();
    },
    enabled: !!phaseId,
  });

  const { data: allRisks } = useQuery<Risk[]>({
    queryKey: ['/api/risks'],
    queryFn: async () => {
      const res = await fetch('/api/risks', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch risks');
      return res.json();
    },
  });

  const createPMMutation = useMutation({
    mutationFn: async (data: { type: string; content: string }) => {
      const res = await fetch('/api/post-mortems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phaseId, ...data }),
      });
      if (!res.ok) throw new Error('Failed to save entry');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/post-mortems/phase', phaseId] });
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-events'] });
      setPmForm({ type: "lesson", content: "" });
      setShowPMForm(false);
      toast({ title: "Post mortem entry added" });
    },
  });

  const deletePMMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/post-mortems/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/post-mortems/phase', phaseId] }),
  });

  const isLoading = phasesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 w-full max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-20 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const phase = phases?.find((p) => p.id === phaseId);

  if (!phase) {
    return (
      <div className="p-10 text-center flex flex-col items-center justify-center h-full">
        <FolderKanban className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-display font-bold text-foreground">Phase Not Found</h2>
        <p className="text-muted-foreground mt-2">The development phase you are looking for does not exist.</p>
      </div>
    );
  }

  const sortedTasks = tasks?.sort((a, b) => a.id - b.id) || [];
  const completedTasks = sortedTasks.filter((t) => t.isCompleted).length;
  const totalTasks = sortedTasks.length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Resolved risks linked to this phase
  const resolvedRisks = (allRisks || []).filter(
    r => r.linkedPhaseId === phaseId && (r.status === "mitigated" || r.status === "closed")
  );

  const pmEntries = postMortems || [];
  const hasPostMortemContent = pmEntries.length > 0 || resolvedRisks.length > 0;

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header Section */}
      <div className="space-y-4 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-widest">
              Phase {phase.order}
            </div>
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground tracking-tight">
              {phase.name}
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              {phase.description}
            </p>
          </div>
          <div className="bg-background/80 backdrop-blur-md rounded-xl p-5 border border-border min-w-[240px]">
            <div className="flex justify-between items-end mb-2">
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Completion</div>
              <div className="text-2xl font-display font-bold text-primary">{progressPercentage}%</div>
            </div>
            <Progress value={progressPercentage} className="h-2.5 bg-muted" />
            <div className="flex justify-between mt-3 text-sm">
              <span className="flex items-center gap-1 text-muted-foreground"><ListTodo className="w-4 h-4"/> {totalTasks} Tasks</span>
              <span className="flex items-center gap-1 text-accent"><CheckCircle2 className="w-4 h-4"/> {completedTasks} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-6">
        <div className="flex items-center gap-3 pb-2 border-b border-border/50">
          <h2 className="text-xl font-display font-bold flex items-center gap-2 text-foreground">
            <ListTodo className="w-5 h-5 text-primary" />
            Action Items
          </h2>
          <div className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-bold">
            {totalTasks}
          </div>
        </div>

        {sortedTasks.length === 0 ? (
          <div className="text-center py-16 bg-card/30 border border-dashed border-border/50 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
            <h3 className="text-lg font-semibold text-foreground">No tasks available</h3>
            <p className="text-muted-foreground">Tasks for this phase haven't been configured yet.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedTasks.map((task) => (
              <TaskCard key={task.id} task={task} />
            ))}
          </div>
        )}
      </div>

      {/* Post Mortem / Retrospective Section */}
      <div className="space-y-6 pt-4 border-t-2 border-dashed border-border/30">
        <div className="flex items-center justify-between pb-2">
          <div>
            <h2 className="text-xl font-display font-bold flex items-center gap-2 text-foreground">
              <BookOpen className="w-5 h-5 text-accent" />
              Post Mortem & Retrospective
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Lessons learned, notes, and resolved risks from this phase</p>
          </div>
          <Button
            data-testid="button-add-post-mortem"
            size="sm"
            variant="outline"
            onClick={() => setShowPMForm(v => !v)}
            className="gap-1.5 border-accent/30 text-accent hover:bg-accent/10"
          >
            <Plus className="w-3.5 h-3.5" /> Add Entry
          </Button>
        </div>

        {/* Add post mortem form */}
        {showPMForm && (
          <Card className="glass-panel border-accent/20 shadow-xl shadow-black/20">
            <CardContent className="pt-5 space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Entry Type</Label>
                  <Select value={pmForm.type} onValueChange={v => setPmForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger data-testid="select-pm-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lesson">Lesson Learned</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="action">Action Item</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Content</Label>
                  <Textarea
                    data-testid="input-pm-content"
                    placeholder={
                      pmForm.type === "lesson" ? "What did we learn from this phase?" :
                      pmForm.type === "action" ? "What should be done differently next time?" :
                      "Any additional notes..."
                    }
                    value={pmForm.content}
                    onChange={e => setPmForm(f => ({ ...f, content: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  data-testid="button-submit-pm"
                  size="sm"
                  onClick={() => createPMMutation.mutate(pmForm)}
                  disabled={!pmForm.content || createPMMutation.isPending}
                >
                  {createPMMutation.isPending ? "Saving..." : "Add Entry"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setShowPMForm(false)}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Post mortem entries */}
        {pmEntries.length > 0 && (
          <div className="space-y-3">
            {pmEntries.map(entry => {
              const cfg = TYPE_CONFIG[entry.type] || TYPE_CONFIG.note;
              const EntryIcon = cfg.icon;
              return (
                <div
                  key={entry.id}
                  data-testid={`pm-entry-${entry.id}`}
                  className="flex items-start gap-3 p-4 rounded-xl border border-border/40 bg-card/40 hover:bg-card/60 transition-colors group"
                >
                  <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.bg} shrink-0`}>
                    <EntryIcon className={`w-4 h-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground/90 leading-relaxed">{entry.content}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid={`button-delete-pm-${entry.id}`}
                    onClick={() => deletePMMutation.mutate(entry.id)}
                    className="h-7 w-7 p-0 text-muted-foreground/30 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {/* Resolved risks that link to this phase */}
        {resolvedRisks.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-chart-3" /> Resolved Risks for This Phase
            </h3>
            {resolvedRisks.map(risk => (
              <div
                key={risk.id}
                data-testid={`pm-risk-${risk.id}`}
                className="flex items-start gap-3 p-4 rounded-xl border border-chart-3/20 bg-chart-3/5 hover:bg-chart-3/10 transition-colors"
              >
                <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${SEVERITY_COLORS[risk.severity] || "text-muted-foreground"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-sm font-semibold text-foreground">{risk.title}</span>
                    <Badge
                      variant="outline"
                      className={`text-xs ${risk.status === "mitigated" ? "border-chart-4/40 text-chart-4" : "border-chart-3/40 text-chart-3"}`}
                    >
                      {risk.status}
                    </Badge>
                    {risk.resolvedAt && (
                      <span className="text-xs text-muted-foreground">
                        resolved {new Date(risk.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                  {risk.notes && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      <span className="font-medium text-chart-3">Resolution:</span> {risk.notes}
                    </p>
                  )}
                </div>
                <Link href="/risks">
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground hover:text-primary shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}

        {!hasPostMortemContent && !pmLoading && (
          <div className="text-center py-10 bg-card/20 border border-dashed border-border/30 rounded-xl">
            <BookOpen className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-30" />
            <p className="text-sm text-muted-foreground">No retrospective entries yet.</p>
            <p className="text-xs text-muted-foreground">Add lessons learned, notes, and action items from this phase.</p>
          </div>
        )}
      </div>
    </div>
  );
}
