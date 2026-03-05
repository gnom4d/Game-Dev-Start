import {
  phases, tasks, blockers, departmentPulse, risks, liveopsLogs, milestoneBuffers, postMortems, timelineEvents,
  type Phase, type Task, type UpdateTaskRequest,
  type Blocker, type InsertBlocker,
  type DepartmentPulse, type InsertDepartmentPulse,
  type Risk, type InsertRisk,
  type LiveopsLog, type InsertLiveopsLog,
  type MilestoneBuffer, type InsertMilestoneBuffer,
  type PostMortem, type InsertPostMortem,
  type TimelineEvent, type InsertTimelineEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, asc } from "drizzle-orm";

export interface IStorage {
  getPhases(): Promise<Phase[]>;
  getTasks(): Promise<Task[]>;
  getTasksByPhase(phaseId: number): Promise<Task[]>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  createPhase(phase: Omit<Phase, "id">): Promise<Phase>;
  createTask(task: Omit<Task, "id">): Promise<Task>;

  getBlockers(): Promise<Blocker[]>;
  createBlocker(blocker: InsertBlocker): Promise<Blocker>;
  updateBlocker(id: number, updates: Partial<InsertBlocker & { resolvedAt: Date | null }>): Promise<Blocker>;
  deleteBlocker(id: number): Promise<void>;

  getDepartmentPulse(): Promise<DepartmentPulse[]>;
  createDepartmentPulse(entry: InsertDepartmentPulse): Promise<DepartmentPulse>;
  deleteDepartmentPulse(id: number): Promise<void>;

  getRisks(): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, updates: Partial<Risk>): Promise<Risk>;
  deleteRisk(id: number): Promise<void>;

  getLiveopsLogs(): Promise<LiveopsLog[]>;
  createLiveopsLog(log: InsertLiveopsLog): Promise<LiveopsLog>;
  deleteLiveopsLog(id: number): Promise<void>;

  getMilestoneBuffers(): Promise<MilestoneBuffer[]>;
  createMilestoneBuffer(buffer: InsertMilestoneBuffer): Promise<MilestoneBuffer>;
  updateMilestoneBuffer(id: number, updates: Partial<InsertMilestoneBuffer>): Promise<MilestoneBuffer>;
  deleteMilestoneBuffer(id: number): Promise<void>;

  getPostMortems(): Promise<PostMortem[]>;
  getPostMortemsByPhase(phaseId: number): Promise<PostMortem[]>;
  createPostMortem(entry: InsertPostMortem): Promise<PostMortem>;
  deletePostMortem(id: number): Promise<void>;

  getTimelineEvents(): Promise<TimelineEvent[]>;
  createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent>;
  deleteTimelineEvent(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getPhases(): Promise<Phase[]> {
    return await db.select().from(phases).orderBy(phases.order);
  }

  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(tasks.id);
  }

  async getTasksByPhase(phaseId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.phaseId, phaseId));
  }

  async updateTask(id: number, updates: UpdateTaskRequest): Promise<Task> {
    const [updated] = await db.update(tasks).set(updates).where(eq(tasks.id, id)).returning();
    return updated;
  }

  async createPhase(phase: Omit<Phase, "id">): Promise<Phase> {
    const [newPhase] = await db.insert(phases).values(phase).returning();
    return newPhase;
  }

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async getBlockers(): Promise<Blocker[]> {
    return await db.select().from(blockers).orderBy(desc(blockers.createdAt));
  }

  async createBlocker(blocker: InsertBlocker): Promise<Blocker> {
    const [newBlocker] = await db.insert(blockers).values(blocker).returning();
    return newBlocker;
  }

  async updateBlocker(id: number, updates: Partial<InsertBlocker & { resolvedAt: Date | null }>): Promise<Blocker> {
    const [updated] = await db.update(blockers).set(updates as any).where(eq(blockers.id, id)).returning();
    return updated;
  }

  async deleteBlocker(id: number): Promise<void> {
    await db.delete(blockers).where(eq(blockers.id, id));
  }

  async getDepartmentPulse(): Promise<DepartmentPulse[]> {
    return await db.select().from(departmentPulse).orderBy(departmentPulse.weekOf);
  }

  async createDepartmentPulse(entry: InsertDepartmentPulse): Promise<DepartmentPulse> {
    const [newEntry] = await db.insert(departmentPulse).values(entry).returning();
    return newEntry;
  }

  async deleteDepartmentPulse(id: number): Promise<void> {
    await db.delete(departmentPulse).where(eq(departmentPulse.id, id));
  }

  async getRisks(): Promise<Risk[]> {
    return await db.select().from(risks).orderBy(desc(risks.createdAt));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async updateRisk(id: number, updates: Partial<Risk>): Promise<Risk> {
    const [updated] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
    return updated;
  }

  async deleteRisk(id: number): Promise<void> {
    await db.delete(risks).where(eq(risks.id, id));
  }

  async getLiveopsLogs(): Promise<LiveopsLog[]> {
    return await db.select().from(liveopsLogs).orderBy(desc(liveopsLogs.createdAt));
  }

  async createLiveopsLog(log: InsertLiveopsLog): Promise<LiveopsLog> {
    const [newLog] = await db.insert(liveopsLogs).values(log).returning();
    return newLog;
  }

  async deleteLiveopsLog(id: number): Promise<void> {
    await db.delete(liveopsLogs).where(eq(liveopsLogs.id, id));
  }

  async getMilestoneBuffers(): Promise<MilestoneBuffer[]> {
    return await db.select().from(milestoneBuffers).orderBy(milestoneBuffers.id);
  }

  async createMilestoneBuffer(buffer: InsertMilestoneBuffer): Promise<MilestoneBuffer> {
    const [newBuffer] = await db.insert(milestoneBuffers).values(buffer).returning();
    return newBuffer;
  }

  async updateMilestoneBuffer(id: number, updates: Partial<InsertMilestoneBuffer>): Promise<MilestoneBuffer> {
    const [updated] = await db.update(milestoneBuffers).set(updates).where(eq(milestoneBuffers.id, id)).returning();
    return updated;
  }

  async deleteMilestoneBuffer(id: number): Promise<void> {
    await db.delete(milestoneBuffers).where(eq(milestoneBuffers.id, id));
  }

  async getPostMortems(): Promise<PostMortem[]> {
    return await db.select().from(postMortems).orderBy(asc(postMortems.createdAt));
  }

  async getPostMortemsByPhase(phaseId: number): Promise<PostMortem[]> {
    return await db.select().from(postMortems).where(eq(postMortems.phaseId, phaseId)).orderBy(asc(postMortems.createdAt));
  }

  async createPostMortem(entry: InsertPostMortem): Promise<PostMortem> {
    const [newEntry] = await db.insert(postMortems).values(entry).returning();
    return newEntry;
  }

  async deletePostMortem(id: number): Promise<void> {
    await db.delete(postMortems).where(eq(postMortems.id, id));
  }

  async getTimelineEvents(): Promise<TimelineEvent[]> {
    return await db.select().from(timelineEvents).orderBy(desc(timelineEvents.occurredAt));
  }

  async createTimelineEvent(event: InsertTimelineEvent): Promise<TimelineEvent> {
    const [newEvent] = await db.insert(timelineEvents).values(event).returning();
    return newEvent;
  }

  async deleteTimelineEvent(id: number): Promise<void> {
    await db.delete(timelineEvents).where(eq(timelineEvents.id, id));
  }
}

export const storage = new DatabaseStorage();
