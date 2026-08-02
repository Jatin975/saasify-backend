# SaaSify — Master Engineering Playbook & Execution Plan

> **Purpose:** This document is the single source of truth for building SaaSify (an AI-Powered Freelance & Escrow Marketplace API). It preserves complete technical context, day-by-day action items, code patterns, and resumption prompts for continuous AI-assisted learning.

---

## 1. Candidate & Target Context

- **Developer Profile:** Full Stack Developer, 24 years old, 2 years corporate experience.
- **Daily Time Commitment:** 3.5 Hours/day (45 mins Theory & Architecture, 2 hours Pure Execution/Coding, 45 mins Review, Debugging & Commit).
- **Primary Goal:** Transition from service-oriented/basic web dev to a high-scale Product Engineer (SDE-2) at a Tier-1/Tier-2 Product Company (Target Range: ₹18L – ₹45L LPA).
- **Core Tech Stack:** TypeScript, Node.js (Express), PostgreSQL, Prisma ORM, Redis, BullMQ, Socket.io, Next.js (App Router), Gemini AI API, Docker, AWS.

---

## 2. System Architecture & Folder Blueprint

Directory Structure (`/saasify-backend`):

```text
saasify-backend/
├── .github/
│   └── workflows/          # CI/CD Workflows (GitHub Actions)
├── prisma/
│   ├── migrations/         # SQL migration history
│   └── schema.prisma       # Database models & relations
├── src/
│   ├── config/             # DB, Redis, Environment, AI Client configs
│   ├── controllers/        # Request handling & HTTP response mapping
│   ├── middlewares/        # Auth, Validation, Error Handling, Rate Limiting
│   ├── routes/             # Express routing tables
│   ├── services/           # Business logic & Database queries
│   ├── utils/              # Custom AppErrors, Logger, Formatters
│   ├── types/              # Global TypeScript interfaces & type extensions
│   └── server.ts           # Application entry point
├── tests/                  # Integration & Unit tests (Jest + Supertest)
├── .env                    # Environment variables
├── docker-compose.yml      # Local multi-container orchestration
├── Dockerfile              # Multi-stage production build container
├── tsconfig.json           # Strict TypeScript configuration
└── package.json            # Dependencies & npm scripts
```

---

## 3. Daily Execution Roadmap

---

### PHASE 1: Core Infrastructure & Relational Schema (Days 1–10)

#### Day 1: TypeScript Server Setup & Environment Shell
- **Theory (45m):** Node.js Runtime, Event Loop mechanics, Modern TS compilation (`tsx` vs deprecated `ts-node-dev`).
- **Coding Tasks (2h):**
  - Initialize Node project, Git, `.gitignore`, `.env`.
  - Configure `tsconfig.json` with strict options (`rootDir: "./src"`, `outDir: "./dist"`).
  - Install dependencies: `express`, `typescript`, `tsx`, `@types/node`, `@types/express`.
  - Configure `"dev": "tsx watch src/server.ts"` script.
  - Build modular folder structure (`/src/controllers`, `/routes`, `/services`, `/config`, `/middlewares`).
  - Write `/health` endpoint returning server uptime, status, and ISO timestamp.
- **DoD (45m):** GET request to `http://localhost:5000/health` returns `200 OK` JSON; code committed.

#### Day 2: PostgreSQL Integration & Prisma ORM Schema
- **Theory (45m):** Relational DBs vs NoSQL, ACID transactions, ORM vs Raw Query trade-offs.
- **Coding Tasks (2h):**
  - Spin up PostgreSQL via Docker (`docker run --name saasify-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres`).
  - Install Prisma CLI (`npm i -D prisma`), run `npx prisma init`.
  - Define `User` model (`id`, `email`, `password`, `name`, `role` enum [CLIENT, FREELANCER, ADMIN]) in `prisma/schema.prisma`.
  - Execute migration: `npx prisma migrate dev --name init_users`.
  - Create singleton client in `src/config/db.ts`.
  - Update `/health` endpoint to run a ``prisma.$queryRaw`SELECT 1` `` check.
- **DoD (45m):** `/health` verifies database responsiveness; code committed.

#### Day 3: Centralized Error Handling & Schema Validation
- **Theory (45m):** Operational vs Programmer errors, Express error middleware execution order, Data validation with Zod.
- **Coding Tasks (2h):**
  - Create custom `AppError` class extending native `Error` (`statusCode`, `isOperational`).
  - Write global error middleware (`src/middlewares/errorMiddleware.ts`) to handle Zod errors, Prisma errors, and unknown crashes.
  - Install `zod`. Write generic validation middleware: `validateRequest(schema)`.
  - Create `auth.schema.ts` defining Zod schemas for User Signup/Login requests.
- **DoD (45m):** Invalid request bodies return clean `400 Bad Request` JSON error arrays; unhandled promise rejections return formatted `500` responses without server crashes.

#### Day 4: Authentication Core — User Registration & Password Hashing
- **Theory (45m):** Cryptographic hashing, salting, `bcrypt` iterations, Service-Controller architectural separation.
- **Coding Tasks (2h):**
  - Install `bcryptjs` and `@types/bcryptjs`.
  - Create `auth.service.ts`: Implement `registerUser(dto)` logic (check existing email, hash password, create DB record).
  - Create `auth.controller.ts`: Connect HTTP body validation to `auth.service.ts`.
  - Create `auth.routes.ts`: Map `POST /api/v1/auth/register`.
  - Mount routes in `server.ts`.
- **DoD (45m):** Successful registration stores hashed passwords in Postgres; duplicate email returns `409 Conflict`.

#### Day 5: Authentication Core — JWT Tokens & HttpOnly Cookies
- **Theory (45m):** JWT architecture (Header, Payload, Signature), Access vs Refresh tokens, XSS & CSRF defense strategies.
- **Coding Tasks (2h):**
  - Install `jsonwebtoken`, `@types/jsonwebtoken`, `cookie-parser`, `@types/cookie-parser`.
  - Write utility functions to sign Short-Lived Access Tokens (15m) and Long-Lived Refresh Tokens (7d).
  - Implement `POST /api/v1/auth/login`: Verify password, set Refresh Token in `HttpOnly`, `SameSite=Strict` cookie, return Access Token in JSON body.
  - Implement `POST /api/v1/auth/refresh`: Read cookie, verify Refresh Token, issue new Access Token.
- **DoD (45m):** Login returns valid JWT payload and securely attached cookie; refresh rotation works correctly.

#### Day 6: Auth Middleware & Role-Based Access Control (RBAC)
- **Theory (45m):** HTTP Bearer Authentication headers, Express Request object extension in TypeScript, Authorization guards.
- **Coding Tasks (2h):**
  - Create `src/types/express.d.ts` to extend `Express.Request` interface with `user?: { id: string, role: string }`.
  - Build `protect` middleware: Extract Bearer token, verify JWT signature, attach user payload to `req.user`.
  - Build `restrictTo(...roles)` middleware guard.
  - Create protected route `GET /api/v1/users/me` returning current user profile.
- **DoD (45m):** Unauthenticated requests fail with `401 Unauthorized`; non-matching roles fail with `403 Forbidden`.

#### Day 7: Complex Relational Modeling (Projects, Proposals & Contracts)
- **Theory (45m):** Foreign Keys, One-to-Many & One-to-One relations, Cascade deletes, Database ERD design.
- **Coding Tasks (2h):**
  - Update `schema.prisma` with new models:
    - `Project` (Client ID, Title, Description, Budget, Status [OPEN, IN_PROGRESS, COMPLETED]).
    - `Proposal` (Project ID, Freelancer ID, CoverLetter, BidAmount, Status).
    - `Contract` (Project ID, Client ID, Freelancer ID, TotalAmount, Status [ESCROW_HOLD, RELEASED, DISPUTED]).
  - Execute migration: `npx prisma migrate dev --name add_marketplace_models`.
- **DoD (45m):** Migration succeeds; Prisma client updates with auto-generated relational query helpers.

#### Day 8: Relational CRUD & Prisma Query Optimization
- **Theory (45m):** N+1 Query Problem, Prisma `include` vs `select`, Cursor vs Offset Pagination.
- **Coding Tasks (2h):**
  - Build `project.service.ts` & `project.controller.ts`.
  - Implement `POST /api/v1/projects` (Client creates project).
  - Implement `GET /api/v1/projects` with Pagination (`page`, `limit`), Sorting, and Filter by status/budget.
  - Implement `POST /api/v1/projects/:id/proposals` (Freelancer submits bid).
- **DoD (45m):** Paginated project search responds in <50ms with populated client info without N+1 fetch bottlenecks.

#### Day 9: Database Transactions & Escrow State Engine
- **Theory (45m):** ACID guarantees in financial flows, Database Row Locking, Interactive Transactions in Prisma.
- **Coding Tasks (2h):**
  - Build `contract.service.ts`.
  - Implement `createContractAndFundEscrow(projectId, proposalId)` using `prisma.$transaction`:
    1. Lock Project & verify status is `OPEN`.
    2. Create `Contract` record with status `ESCROW_HOLD`.
    3. Update `Project` status to `IN_PROGRESS`.
    4. Update winning `Proposal` status to `ACCEPTED`.
- **DoD (45m):** If any sub-operation fails, all database changes rollback automatically; zero partial states.

#### Day 10: Indexing & Database Performance Profiling
- **Theory (45m):** Database B-Tree Indexes, Composite Indexes, Query Execution Plans (`EXPLAIN ANALYZE`).
- **Coding Tasks (2h):**
  - Add indexes to `schema.prisma`: `@@index([status])`, `@@index([clientId])`, `@@index([freelancerId])`.
  - Add composite index to Proposals: `@@index([projectId, freelancerId])`.
  - Run migration: `npx prisma migrate dev --name add_indexes`.
  - Seed database with 10,000 dummy projects using a seed script (`prisma/seed.ts`).
  - Benchmark query performance before and after indexes using raw SQL execution timing logs.
- **DoD (45m):** Search query execution time drops significantly on indexed fields over 10,000 records.

---

### PHASE 2: Caching, Async Tasks & Real-Time WebSockets (Days 11–18)

#### Day 11: Redis Infrastructure & Connection Setup
- **Theory (45m):** In-memory data structures, Cache eviction policies (LRU), Redis key namespacing strategies.
- **Coding Tasks (2h):**
  - Spin up Redis via Docker (`docker run --name saasify-redis -p 6379:6379 -d redis:alpine`).
  - Install `ioredis` and `@types/ioredis`.
  - Create singleton connection client in `src/config/redis.ts`.
  - Add Redis ping/pong connectivity test to `/health` endpoint.
- **DoD (45m):** Server successfully connects to Redis on startup; `/health` reports PostgreSQL and Redis as `healthy`.

#### Day 12: Cache-Aside Pattern Implementation
- **Theory (45m):** Cache-Aside pattern, Cache Invalidation, TTL (Time-To-Live) management, Cache Stampede prevention.
- **Coding Tasks (2h):**
  - Create reusable `cacheService.ts` (`get`, `set`, `del`, `delPattern`).
  - Update `GET /api/v1/projects/:id`:
    1. Check Redis for key `project:{id}`.
    2. If hit: return cached JSON immediately.
    3. If miss: fetch from Postgres, store in Redis with 15-minute TTL, return data.
  - Implement cache invalidation when a project is updated or deleted.
- **DoD (45m):** Subsequent project detail requests hit Redis with <5ms latency.

#### Day 13: Distributed Rate Limiting Middleware
- **Theory (45m):** Token Bucket & Sliding Window algorithms, API Denial of Service defense.
- **Coding Tasks (2h):**
  - Install `express-rate-limit` and `rate-limit-redis`.
  - Create global rate limiter middleware (e.g., max 100 requests per 15 mins per IP).
  - Create strict rate limiter for Auth routes (`POST /api/v1/auth/login`, max 5 attempts per 15 mins).
- **DoD (45m):** Exceeding rate limits returns HTTP `429 Too Many Requests` with a `Retry-After` header.

#### Day 14: Asynchronous Processing with BullMQ
- **Theory (45m):** Producer-Consumer pattern, Message Queues vs HTTP, Job Retry strategies, Dead Letter Queues (DLQ).
- **Coding Tasks (2h):**
  - Install `bullmq`.
  - Create queue instance `emailQueue` in `src/config/queues.ts`.
  - Create `emailWorker.ts` process to handle incoming background jobs.
  - Define job processor for `SEND_WELCOME_EMAIL` and `SEND_CONTRACT_ALERT`.
- **DoD (45m):** Enqueueing a job returns instantly to the HTTP caller while the worker processes the job asynchronously in the background.

#### Day 15: Background Jobs — Automated Invoice Generation
- **Theory (45m):** Heavy I/O offloading, PDF generation in Node.js, Stream-based handling.
- **Coding Tasks (2h):**
  - Install `pdfkit` and `@types/pdfkit`.
  - Create `invoiceQueue` and `invoiceWorker.ts`.
  - Trigger job when a Contract Escrow is released:
    1. Worker fetches Contract & User details.
    2. Generates PDF receipt stream.
    3. Saves PDF to local storage `/uploads/invoices/`.
- **DoD (45m):** Releasing escrow queues PDF invoice generation without delaying the API response thread.

#### Day 16: Socket.io Integration & Authenticated Gateway
- **Theory (45m):** WebSockets vs HTTP Polling, Stateful connection handshakes, WebSocket Authentication with JWT.
- **Coding Tasks (2h):**
  - Install `socket.io`.
  - Attach Socket.io server to Express HTTP server in `src/server.ts`.
  - Write Socket authentication middleware: Intercept connection handshake, verify JWT in `auth.token`, attach `user` to socket instance.
  - Create room joining logic (`socket.join("user_" + userId)`).
- **DoD (45m):** Unauthenticated WebSocket connection attempts are rejected; valid tokens establish persistent WS connections.

#### Day 17: Real-Time Negotiation Chat Engine
- **Theory (45m):** Room-based broadcasting, Persistence strategy for real-time messages, Hybrid WS + DB flow.
- **Coding Tasks (2h):**
  - Add `Message` model to `schema.prisma` (`contractId`, `senderId`, `content`, `createdAt`). Migrate DB.
  - Create Socket event listeners: `join_contract_room`, `send_message`.
  - When `send_message` fires:
    1. Persist message to PostgreSQL.
    2. Broadcast payload to room `contract_{contractId}` using `io.to().emit("receive_message")`.
- **DoD (45m):** Two client connections in the same contract room exchange messages in real-time with automatic DB persistence.

#### Day 18: Gemini AI Integration — Milestone Roadmap Generator
- **Theory (45m):** LLM API integration, Prompt Engineering for Structured JSON outputs, Temperature & Schema enforcement.
- **Coding Tasks (2h):**
  - Install `@google/genai` (Google Gen AI SDK).
  - Create `src/config/ai.ts` initializing Gemini client with API key.
  - Create `ai.service.ts`: Implement `generateProjectMilestones(description, budget)`.
  - Prompt Gemini to return a strict JSON array of milestone deliverables, estimated hours, and suggested payout splits.
  - Create route `POST /api/v1/ai/generate-milestones` guarded by Auth middleware.
- **DoD (45m):** Sending a raw project description returns structured JSON milestones generated by Gemini AI.

---

### PHASE 3: Next.js Frontend, AI Agents & Testing (Days 19–30)

#### Day 19: Gemini AI Integration — Automated Contract Audit Agent
- **Theory (45m):** AI Content Moderation, Semantic verification, Guardrails against malicious inputs.
- **Coding Tasks (2h):**
  - Implement `auditContractTerms(contractDetails)` in `ai.service.ts`.
  - Send contract scope to Gemini to check for legal loopholes, unrealistic deadlines, or vague deliverables.
  - Attach automated risk score (`LOW`, `MEDIUM`, `HIGH`) and suggestions before Client approves Escrow.
- **DoD (45m):** API returns AI-generated risk assessment report alongside Contract creation.

#### Day 20: Backend Testing Infrastructure (Jest & Supertest)
- **Theory (45m):** Unit vs Integration testing, Test Databases, Environment isolation, Mocking vs Real DB assertions.
- **Coding Tasks (2h):**
  - Install `jest`, `supertest`, `ts-jest`, `@types/jest`, `@types/supertest`.
  - Create `jest.config.ts`. Set up test environment variables (`DATABASE_URL` pointing to test DB).
  - Write helper `setupTestDB.ts` to clear tables before each test suite.
  - Write auth integration test: `tests/integration/auth.test.ts` (Register, Login, Duplicate registration).
- **DoD (45m):** Running `npm test` executes tests and passes cleanly in isolated environment.

#### Day 21: Unit Testing Services & Mocking
- **Theory (45m):** Test Isolation, Mocking dependencies (`jest.mock`), Testing business logic independently.
- **Coding Tasks (2h):**
  - Create unit tests for `ai.service.ts` mocking Gemini API response.
  - Create unit tests for `contract.service.ts` testing Escrow status state machine transitions.
- **DoD (45m):** Test suite achieves >70% code coverage on service layer logic.

#### Day 22: Next.js App Router Scaffold & Tailwind Setup
- **Theory (45m):** Next.js App Router, Server Components (RSC) vs Client Components, Hybrid rendering architecture.
- **Coding Tasks (2h):**
  - In root directory, create Next.js app: `npx create-next-app@latest saasify-frontend --typescript --tailwind --app`.
  - Install UI components via `shadcn/ui`.
  - Configure API client utility (`axios` or `fetch` wrapper with base URL and credentials config).
- **DoD (45m):** Next.js frontend boots locally; clean layout template ready.

#### Day 23: Authentication UI & State Management
- **Theory (45m):** Form management, Client-side validation with Zod + React Hook Form, Storing tokens securely.
- **Coding Tasks (2h):**
  - Install `react-hook-form`, `@hookform/resolvers`, `zod`.
  - Build `Login` and `Register` pages under `/app/(auth)/login` and `/app/(auth)/register`.
  - Handle submission: Post to Express backend, capture Access token in memory/state, handle HttpOnly refresh cookie.
- **DoD (45m):** User can register and log in via UI; invalid fields show instant validation feedback.

#### Day 24: Data Fetching with TanStack Query (React Query)
- **Theory (45m):** Client-side caching, Stale-while-revalidate pattern, Optimistic updates.
- **Coding Tasks (2h):**
  - Install `@tanstack/react-query`.
  - Wrap app in `QueryClientProvider`.
  - Create custom hook `useProjects()` to fetch project feeds from Express backend.
  - Build Project Feed Dashboard UI displaying project cards with search/filter controls.
- **DoD (45m):** Project feed renders dynamically with automatic revalidation and caching.

#### Day 25: Escrow Dashboard & Payment Flow UI
- **Theory (45m):** Complex stateful dashboards, Visualizing workflow states (Open → In Progress → Escrow Released).
- **Coding Tasks (2h):**
  - Build `/dashboard/contracts/[id]` page.
  - Render contract details, status badge, and milestone checklist.
  - Add "Release Escrow" action button triggering backend state transaction.
- **DoD (45m):** Client can view contract status and click release button to update status live across frontend and backend.

#### Day 26: Real-Time UI Integration (Socket.io Client)
- **Theory (45m):** Client-side socket connection lifecycles, Reconnection logic, Cleaning up event listeners in `useEffect`.
- **Coding Tasks (2h):**
  - Install `socket.io-client`.
  - Build Chat Component embedded inside Contract Dashboard.
  - Connect socket, join contract room, display message thread, handle real-time incoming message appends.
- **DoD (45m):** Messages typed by user update target user's screen instantly without full page reloads.

#### Day 27: AI Assistant Interface
- **Theory (45m):** Streaming vs Polling AI outputs, Rendering markdown/structured JSON, Interactive prompt UI.
- **Coding Tasks (2h):**
  - Build "AI Project Assistant" component inside Project Creation form.
  - User inputs brief text → calls `/api/v1/ai/generate-milestones` → UI populates interactive milestone list.
- **DoD (45m):** Client clicks "Generate Milestones" and UI populates pre-filled milestone fields powered by Gemini AI.

#### Day 28: Production Multi-Stage Dockerization
- **Theory (45m):** Docker layer caching, Multi-stage builds, Minimizing production image size.
- **Coding Tasks (2h):**
  - Write production `Dockerfile` for backend (Stage 1: Build TS to JS; Stage 2: Copy `dist` and install production-only node_modules).
  - Create root `docker-compose.yml` orchestrating: `postgres`, `redis`, `backend`, `frontend`.
- **DoD (45m):** Running `docker-compose up --build` launches the full stack cleanly from scratch.

#### Day 29: CI/CD Pipeline with GitHub Actions
- **Theory (45m):** Continuous Integration, Automated linting & testing gates, Secrets management.
- **Coding Tasks (2h):**
  - Create `.github/workflows/ci.yml`.
  - Configure workflow steps:
    1. Checkout code.
    2. Setup Node.js.
    3. Spin up Postgres & Redis service containers in GitHub Actions runner.
    4. Run `npm ci`, `npx prisma migrate reset --force`, `npm run lint`, `npm test`.
- **DoD (45m):** Pushing code to GitHub triggers Action pipeline; pull requests block merge if tests fail.

#### Day 30: Cloud Deployment & Production Polish
- **Theory (45m):** Production cloud environments (Render/Railway/AWS), SSL certificates, Production CORS policies.
- **Coding Tasks (2h):**
  - Deploy PostgreSQL & Redis on Render/Railway/Managed Cloud.
  - Deploy Express Backend service with production env vars.
  - Deploy Next.js Frontend to Vercel.
  - Test end-to-end cloud flow (User Auth → Create Project → Generate AI Milestones → Escrow Contract → Real-time Chat).
- **DoD (45m):** Production live URL working end-to-end; portfolio links and repository README completed with architectural overview.

---

## 4. Phase 4: Interview Preparation Roadmap (Days 31–50)

Once your full-stack SaaSify product is live and deployed, switch entirely to technical interview preparation for 2 hours/day while maintaining 1.5 hours of system design study.

### Days 31–40: Data Structures & Algorithms (NeetCode 150)
- Arrays & Hashing (3 days)
- Two Pointers & Sliding Window (3 days)
- Trees, Binary Search & Graphs (4 days)

### Days 41–45: Low-Level Design (LLD) & Machine Coding
- SOLID Principles & OOP Design Patterns (Strategy, Observer, Factory, Singleton)
- Practice 90-Minute Machine Coding: Design Parking Lot / Splitwise in-memory in TypeScript

### Days 46–50: High-Level System Design (HLD)
- Load Balancers, Horizontal Scaling, Database Sharding & Read Replicas
- Deep Dive: How to scale SaaSify to handle 100,000 concurrent WebSocket connections & DB writes

---

## 5. Resumption Instructions for AI Assistance

If this conversation history is ever reset, deleted, or cleared, copy and paste the following block into the prompt window along with your latest `ROADMAP.md` status to resume immediately:

```text
[CONTEXT RESUMPTION REQUEST]
I am continuing my 3.5 hour/day engineering roadmap to land a Tier-1/Tier-2 Product Engineer role (SDE-2).
I am building "SaaSify" (AI-Powered Freelance & Escrow Marketplace API).

My current stack: TypeScript, Node.js (Express), PostgreSQL, Prisma ORM, Redis, BullMQ, Socket.io, Next.js, Gemini AI, Docker.

Please read my MASTER_EXECUTION_PLAN.md file.
Today I am ready for [INSERT DAY NUMBER, e.g., Day 3].

Give me today's exact step-by-step action items including:
1. Block 1: Theory & Architecture focus (45m)
2. Block 2: Pure Execution & Code snippets (2h)
3. Block 3: Verification, Standup & Commit tasks (45m)
```
