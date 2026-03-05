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
  isSlipping: boolean("is_slipping").default(false).notNull(),
  milestoneBuffer: integer("milestone_buffer").default(0).notNull(),
});

export const blockers = pgTable("blockers", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  author: text("author").notNull(),
  source: text("source").notNull(),
  severity: integer("severity").notNull(), // 1-5 for heatmap
  createdAt: text("created_at").notNull(),
});

export const pulseTracker = pgTable("pulse_tracker", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull(),
  team: text("team").notNull(), // Art, Engineering, Marketing, QA
  pulse: integer("pulse").notNull(), // 1-10
  week: integer("week").notNull(),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  notes: text("notes").notNull(),
  linkedPhaseId: integer("linked_phase_id"),
});

export const liveOpsFeedback = pgTable("live_ops_feedback", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // "player_feedback", "server_stability"
  content: text("content").notNull(),
  healthScore: integer("health_score").notNull(), // 0-100
  createdAt: text("created_at").notNull(),
});

export const insertPhaseSchema = createInsertSchema(phases).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertBlockerSchema = createInsertSchema(blockers).omit({ id: true });
export const insertPulseSchema = createInsertSchema(pulseTracker).omit({ id: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true });
export const insertLiveOpsFeedbackSchema = createInsertSchema(liveOpsFeedback).omit({ id: true });

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTaskRequest = Partial<InsertTask>;

export type Blocker = typeof blockers.$inferSelect;
export type InsertBlocker = z.infer<typeof insertBlockerSchema>;

export type PulseValue = typeof pulseTracker.$inferSelect;
export type Risk = typeof risks.$inferSelect;
export type LiveOpsFeedback = typeof liveOpsFeedback.$inferSelect;
