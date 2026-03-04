import { phases, tasks, type Phase, type Task, type UpdateTaskRequest } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getPhases(): Promise<Phase[]>;
  getTasks(): Promise<Task[]>;
  getTasksByPhase(phaseId: number): Promise<Task[]>;
  updateTask(id: number, updates: UpdateTaskRequest): Promise<Task>;
  
  // Internal methods for seeding
  createPhase(phase: Omit<Phase, "id">): Promise<Phase>;
  createTask(task: Omit<Task, "id">): Promise<Task>;
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

  async createPhase(phase: Omit<Phase, "id">): Promise<Phase> {
    const [newPhase] = await db.insert(phases).values(phase).returning();
    return newPhase;
  }

  async createTask(task: Omit<Task, "id">): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }
}

export const storage = new DatabaseStorage();
