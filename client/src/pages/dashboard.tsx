import { usePhases } from "@/hooks/use-phases";
import { useTasks } from "@/hooks/use-tasks";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2, Target, Clock, BarChart3, Layers } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: phases, isLoading: phasesLoading } = usePhases();
  const { data: tasks, isLoading: tasksLoading } = useTasks();

  const isLoading = phasesLoading || tasksLoading;

  if (isLoading) {
    return (
      <div className="p-8 w-full max-w-7xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-2xl" />
      </div>
    );
  }

  if (!phases || !tasks) return null;

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.isCompleted).length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Pie chart data
  const pieData = [
    { name: "Completed", value: completedTasks, color: "hsl(var(--primary))" },
    { name: "Remaining", value: totalTasks - completedTasks, color: "hsl(var(--muted))" }
  ];

  // Bar chart data - calculate progress per phase
  const phaseProgressData = phases.sort((a, b) => a.order - b.order).map(phase => {
    const phaseTasks = tasks.filter(t => t.phaseId === phase.id);
    const phaseCompleted = phaseTasks.filter(t => t.isCompleted).length;
    return {
      name: phase.name,
      id: phase.id,
      Total: phaseTasks.length,
      Completed: phaseCompleted,
      progress: phaseTasks.length > 0 ? Math.round((phaseCompleted / phaseTasks.length) * 100) : 0
    };
  });

  return (
    <div className="p-6 md:p-10 w-full max-w-7xl mx-auto space-y-8 overflow-y-auto h-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Overview</h1>
        <p className="text-muted-foreground text-lg">Track your game development pipeline progress.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total Progress</CardTitle>
            <Target className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{completionPercentage}%</div>
            <p className="text-sm text-muted-foreground mt-1">Overall pipeline completion</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Completed Tasks</CardTitle>
            <CheckCircle2 className="h-5 w-5 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-display font-bold text-foreground">{completedTasks}</div>
            <p className="text-sm text-muted-foreground mt-1">Out of {totalTasks} total tasks</p>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Phase</CardTitle>
            <Clock className="h-5 w-5 text-chart-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-display font-bold text-foreground truncate">
              {phaseProgressData.find(p => p.progress < 100)?.name || "All Completed!"}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Current focus area</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel border-border/50 lg:col-span-2 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <BarChart3 className="h-5 w-5 text-primary" />
              Phase Progress
            </CardTitle>
            <CardDescription>Task completion breakdown by development phase</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={phaseProgressData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    dy={10} 
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <RechartsTooltip 
                    cursor={{fill: 'hsl(var(--muted)/0.5)'}}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="Total" fill="hsl(var(--muted))" radius={[4, 4, 4, 4]} barSize={32} />
                  <Bar dataKey="Completed" fill="hsl(var(--primary))" radius={[4, 4, 4, 4]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel border-border/50 shadow-xl shadow-black/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <Layers className="h-5 w-5 text-accent" />
              Quick Jump
            </CardTitle>
            <CardDescription>Navigate to specific phases</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mt-2">
              {phaseProgressData.map((phase) => (
                <Link key={phase.id} href={`/phases/${phase.id}`}>
                  <div className="group block p-4 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-primary/50 cursor-pointer transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg shadow-black/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-foreground group-hover:text-primary transition-colors">{phase.name}</span>
                      <span className="text-xs font-bold text-muted-foreground">{phase.progress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-primary h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${phase.progress}%` }} 
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
