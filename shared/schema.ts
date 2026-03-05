import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
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

export const blockers = pgTable("blockers", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull(),
  taskId: integer("task_id"),
  author: text("author").notNull(),
  source: text("source").notNull(),
  severity: text("severity").notNull().default("medium"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const departmentPulse = pgTable("department_pulse", {
  id: serial("id").primaryKey(),
  department: text("department").notNull(),
  phaseId: integer("phase_id").notNull(),
  score: integer("score").notNull(),
  weekOf: text("week_of").notNull(),
  notes: text("notes").default(""),
});

export const risks = pgTable("risks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  linkedPhaseId: integer("linked_phase_id"),
  severity: text("severity").notNull().default("medium"),
  status: text("status").notNull().default("open"),
  notes: text("notes").default(""),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const liveopsLogs = pgTable("liveops_logs", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(),
  source: text("source").notNull(),
  content: text("content").notNull(),
  severity: text("severity").notNull().default("info"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const milestoneBuffers = pgTable("milestone_buffers", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  productionPhaseId: integer("production_phase_id").notNull(),
  slippingFromPhaseId: integer("slipping_from_phase_id").notNull(),
  bufferDays: integer("buffer_days").notNull().default(0),
  status: text("status").notNull().default("on-track"),
  notes: text("notes").default(""),
});

export const postMortems = pgTable("post_mortems", {
  id: serial("id").primaryKey(),
  phaseId: integer("phase_id").notNull(),
  type: text("type").notNull().default("lesson"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const timelineEvents = pgTable("timeline_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").default(""),
  phaseId: integer("phase_id"),
  eventType: text("event_type").notNull().default("milestone"),
  sourceType: text("source_type"),
  sourceId: integer("source_id"),
  occurredAt: timestamp("occurred_at").defaultNow().notNull(),
});

export const insertPhaseSchema = createInsertSchema(phases).omit({ id: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true });
export const insertBlockerSchema = createInsertSchema(blockers).omit({ id: true, createdAt: true });
export const insertDepartmentPulseSchema = createInsertSchema(departmentPulse).omit({ id: true });
export const insertRiskSchema = createInsertSchema(risks).omit({ id: true, createdAt: true, resolvedAt: true });
export const insertLiveopsLogSchema = createInsertSchema(liveopsLogs).omit({ id: true, createdAt: true });
export const insertMilestoneBufferSchema = createInsertSchema(milestoneBuffers).omit({ id: true });
export const insertPostMortemSchema = createInsertSchema(postMortems).omit({ id: true, createdAt: true });
export const insertTimelineEventSchema = createInsertSchema(timelineEvents).omit({ id: true });

export type Phase = typeof phases.$inferSelect;
export type InsertPhase = z.infer<typeof insertPhaseSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTaskRequest = Partial<InsertTask>;

export type Blocker = typeof blockers.$inferSelect;
export type InsertBlocker = z.infer<typeof insertBlockerSchema>;

export type DepartmentPulse = typeof departmentPulse.$inferSelect;
export type InsertDepartmentPulse = z.infer<typeof insertDepartmentPulseSchema>;

export type Risk = typeof risks.$inferSelect;
export type InsertRisk = z.infer<typeof insertRiskSchema>;

export type LiveopsLog = typeof liveopsLogs.$inferSelect;
export type InsertLiveopsLog = z.infer<typeof insertLiveopsLogSchema>;

export type MilestoneBuffer = typeof milestoneBuffers.$inferSelect;
export type InsertMilestoneBuffer = z.infer<typeof insertMilestoneBufferSchema>;

export type PostMortem = typeof postMortems.$inferSelect;
export type InsertPostMortem = z.infer<typeof insertPostMortemSchema>;

export type TimelineEvent = typeof timelineEvents.$inferSelect;
export type InsertTimelineEvent = z.infer<typeof insertTimelineEventSchema>;

export * from "./models/auth";
