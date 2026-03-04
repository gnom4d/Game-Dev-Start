import { z } from "zod";
import { insertTaskSchema, phases, tasks } from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  phases: {
    list: {
      method: 'GET' as const,
      path: '/api/phases' as const,
      responses: {
        200: z.array(z.custom<typeof phases.$inferSelect>()),
      },
    }
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks' as const,
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      }
    },
    listByPhase: {
      method: 'GET' as const,
      path: '/api/phases/:phaseId/tasks' as const,
      responses: {
        200: z.array(z.custom<typeof tasks.$inferSelect>()),
      }
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id' as const,
      input: insertTaskSchema.partial(),
      responses: {
        200: z.custom<typeof tasks.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type UpdateTaskInput = z.infer<typeof api.tasks.update.input>;
