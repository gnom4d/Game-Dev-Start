import { Task } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { useUpdateTask } from "@/hooks/use-tasks";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Lightbulb, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { mutate: updateTask, isPending } = useUpdateTask();

  const handleToggle = (checked: boolean) => {
    updateTask({
      id: task.id,
      updates: { isCompleted: checked }
    });
  };

  return (
    <div 
      className={cn(
        "glass-panel rounded-xl overflow-hidden transition-all duration-300",
        task.isCompleted ? "opacity-60 border-primary/20 bg-card/40" : "border-border/50 bg-card hover:border-primary/30 shadow-lg shadow-black/10"
      )}
    >
      <div className="p-5 flex items-start gap-4">
        <div className="pt-1">
          <Checkbox 
            checked={task.isCompleted} 
            onCheckedChange={handleToggle}
            disabled={isPending}
            className={cn(
              "w-6 h-6 rounded-md transition-all duration-200",
              task.isCompleted ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground border-primary" : "border-muted-foreground"
            )}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={cn(
            "text-lg font-display font-semibold transition-colors duration-200",
            task.isCompleted ? "text-muted-foreground line-through decoration-primary/50" : "text-foreground"
          )}>
            {task.title}
          </h3>
          
          <Accordion type="single" collapsible className="mt-2 w-full border-none">
            <AccordionItem value="details" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:no-underline">
                View Task Details & Guidelines
              </AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                <div className="space-y-6">
                  {/* General Description */}
                  <div className="text-foreground/80 leading-relaxed text-sm">
                    {task.description}
                  </div>
                  
                  {/* APM Guidelines Highlight */}
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-accent/5 border border-primary/20 p-5">
                    {/* Decorative background element */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
                    
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3 text-primary">
                        <div className="p-1.5 rounded-md bg-primary/20 text-primary">
                          <Lightbulb className="w-4 h-4" />
                        </div>
                        <h4 className="font-display font-bold tracking-wide text-sm uppercase">APM Actionable Guidelines</h4>
                      </div>
                      <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                        {task.apmGuidelines}
                      </p>
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
