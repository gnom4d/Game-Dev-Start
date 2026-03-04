import { pgTable, text, serial, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const phases = pgTable("phases", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  order: integer("order").notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  apmGuidelines: text("apm_guidelines").notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
});

export const insertPhaseSchema = createInsertSchema(phases).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTaskRequest = Partial<InsertTask>;
