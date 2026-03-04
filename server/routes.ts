import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";

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

  // Seed data on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  const existingPhases = await storage.getPhases();
  if (existingPhases.length === 0) {
    console.log("Seeding database...");
    
    const phase1 = await storage.createPhase({
      name: "Concept & Pitch",
      description: "Defining the core game idea, target audience, and business case.",
      order: 1
    });
    
    const phase2 = await storage.createPhase({
      name: "Pre-Production",
      description: "Prototyping, technical design, and creating the Game Design Document (GDD).",
      order: 2
    });
    
    const phase3 = await storage.createPhase({
      name: "Production",
      description: "Full-scale asset creation, programming, and level design.",
      order: 3
    });
    
    const phase4 = await storage.createPhase({
      name: "Alpha & Beta",
      description: "Feature complete (Alpha) and Content complete (Beta) milestones.",
      order: 4
    });

    const phase5 = await storage.createPhase({
      name: "Post-Launch & LiveOps",
      description: "Post-release support, bug fixing, and content updates.",
      order: 5
    });

    // Phase 1 Tasks
    await storage.createTask({
      phaseId: phase1.id,
      title: "Draft High-Level Pitch Deck",
      description: "Create a 10-15 slide presentation outlining the game's vision, genre, platform, and USP (Unique Selling Proposition).",
      apmGuidelines: "Ensure the deck includes a clear 'Why this game now?' slide. Keep it concise. Share with lead designer and executive producer for early feedback.",
      isCompleted: false
    });
    await storage.createTask({
      phaseId: phase1.id,
      title: "Market & Competitor Analysis",
      description: "Analyze 3-5 direct competitors, their monetization models, and audience reception.",
      apmGuidelines: "Focus on player reviews and post-mortems of competitors. Highlight what players felt was missing in those games as potential opportunities for ours.",
      isCompleted: false
    });

    // Phase 2 Tasks
    await storage.createTask({
      phaseId: phase2.id,
      title: "Establish Game Design Document (GDD)",
      description: "Create a living document detailing mechanics, story, art style, and technical requirements.",
      apmGuidelines: "Don't write the whole GDD yourself. Setup the skeleton (Confluence/Notion) and assign specific sections to discipline leads. Set strict deadlines for the first draft.",
      isCompleted: false
    });
    await storage.createTask({
      phaseId: phase2.id,
      title: "Build Vertical Slice Prototype",
      description: "Develop a playable prototype that demonstrates the core loop and art direction.",
      apmGuidelines: "Protect the team from scope creep here. The vertical slice should ONLY prove the fun factor, not contain fully polished assets. Timebox this strictly.",
      isCompleted: false
    });
    
    // Phase 3 Tasks
    await storage.createTask({
      phaseId: phase3.id,
      title: "Setup Sprint Boards & Backlogs",
      description: "Configure Jira or equivalent tool for the main production sprints.",
      apmGuidelines: "Work with producers to ensure tickets have clear Acceptance Criteria. Establish a bug-triage process early so the backlog doesn't get instantly bloated.",
      isCompleted: false
    });
    await storage.createTask({
      phaseId: phase3.id,
      title: "Asset Pipeline Definition",
      description: "Finalize naming conventions, folder structures, and check-in procedures for art and audio assets.",
      apmGuidelines: "Document this pipeline clearly and onboard all new artists. A messy repo will cost weeks of time later. Nominate a 'pipeline champion' in the art team.",
      isCompleted: false
    });

    // Phase 4 Tasks
    await storage.createTask({
      phaseId: phase4.id,
      title: "Feature Freeze (Alpha)",
      description: "Ensure all planned features are implemented, even if buggy. Stop adding new features.",
      apmGuidelines: "Be the bad guy if needed. Say NO to new feature requests from stakeholders. Focus the team entirely on stabilization and balancing.",
      isCompleted: false
    });
    await storage.createTask({
      phaseId: phase4.id,
      title: "External QA Playtesting",
      description: "Run beta tests with external users to gather usability and bug data.",
      apmGuidelines: "Prepare specific feedback forms focusing on player friction points. Do not just ask 'is it fun?'. Ask 'did you understand the upgrade menu?'",
      isCompleted: false
    });
    
    // Phase 5 Tasks
    await storage.createTask({
      phaseId: phase5.id,
      title: "Day 1 Patch Planning",
      description: "Identify and fix critical issues discovered during certification for the launch day update.",
      apmGuidelines: "Prioritize crashes and progression blockers. Cosmetic bugs can wait for Week 1 patch.",
      isCompleted: false
    });

    console.log("Database seeded successfully.");
  }
}
