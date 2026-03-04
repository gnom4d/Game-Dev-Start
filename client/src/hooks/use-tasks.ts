import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type UpdateTaskInput } from "@shared/routes";

export function useTasks() {
  return useQuery({
    queryKey: [api.tasks.list.path],
    queryFn: async () => {
      const res = await fetch(api.tasks.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      return api.tasks.list.responses[200].parse(data);
    },
  });
}

export function useTasksByPhase(phaseId: number | undefined) {
  return useQuery({
    queryKey: [api.tasks.listByPhase.path, phaseId],
    queryFn: async () => {
      if (!phaseId) throw new Error("Phase ID is required");
      const url = buildUrl(api.tasks.listByPhase.path, { phaseId });
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks for phase");
      const data = await res.json();
      return api.tasks.listByPhase.responses[200].parse(data);
    },
    enabled: !!phaseId,
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateTaskInput }) => {
      const url = buildUrl(api.tasks.update.path, { id });
      const res = await fetch(url, {
        method: api.tasks.update.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const error = api.tasks.update.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to update task");
      }
      
      return api.tasks.update.responses[200].parse(await res.json());
    },
    onSuccess: (data) => {
      // Invalidate both the global task list and the specific phase list
      queryClient.invalidateQueries({ queryKey: [api.tasks.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.tasks.listByPhase.path, data.phaseId] });
    },
  });
}
