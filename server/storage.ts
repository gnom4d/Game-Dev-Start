import { 
  phases, tasks, blockers, pulseTracker, risks, liveOpsFeedback,
  type Phase, type Task, type UpdateTaskRequest,
  type Blocker, type PulseValue, type Risk, type LiveOpsFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPhases(): Promise<Phase[]>;
  getTasks(): Promise<Task[]>;
  getTasksByPhase(phaseId: number): Promise<Task[]>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  
  getBlockers(): Promise<Blocker[]>;
  getPulseData(): Promise<PulseValue[]>;
  getRisks(): Promise<Risk[]>;
  getLiveOpsFeedback(): Promise<LiveOpsFeedback[]>;

  // Internal methods for seeding
  createPhase(phase: Omit<Phase, "id">): Promise<Phase>;
  createTask(task: Omit<Task, "id">): Promise<Task>;
  createBlocker(blocker: Omit<Blocker, "id">): Promise<Blocker>;
  createPulse(pulse: Omit<PulseValue, "id">): Promise<PulseValue>;
  createRisk(risk: Omit<Risk, "id">): Promise<Risk>;
  createLiveOps(feedback: Omit<LiveOpsFeedback, "id">): Promise<LiveOpsFeedback>;
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
    const [updated] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return updated;
  }

  async getBlockers(): Promise<Blocker[]> {
    return await db.select().from(blockers);
  }

  async getPulseData(): Promise<PulseValue[]> {
    return await db.select().from(pulseTracker);
  }

  async getRisks(): Promise<Risk[]> {
    return await db.select().from(risks);
  }

  async getLiveOpsFeedback(): Promise<LiveOpsFeedback[]> {
    return await db.select().from(liveOpsFeedback).orderBy(liveOpsFeedback.createdAt);
  }

  async createPhase(phase: Omit<Phase, "id">): Promise<Phase> {
    const [newPhase] = await db.insert(phases).values(phase).returning();
    return newPhase;
  }

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async createBlocker(blocker: Omit<Blocker, "id">): Promise<Blocker> {
    const [newBlocker] = await db.insert(blockers).values(blocker).returning();
    return newBlocker;
  }

  async createPulse(pulse: Omit<PulseValue, "id">): Promise<PulseValue> {
    const [newPulse] = await db.insert(pulseTracker).values(pulse).returning();
    return newPulse;
  }

  async createRisk(risk: Omit<Risk, "id">): Promise<Risk> {
    const [newRisk] = await db.insert(risks).values(risk).returning();
    return newRisk;
  }

  async createLiveOps(feedback: Omit<LiveOpsFeedback, "id">): Promise<LiveOpsFeedback> {
    const [newFeedback] = await db.insert(liveOpsFeedback).values(feedback).returning();
    return newFeedback;
  }
}

export const storage = new DatabaseStorage();
