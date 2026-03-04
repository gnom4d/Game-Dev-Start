import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function usePhases() {
  return useQuery({
    queryKey: [api.phases.list.path],
    queryFn: async () => {
      const res = await fetch(api.phases.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch phases");
      const data = await res.json();
      return api.phases.list.responses[200].parse(data);
    },
  });
}
