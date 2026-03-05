import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import {
  insertBlockerSchema,
  insertDepartmentPulseSchema,
  insertRiskSchema,
  insertLiveopsLogSchema,
  insertMilestoneBufferSchema,
} from "@shared/schema";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  app.get(api.phases.list.path, async (req, res) => {
    const phases = await storage.getPhases();
    res.status(200).json(phases);
  });

  app.get(api.tasks.list.path, async (req, res) => {
    const tasks = await storage.getTasks();
    res.status(200).json(tasks);
  });

  app.get(api.tasks.listByPhase.path, async (req, res) => {
    const phaseId = Number(req.params.phaseId);
    if (isNaN(phaseId)) {
      return res.status(400).json({ message: "Invalid phase ID" });
    }
    const tasks = await storage.getTasksByPhase(phaseId);
    res.status(200).json(tasks);
  });

  app.patch(api.tasks.update.path, async (req, res) => {
    try {
      const taskId = Number(req.params.id);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      const input = api.tasks.update.input.parse(req.body);
      const updatedTask = await storage.updateTask(taskId, input);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.status(200).json(updatedTask);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  // Blockers
  app.get('/api/blockers', async (req, res) => {
    const data = await storage.getBlockers();
    res.json(data);
  });
  app.post('/api/blockers', async (req, res) => {
    try {
      const input = insertBlockerSchema.parse(req.body);
      const created = await storage.createBlocker(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });
  app.patch('/api/blockers/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateBlocker(id, req.body);
    res.json(updated);
  });
  app.delete('/api/blockers/:id', async (req, res) => {
    await storage.deleteBlocker(Number(req.params.id));
    res.status(204).send();
  });

  // Department Pulse
  app.get('/api/department-pulse', async (req, res) => {
    const data = await storage.getDepartmentPulse();
    res.json(data);
  });
  app.post('/api/department-pulse', async (req, res) => {
    try {
      const input = insertDepartmentPulseSchema.parse(req.body);
      const created = await storage.createDepartmentPulse(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });
  app.delete('/api/department-pulse/:id', async (req, res) => {
    await storage.deleteDepartmentPulse(Number(req.params.id));
    res.status(204).send();
  });

  // Risks
  app.get('/api/risks', async (req, res) => {
    const data = await storage.getRisks();
    res.json(data);
  });
  app.post('/api/risks', async (req, res) => {
    try {
      const input = insertRiskSchema.parse(req.body);
      const created = await storage.createRisk(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });
  app.patch('/api/risks/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateRisk(id, req.body);
    res.json(updated);
  });
  app.delete('/api/risks/:id', async (req, res) => {
    await storage.deleteRisk(Number(req.params.id));
    res.status(204).send();
  });

  // LiveOps Logs
  app.get('/api/liveops-logs', async (req, res) => {
    const data = await storage.getLiveopsLogs();
    res.json(data);
  });
  app.post('/api/liveops-logs', async (req, res) => {
    try {
      const input = insertLiveopsLogSchema.parse(req.body);
      const created = await storage.createLiveopsLog(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });
  app.delete('/api/liveops-logs/:id', async (req, res) => {
    await storage.deleteLiveopsLog(Number(req.params.id));
    res.status(204).send();
  });

  // Milestone Buffers
  app.get('/api/milestone-buffers', async (req, res) => {
    const data = await storage.getMilestoneBuffers();
    res.json(data);
  });
  app.post('/api/milestone-buffers', async (req, res) => {
    try {
      const input = insertMilestoneBufferSchema.parse(req.body);
      const created = await storage.createMilestoneBuffer(input);
      res.status(201).json(created);
    } catch (err) {
      if (err instanceof z.ZodError) return res.status(400).json({ message: err.errors[0].message });
      throw err;
    }
  });
  app.patch('/api/milestone-buffers/:id', async (req, res) => {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
    const updated = await storage.updateMilestoneBuffer(id, req.body);
    res.json(updated);
  });
  app.delete('/api/milestone-buffers/:id', async (req, res) => {
    await storage.deleteMilestoneBuffer(Number(req.params.id));
    res.status(204).send();
  });

  // Seed data on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingPhases = await storage.getPhases();
  if (existingPhases.length === 0) {
    console.log("Seeding database...");

    const phase1 = await storage.createPhase({ name: "Concept & Pitch", description: "Defining the core game idea, target audience, and business case.", order: 1 });
    const phase2 = await storage.createPhase({ name: "Pre-Production", description: "Prototyping, technical design, and creating the Game Design Document (GDD).", order: 2 });
    const phase3 = await storage.createPhase({ name: "Production", description: "Full-scale asset creation, programming, and level design.", order: 3 });
    const phase4 = await storage.createPhase({ name: "Alpha & Beta", description: "Feature complete (Alpha) and Content complete (Beta) milestones.", order: 4 });
    const phase5 = await storage.createPhase({ name: "Post-Launch & LiveOps", description: "Post-release support, bug fixing, and content updates.", order: 5 });

    await storage.createTask({ phaseId: phase1.id, title: "Draft High-Level Pitch Deck", description: "Create a 10-15 slide presentation outlining the game's vision, genre, platform, and USP.", apmGuidelines: "Ensure the deck includes a clear 'Why this game now?' slide. Keep it concise.", isCompleted: false });
    await storage.createTask({ phaseId: phase1.id, title: "Market & Competitor Analysis", description: "Analyze 3-5 direct competitors, their monetization models, and audience reception.", apmGuidelines: "Focus on player reviews and post-mortems of competitors.", isCompleted: false });
    await storage.createTask({ phaseId: phase2.id, title: "Establish Game Design Document (GDD)", description: "Create a living document detailing mechanics, story, art style, and technical requirements.", apmGuidelines: "Don't write the whole GDD yourself. Setup the skeleton and assign sections to discipline leads.", isCompleted: false });
    await storage.createTask({ phaseId: phase2.id, title: "Build Vertical Slice Prototype", description: "Develop a playable prototype that demonstrates the core loop and art direction.", apmGuidelines: "The vertical slice should ONLY prove the fun factor, not contain fully polished assets.", isCompleted: false });
    await storage.createTask({ phaseId: phase3.id, title: "Setup Sprint Boards & Backlogs", description: "Configure Jira or equivalent tool for the main production sprints.", apmGuidelines: "Work with producers to ensure tickets have clear Acceptance Criteria.", isCompleted: false });
    await storage.createTask({ phaseId: phase3.id, title: "Asset Pipeline Definition", description: "Finalize naming conventions, folder structures, and check-in procedures for art and audio assets.", apmGuidelines: "Document this pipeline clearly and onboard all new artists.", isCompleted: false });
    await storage.createTask({ phaseId: phase4.id, title: "Feature Freeze (Alpha)", description: "Ensure all planned features are implemented, even if buggy. Stop adding new features.", apmGuidelines: "Be the bad guy if needed. Say NO to new feature requests from stakeholders.", isCompleted: false });
    await storage.createTask({ phaseId: phase4.id, title: "External QA Playtesting", description: "Run beta tests with external users to gather usability and bug data.", apmGuidelines: "Prepare specific feedback forms focusing on player friction points.", isCompleted: false });
    await storage.createTask({ phaseId: phase5.id, title: "Day 1 Patch Planning", description: "Identify and fix critical issues discovered during certification for the launch day update.", apmGuidelines: "Prioritize crashes and progression blockers. Cosmetic bugs can wait for Week 1 patch.", isCompleted: false });

    console.log("Database seeded successfully.");
  }
}
