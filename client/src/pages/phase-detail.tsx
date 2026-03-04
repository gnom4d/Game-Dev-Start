import { useRoute } from "wouter";
import { usePhases } from "@/hooks/use-phases";
import { useTasksByPhase } from "@/hooks/use-tasks";
import { TaskCard } from "@/components/task-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { FolderKanban, CheckCircle2, ListTodo } from "lucide-react";

export default function PhaseDetail() {
  const [, params] = useRoute("/phases/:id");
  const phaseId = params?.id ? parseInt(params.id, 10) : undefined;
  
  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: tasks, isLoading: tasksLoading } = useTasksByPhase(phaseId);

  const isLoading = phasesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 w-full max-w-5xl mx-auto space-y-8">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-20 w-full mb-8" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
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

  return (
    <div className="p-6 md:p-10 w-full max-w-5xl mx-auto overflow-y-auto h-full space-y-8 pb-24">
      {/* Header Section */}
      <div className="space-y-4 bg-gradient-to-br from-card to-card/50 border border-border/50 rounded-2xl p-6 md:p-8 shadow-xl shadow-black/20 relative overflow-hidden">
        {/* Abstract background element */}
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
          
          {/* Progress Mini-Dashboard */}
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
    </div>
  );
}
