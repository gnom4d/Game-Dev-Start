# Game Production APM Dashboard — replit.md

## Overview

This is a **Game Production APM (Associate Producer / Production Manager) Dashboard** — a project management tool tailored for game development teams. It tracks production phases, tasks, blockers, milestones, department health, risks, and live operations (LiveOps) in a single unified interface.

Key features:
- **Dashboard** — High-level analytics with pie/bar charts showing task completion across phases
- **Phase Detail** — Drill-down view of tasks within a production phase, with checkbox completion tracking
- **Blocker Heatmap** — Track and visualize production blockers by severity and phase
- **Milestone Buffers** — Monitor milestone slip risk and buffer days
- **Department Pulse** — Track per-department weekly health scores over time via line charts
- **Risk Register** — Log, filter, and manage production risks
- **LiveOps** — Track player feedback, server stability events, and compute a live health score

---

## User Preferences

Preferred communication style: Simple, everyday language.

---

## System Architecture

### Full-Stack Monorepo Structure

The project uses a **monorepo layout** with three top-level code directories:

```
client/    — React frontend (Vite)
server/    — Express backend (Node.js)
shared/    — Shared TypeScript types, schema, and route definitions
```

This allows the frontend and backend to share type-safe schema and route definitions without duplication.

### Frontend Architecture

- **Framework**: React 18 with TypeScript, bundled via Vite
- **Routing**: `wouter` (lightweight client-side router) — chosen over React Router for simplicity
- **State / Data Fetching**: TanStack Query (React Query v5) for all server state; no global client state library (no Redux/Zustand)
- **UI Components**: shadcn/ui component library (New York style) built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variable-based theming; dark-mode-only "Cyber Minimalist" palette defined in `index.css`
- **Charts**: Recharts (PieChart, BarChart, LineChart) for dashboard analytics
- **Forms**: React Hook Form with Zod resolvers for validation

Path aliases:
- `@/` → `client/src/`
- `@shared/` → `shared/`
- `@assets/` → `attached_assets/`

### Backend Architecture

- **Framework**: Express 5 (with HTTP server wrapping for WebSocket-readiness)
- **Language**: TypeScript, run with `tsx` in dev and bundled with esbuild for production
- **API Style**: RESTful JSON API under `/api/*` prefix
- **Route Definition**: Centralized in `shared/routes.ts` — route paths, HTTP methods, Zod input/response schemas are defined once and consumed by both the server (`server/routes.ts`) and frontend hooks
- **Storage Layer**: `IStorage` interface in `server/storage.ts` with a `DatabaseStorage` implementation — designed so the storage backend can be swapped
- **Dev Server**: Vite is mounted as Express middleware in development (via `server/vite.ts`), enabling HMR within the same process
- **Production Build**: `script/build.ts` runs Vite for the client, then esbuild for the server (bundling selected deps to speed up cold starts)

### Shared Route Contract Pattern

`shared/routes.ts` defines a typed `api` object that includes:
- HTTP method
- Path string
- Zod input schema
- Zod response schemas per status code

This is a key architectural decision — it keeps the API contract type-safe end-to-end without needing a separate codegen step.

### Data Storage

- **Database**: PostgreSQL via `node-postgres` (`pg`)
- **ORM**: Drizzle ORM with `drizzle-zod` for schema-derived Zod validators
- **Schema location**: `shared/schema.ts` — all table definitions live in shared so the frontend can import types directly
- **Migrations**: Drizzle Kit (`drizzle-kit push` for dev, `migrations/` directory for tracked migrations)

#### Database Tables

| Table | Purpose |
|---|---|
| `phases` | Production phases (Concept, Pre-Prod, Alpha, Beta, Launch, etc.) |
| `tasks` | Tasks belonging to a phase, with APM guidelines and completion state |
| `blockers` | Production blockers with severity, author, phase link, and resolution timestamp |
| `department_pulse` | Weekly health scores per department per phase |
| `risks` | Risk register entries with severity/status and optional phase link |
| `liveops_logs` | Player feedback and server stability events post-launch |
| `milestone_buffers` | Milestone slip tracking with buffer days and status |

### Authentication

No authentication system is currently implemented. The app operates without user login — all data is accessible to anyone with access to the running server.

### Mobile Responsiveness

- Sidebar collapses on mobile (uses Sheet drawer pattern)
- `useIsMobile` hook detects breakpoint at 768px
- Responsive grid layouts in dashboard and detail pages

---

## External Dependencies

### Runtime Services
- **PostgreSQL** — Primary data store; connection URL required via `DATABASE_URL` environment variable

### Key NPM Dependencies

| Package | Role |
|---|---|
| `express` v5 | HTTP server framework |
| `drizzle-orm` | Type-safe ORM for PostgreSQL |
| `drizzle-zod` | Auto-generate Zod schemas from Drizzle table definitions |
| `pg` / `connect-pg-simple` | PostgreSQL driver and session store |
| `zod` | Runtime validation; shared between client and server |
| `@tanstack/react-query` | Server state management on frontend |
| `wouter` | Lightweight client-side routing |
| `recharts` | Chart components (pie, bar, line) |
| `@radix-ui/*` | Accessible headless UI primitives |
| `tailwindcss` | Utility-first CSS |
| `class-variance-authority` | Component variant styling |
| `vite` + `@vitejs/plugin-react` | Frontend build tooling |
| `tsx` | TypeScript execution for server in dev |
| `esbuild` | Server bundling for production |
| `nanoid` | Unique ID generation |
| `date-fns` | Date utilities |
| `lucide-react` | Icon library |

### Replit-Specific Plugins (Dev Only)
- `@replit/vite-plugin-runtime-error-modal` — Overlays runtime errors in dev
- `@replit/vite-plugin-cartographer` — Replit file mapping
- `@replit/vite-plugin-dev-banner` — Dev environment banner

### Environment Variables Required
- `DATABASE_URL` — PostgreSQL connection string (must be set before starting the server or running migrations)