import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePhases } from "@/hooks/use-phases";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  GitBranch, Plus, X, Flag, ShieldCheck, Zap, BookOpen, AlertTriangle,
  CheckCircle, Star, Clock
} from "lucide-react";
import { Link } from "wouter";
import type { TimelineEvent } from "@shared/schema";

const EVENT_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string; dot: string }> = {
  "milestone":        { label: "Milestone",          icon: Flag,         color: "text-chart-3",     bg: "bg-chart-3/10",     border: "border-chart-3/40",     dot: "bg-chart-3" },
  "blocker-resolved": { label: "Blocker Cleared",    icon: CheckCircle,  color: "text-primary",     bg: "bg-primary/10",     border: "border-primary/40",     dot: "bg-primary" },
  "risk-resolved":    { label: "Risk Resolved",      icon: ShieldCheck,  color: "text-accent",      bg: "bg-accent/10",      border: "border-accent/40",      dot: "bg-accent" },
  "post-mortem":      { label: "Lesson Learned",     icon: BookOpen,     color: "text-chart-4",     bg: "bg-chart-4/10",     border: "border-chart-4/40",     dot: "bg-chart-4" },
  "launch":           { label: "Launch",             icon: Zap,          color: "text-chart-5",     bg: "bg-chart-5/10",     border: "border-chart-5/40",     dot: "bg-chart-5" },
  "custom":           { label: "Event",              icon: Star,         color: "text-chart-1",     bg: "bg-chart-1/10",     border: "border-chart-1/40",     dot: "bg-chart-1" },
};

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function groupByDate(events: TimelineEvent[]): Record<string, TimelineEvent[]> {
  return events.reduce<Record<string, TimelineEvent[]>>((acc, event) => {
    const date = new Date(event.occurredAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(event);
    return acc;
  }, {});
}

export default function TimelinePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: phases } = usePhases();
  const [showForm, setShowForm] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    phaseId: "",
    eventType: "milestone",
  });

  const { data: events, isLoading } = useQuery<TimelineEvent[]>({
    queryKey: ['/api/timeline-events'],
    queryFn: async () => {
      const res = await fetch('/api/timeline-events', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch timeline events');
      return res.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const res = await fetch('/api/timeline-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...data,
          phaseId: (data.phaseId && data.phaseId !== "none") ? Number(data.phaseId) : null,
          sourceType: "manual",
          occurredAt: new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error('Failed to create timeline event');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/timeline-events'] });
      setForm({ title: "", description: "", phaseId: "", eventType: "milestone" });
      setShowForm(false);
      toast({ title: "Timeline event added" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/timeline-events/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/timeline-events'] }),
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-[600px] w-full rounded-2xl" />
      </div>
    );
  }

  const phaseList = phases?.sort((a, b) => a.order - b.order) || [];
  const allEvents = (events || []).slice().sort((a, b) =>
    new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()
  );

  const filteredEvents = filterType === "all"
    ? allEvents
    : allEvents.filter(e => e.eventType === filterType);

  const groupedEvents = groupByDate(filteredEvents);
  const dateGroups = Object.entries(groupedEvents);

  const greenFlagTypes = ["milestone", "blocker-resolved", "risk-resolved"];
  const greenFlagCount = allEvents.filter(e => greenFlagTypes.includes(e.eventType)).length;

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-chart-3/10 text-chart-3 text-xs font-bold uppercase tracking-widest mb-3">
            <GitBranch className="w-3 h-3" /> Change Log
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Project Timeline</h1>
          <p className="text-muted-foreground mt-1">
            Chronological log of milestones, cleared hurdles, and resolved risks
          </p>
        </div>
        <Button data-testid="button-add-timeline-event" onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="w-4 h-4" /> Add Milestone
        </Button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-display font-bold text-chart-3">{greenFlagCount}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Green Flags</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-display font-bold text-primary">
              {allEvents.filter(e => e.eventType === "blocker-resolved").length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Blockers Cleared</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-display font-bold text-accent">
              {allEvents.filter(e => e.eventType === "risk-resolved").length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Risks Resolved</div>
          </CardContent>
        </Card>
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardContent className="pt-5 pb-4">
            <div className="text-2xl font-display font-bold text-chart-4">
              {allEvents.filter(e => e.eventType === "post-mortem").length}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">Lessons Logged</div>
          </CardContent>
        </Card>
      </div>

      {/* Add Event Form */}
      {showForm && (
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-lg">
              <Flag className="w-4 h-4 text-chart-3" /> New Milestone / Event
            </CardTitle>
            <CardDescription>Manually mark a major hurdle cleared or a custom milestone</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label>Event Title</Label>
                <Input
                  data-testid="input-timeline-title"
                  placeholder="e.g. Audio recording complete, Launch build approved"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Event Type</Label>
                <Select value={form.eventType} onValueChange={v => setForm(f => ({ ...f, eventType: v }))}>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="milestone">Milestone</SelectItem>
                    <SelectItem value="launch">Launch</SelectItem>
                    <SelectItem value="custom">Custom Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Linked Phase</Label>
                <Select value={form.phaseId} onValueChange={v => setForm(f => ({ ...f, phaseId: v }))}>
                  <SelectTrigger data-testid="select-timeline-phase">
                    <SelectValue placeholder="Link to phase (optional)" />
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
                  data-testid="input-timeline-description"
                  placeholder="What happened? Why is this significant?"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                data-testid="button-submit-timeline-event"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.title || createMutation.isPending}
              >
                {createMutation.isPending ? "Adding..." : "Add to Timeline"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Filter:</span>
        {[
          { key: "all",             label: "All" },
          { key: "milestone",       label: "Milestones" },
          { key: "blocker-resolved",label: "Blockers" },
          { key: "risk-resolved",   label: "Risks" },
          { key: "post-mortem",     label: "Lessons" },
        ].map(({ key, label }) => (
          <Button
            key={key}
            size="sm"
            variant={filterType === key ? "default" : "ghost"}
            data-testid={`filter-timeline-${key}`}
            onClick={() => setFilterType(key)}
            className="h-7 text-xs"
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Timeline */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-20 bg-card/20 border border-dashed border-border/40 rounded-2xl">
          <GitBranch className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-30" />
          <h3 className="text-lg font-semibold text-foreground">No events yet</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Events are auto-added when you resolve blockers, mitigate risks, or clear milestones.
            You can also add manual entries above.
          </p>
        </div>
      ) : (
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-border/50" />

          <div className="space-y-10 pl-16">
            {dateGroups.map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                {/* Date divider */}
                <div className="flex items-center gap-3 mb-6 -ml-16">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted/50 border border-border/50 shrink-0 z-10">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{dateLabel}</span>
                </div>

                <div className="space-y-4">
                  {dayEvents.map((event) => {
                    const cfg = EVENT_CONFIG[event.eventType] || EVENT_CONFIG.custom;
                    const EventIcon = cfg.icon;
                    const phase = phaseList.find(p => p.id === event.phaseId);
                    const isGreenFlag = greenFlagTypes.includes(event.eventType);

                    return (
                      <div
                        key={event.id}
                        data-testid={`timeline-event-${event.id}`}
                        className="relative group"
                      >
                        {/* Dot on the timeline */}
                        <div
                          className={`absolute -left-[52px] top-4 w-5 h-5 rounded-full ${cfg.dot} border-2 border-background z-10 flex items-center justify-center shadow-lg`}
                        >
                          {isGreenFlag && (
                            <div className={`w-2 h-2 rounded-full bg-background`} />
                          )}
                        </div>

                        {/* Event card */}
                        <div className={`relative p-4 rounded-xl border ${cfg.border} bg-card/40 hover:bg-card/70 transition-colors`}>
                          {/* Green flag banner for milestones */}
                          {isGreenFlag && (
                            <div className={`absolute top-0 right-0 flex items-center gap-1 ${cfg.bg} ${cfg.color} text-xs font-bold px-2.5 py-1 rounded-bl-lg rounded-tr-xl`}>
                              <Flag className="w-3 h-3" />
                              Cleared
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-1.5 rounded-lg ${cfg.bg} shrink-0`}>
                              <EventIcon className={`w-4 h-4 ${cfg.color}`} />
                            </div>
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className={`text-xs font-bold uppercase tracking-wider ${cfg.color}`}>
                                  {cfg.label}
                                </span>
                                {phase && (
                                  <Link href={`/phases/${phase.id}`}>
                                    <span className="text-xs text-primary hover:underline cursor-pointer">
                                      {phase.name}
                                    </span>
                                  </Link>
                                )}
                              </div>
                              <h3 className="font-display font-semibold text-foreground text-sm leading-snug mb-1">{event.title}</h3>
                              {event.description && (
                                <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
                              )}
                              <p className="text-xs text-muted-foreground/50 mt-2">{formatDate(event.occurredAt)}</p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            variant="ghost"
                            data-testid={`button-delete-event-${event.id}`}
                            onClick={() => deleteMutation.mutate(event.id)}
                            className="absolute top-3 right-3 h-6 w-6 p-0 text-muted-foreground/20 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
