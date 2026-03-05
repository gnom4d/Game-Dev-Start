import {
  phases, tasks, blockers, departmentPulse, risks, liveopsLogs, milestoneBuffers,
  type Phase, type Task, type UpdateTaskRequest,
  type Blocker, type InsertBlocker,
  type DepartmentPulse, type InsertDepartmentPulse,
  type Risk, type InsertRisk,
  type LiveopsLog, type InsertLiveopsLog,
  type MilestoneBuffer, type InsertMilestoneBuffer,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  getPhases(): Promise<Phase[]>;
  getTasks(): Promise<Task[]>;
  getTasksByPhase(phaseId: number): Promise<Task[]>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  createPhase(phase: Omit<Phase, "id">): Promise<Phase>;
  createTask(task: Omit<Task, "id">): Promise<Task>;

  // Blockers
  getBlockers(): Promise<Blocker[]>;
  createBlocker(blocker: InsertBlocker): Promise<Blocker>;
  updateBlocker(id: number, updates: Partial<InsertBlocker & { resolvedAt: Date | null }>): Promise<Blocker>;
  deleteBlocker(id: number): Promise<void>;

  // Department Pulse
  getDepartmentPulse(): Promise<DepartmentPulse[]>;
  createDepartmentPulse(entry: InsertDepartmentPulse): Promise<DepartmentPulse>;
  deleteDepartmentPulse(id: number): Promise<void>;

  // Risks
  getRisks(): Promise<Risk[]>;
  createRisk(risk: InsertRisk): Promise<Risk>;
  updateRisk(id: number, updates: Partial<InsertRisk>): Promise<Risk>;
  deleteRisk(id: number): Promise<void>;

  // LiveOps Logs
  getLiveopsLogs(): Promise<LiveopsLog[]>;
  createLiveopsLog(log: InsertLiveopsLog): Promise<LiveopsLog>;
  deleteLiveopsLog(id: number): Promise<void>;

  // Milestone Buffers
  getMilestoneBuffers(): Promise<MilestoneBuffer[]>;
  createMilestoneBuffer(buffer: InsertMilestoneBuffer): Promise<MilestoneBuffer>;
  updateMilestoneBuffer(id: number, updates: Partial<InsertMilestoneBuffer>): Promise<MilestoneBuffer>;
  deleteMilestoneBuffer(id: number): Promise<void>;
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

  // Blockers
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

  // Department Pulse
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

  // Risks
  async getRisks(): Promise<Risk[]> {
    return await db.select().from(risks).orderBy(desc(risks.createdAt));
  }

  async createRisk(risk: InsertRisk): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async updateRisk(id: number, updates: Partial<InsertRisk>): Promise<Risk> {
    const [updated] = await db.update(risks).set(updates).where(eq(risks.id, id)).returning();
    return updated;
  }

  async deleteRisk(id: number): Promise<void> {
    await db.delete(risks).where(eq(risks.id, id));
  }

  // LiveOps Logs
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

  // Milestone Buffers
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
}

export const storage = new DatabaseStorage();
