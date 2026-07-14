# Architecture Decision Records — AI Chess Platform

## Purpose

Architecture Decision Records (ADRs) document significant architectural choices, their context, alternatives considered, and consequences. They provide a historical record of why the system is built the way it is.

## How to Use

1. Each decision gets a sequential ID (`ADR-001`, `ADR-002`, etc.)
2. Decisions are never deleted — only superseded (status: `superseded`)
3. When adding a new decision, cross-reference any ADRs it affects
4. Link relevant decisions in `ARCHITECTURE.md` and code comments

## Status Definitions

| Status | Meaning |
|---|---|
| **Accepted** | Decision has been made and is in effect |
| **Proposed** | Under discussion, not yet implemented |
| **Deprecated** | Still in effect but should not be used for new work |
| **Superseded** | Replaced by a newer ADR |
| **Rejected** | Considered and explicitly not chosen |

## Categories

| Category | Prefix | Example |
|---|---|---|
| Architecture | `ARCH-` | ADR-003: Zustand over Context |
| Security | `SEC-` | ADR-006: Gemini output validation |
| Performance | `PERF-` | ADR-004: Stockfish in Web Worker |
| Chess | `CHESS-` | ADR-001: chess.js as source of truth |
| AI | `AI-` | ADR-002: Gemini never decides moves |
| Testing | `TEST-` | ADR-010: Vitest + Playwright |
| Deployment | `DEPLOY-` | ADR-009: Vercel |
| Tooling | `TOOL-` | ADR-008: TypeScript strict mode |

---

## ADR-001: chess.js as Game State Source of Truth

- **Status:** Accepted
- **Category:** CHESS
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

The platform needs a reliable chess engine for move validation, legal move generation, FEN↔PGN conversion, and game state tracking. The options were building custom chess logic or using an existing library.

### Decision

Use **chess.js** as the authoritative source of truth for all chess game state. Wrap it behind a pure-function API in `lib/chess/engine.ts` so no component or store calls chess.js directly.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Custom chess logic | High risk of bugs in move generation, en passant, castling, promotion edge cases. chess.js is battle-tested. |
| Stockfish for validation | Stockfish is an engine (search + eval), not a move validator. Overkill and couples validation to engine availability. |
| `@mliebelt/pgn-reader` | PGN-only, no move generation or FEN support. |

### Consequences

- All chess state queries go through chess.js — consistent, tested, no duplication
- Wrapping in `lib/chess/` means chess.js can be replaced with a different library without touching any React code
- chess.js is synchronous and lightweight (~28 KB gzip)
- We must handle chess.js's mutability carefully — always clone or recreate Chess instance for undo

### References

- `ARCHITECTURE.md` — Module Architecture section
- `TECH_STACK.md` — Chess section
- `FOLDER_STRUCTURE.md` — `lib/chess/` directory
- `CODING_STANDARDS.md` — Pure functions guideline

---

## ADR-002: Gemini Never Decides Chess Moves

- **Status:** Accepted
- **Category:** AI
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Using an LLM for chess commentary creates a critical risk: the LLM might suggest moves, which could be incorrect or harmful to the user's learning. This platform positions Stockfish as the authority.

### Decision

Gemini is **strictly limited to commentary, analysis, and chat**. It never outputs moves, evaluates positions numerically, or recommends specific moves. This is enforced at three layers:
1. Prompt engineering — system prompt explicitly forbids move output
2. Output validation — regex-based rejection of move notation
3. Monitoring — rejected responses logged for analysis

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Allow Gemini to suggest moves with disclaimer | Blurs the line between engine and AI. Users may trust a "move suggestion" from a conversational AI. Liability risk. |
| No AI commentary at all | Eliminates the platform's primary differentiator. |

### Consequences

- Gemini commentary is purely analytical / educational, never prescriptive
- The output validation layer (`lib/ai/validation.ts`) must be maintained and tested as a security-critical module
- Users asking "what should I play?" get strategic advice, not a move — may frustrate some users

### References

- `SECURITY.md` — Gemini API Security section (three-layer enforcement)
- `AI_GUIDELINES.md` — Gemini responsibilities
- `PROMPT_ENGINEERING.md` — Prompt templates
- `CLAUDE.md` — "Things Claude Should NEVER Do" rule #2

---

## ADR-003: Zustand for State Management

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

The platform has complex, interconnected state: game position, move history, engine evaluation, user settings, analysis session. This state is read and written from both React components and non-React code (Stockfish Worker callbacks).

### Decision

Use **Zustand** with sliced stores. No Redux, no Context API.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Redux Toolkit | Excessive boilerplate for a client-only app. Would need reducers, actions, selectors, slices ceremony. |
| React Context | Causes re-renders in all consumers when any value changes. Zustand's selector-based subscriptions avoid this. |
| Jotai / Recoil | Good for atomic state, but chess state is naturally slice-shaped (game / engine / settings / analysis). |
| XState | State machines are a good fit for game lifecycle, but added complexity for Zustand's simpler API. We use manual state machines in `lib/chess/game.ts` instead. |

### Consequences

- Stores are framework-agnostic — can be imported in Workers and pure functions via `getState()`
- No `Provider` needed at root level — simpler setup
- Persistence middleware for settings store
- Each store independently testable

### References

- `ARCHITECTURE.md` — State Management Architecture section
- `TECH_STACK.md` — State Management section
- `FOLDER_STRUCTURE.md` — `lib/store/` directory

---

## ADR-004: Stockfish in Web Worker

- **Status:** Accepted
- **Category:** PERF
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Stockfish's search algorithm is CPU-intensive. Searching at depth 18 can take 1-3 seconds, during which the main thread would be blocked, freezing drag-and-drop, animations, and input handling.

### Decision

Run Stockfish in a **dedicated Web Worker** (separate OS thread). Communication with the main thread happens via `postMessage` / UCI protocol.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Main thread execution | Blocks UI entirely during search. Unacceptable for drag-and-drop interaction. |
| Server-side engine | Adds latency, cost, and requires backend infrastructure. WASM runs locally. |
| setTimeout chunking | Only defers the freeze; doesn't solve it. Worker is the proper solution. |

### Consequences

- UI remains responsive during engine search
- Worker has no DOM access — inherently secure
- Worker lifecycle must be managed (init, crash recovery, termination)
- WASM binary must be served correctly (CORS, MIME types, caching)

### References

- `ARCHITECTURE.md` — Web Worker Architecture section
- `PERFORMANCE.md` — Stockfish Web Worker section
- `PERFORMANCE.md` — Optimizations table

---

## ADR-005: No Backend in MVP

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Building a backend (API server, database, authentication) before validating the core product experience adds significant time and cost. The core features (game play, Stockfish analysis, Gemini commentary) can all run client-side.

### Decision

The MVP is **100% client-side**. No backend, no database, no API routes. Game state persists in localStorage. Stockfish runs in a Web Worker. Gemini runs via browser SDK.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Full-stack from day one | Slows iteration on the core experience. Infrastructure is distraction pre-PMF. |
| BaaS (Firebase / Supabase) | Added complexity for unvalidated features. Can be added later. |

### Consequences

- Zero server costs for MVP
- Works offline (after initial load)
- No signup friction — "Play" → immediate game
- Future migration path: add accounts + cloud sync as optional features
- Game data is device-local — must export PGN to transfer

### References

- `ARCHITECTURE.md` — Key Design Decisions (No backend for core play)
- `DATABASE_PLAN.md` — Why No Database in MVP section
- `API_DESIGN.md` — Introduces the "Future" qualifier throughout

---

## ADR-006: Three-Layer Gemini Output Validation

- **Status:** Accepted
- **Category:** SEC
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Prompt injection is a known risk with LLM APIs. An adversarial user could craft prompts that trick Gemini into outputting chess moves, violating the platform's core rule. A single layer of defense (prompt engineering) is insufficient.

### Decision

Implement **three independent layers** of defense:

1. **Prompt engineering** — system prompt explicitly forbids move output
2. **Output validation** — regex-based rejection before content reaches UI
3. **Monitoring** — rejected responses logged for pattern analysis

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Only prompt engineering | Single point of failure. Prompt injections can bypass instructions. |
| Only output validation | False positives (valid commentary that mentions "knight to f3" as a historical example). |

### Consequences

- Defense in depth protects against prompt injection
- Output validation must be carefully tuned to avoid false positives (e.g., "Smith-Morra Gambit" contains notation-like patterns)
- Rejected responses are silently dropped + logged — user sees a fallback message

### References

- `SECURITY.md` — Gemini API Security section
- `AI_GUIDELINES.md` — Safety rules
- `CLAUDE.md` — Rule #10: Never bypass Gemini output validation

---

## ADR-007: Server Components for Content Routes

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Next.js App Router supports both Server Components (static/SSR) and Client Components. Chess interaction requires Client Components (event handlers, hooks, state), but content pages (landing, about) benefit from static generation.

### Decision

Use Server Components for content routes (landing, puzzles index) and Client Components for interactive routes (play, analysis, settings). Rendering strategy per route:

| Route | Strategy | Rationale |
|---|---|---|
| `/` | Static (RSC) | Content rarely changes, instant load |
| `/play` | Client | Drag-and-drop, canvas, real-time interaction |
| `/analysis` | Client | Stockfish Worker, dynamic updates |
| `/puzzles` | Static + Client island | Puzzle data static, solver interactive |
| `/settings` | Client | Persistent UI state |

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Everything client-side | Slower initial load for content pages. Doesn't leverage RSC benefits. |
| Everything SSR | Over-engineered for content pages. Static generation is cheaper and faster. |

### Consequences

- Landing page is instant (static HTML)
- Interactive pages may show a brief loading state (JS bundle fetch)
- Clear separation: if it needs `useState` / `useEffect` / event handlers, it's Client Component

### References

- `ARCHITECTURE.md` — Rendering Strategy table
- `CLAUDE.md` — Architecture Rules: business logic never in UI components

---

## ADR-008: TypeScript Strict Mode with No `any`

- **Status:** Accepted
- **Category:** TOOL
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

TypeScript's strict mode catches null references, implicit any, and other common JavaScript errors at compile time. Relaxing strictness for speed would accumulate technical debt.

### Decision

`strict: true` in tsconfig.json.  No `any` — use `unknown` and narrow with type guards. No `// @ts-ignore` or `// ts-expect-error`.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Loose mode | Unsafe access to null/undefined, implicit any defeats type checking |
| Strict with `@ts-ignore` exceptions | Annotates technical debt that never gets cleaned up |

### Consequences

- Null/undefined errors caught at compile time, not runtime
- Refactoring is safer — type checker validates entire codebase
- Learning curve for junior developers
- Requires disciplined type definitions (branded types for FEN/PGN)

### References

- `CODING_STANDARDS.md` — Strictness section
- `CLAUDE.md` — Rule #6: Never use `any`

---

## ADR-009: Vercel for Deployment

- **Status:** Accepted
- **Category:** DEPLOY
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

The platform is built with Next.js. Deployment options include Vercel (first-party), Netlify, Cloudflare Pages, AWS Amplify, and self-hosted.

### Decision

Deploy on **Vercel** due to zero-config Next.js support, preview deployments, CDN, and seamless environment variable management.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Netlify | Requires `next-on-netlify` adapter — adds complexity, slower builds |
| Cloudflare Pages | Edge limitations with WASM Workers |
| Self-hosted (Docker) | Operational overhead for a single-page app. No benefit over managed. |

### Consequences

- Automatic preview deploys per branch
- Built-in analytics and CDN
- WASM binary needs correct caching headers (see `vercel.json`)
- Vercel lock-in — migration would require effort

### References

- `DEPLOYMENT.md` — Complete deployment configuration
- `PERFORMANCE.md` — Image and asset optimization

---

## ADR-010: Vitest + Playwright for Testing

- **Status:** Accepted
- **Category:** TEST
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

The platform requires a testing strategy covering unit tests (pure chess logic, engine parsing, state stores), integration tests (game flows, store + engine pipeline), and E2E tests (user interactions, board drag-and-drop).

### Decision

Use **Vitest** for unit and integration tests, **Playwright** for E2E tests. Co-locate tests with source files.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Jest | Slower, more configuration. Vitest is faster, integrates with Vite. |
| Cypress | Heavier than Playwright for this project. Playwright's API is cleaner for testing canvas/ board interactions. |
| Testing Library + Jest DOM | Included in Vitest setup — not an alternative, a complement. |

### Consequences

- Tests run in Node.js via Vitest (fast, watch mode)
- E2E tests run in real browsers via Playwright
- Coverage targets: 90%+ on `lib/`, 80%+ overall
- Stockfish and Gemini mocked in unit tests, real in integration/manual

### References

- `TESTING_STRATEGY.md` — Full testing plan
- `CONTRIBUTING.md` — Test commands

---

## ADR-011: Lazy-Load Stockfish WASM and Gemini SDK

- **Status:** Accepted
- **Category:** PERF
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Stockfish WASM binary is ~2-5 MB. Gemini SDK is ~50 KB. Loading either on initial page load would increase the bundle and delay first paint.

### Decision

Lazy-load both modules:

- **Stockfish WASM** — loaded when the user first opens analysis or enables engine evaluation
- **Gemini SDK** — loaded when the user first opens the chat panel or commentary triggers

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Preload Stockfish on page load | Blocks initial render with a 2-5 MB download for features not all users need |
| Inline WASM as base64 | Increases bundle size and parse time |

### Consequences

- Initial bundle stays under 150 KB (gzip)
- Stockfish analysis has a short "loading engine" delay on first use (~1s)
- Dynamic imports require careful loading state management (spinner/skeleton during load)

### References

- `PERFORMANCE.md` — Code Splitting Strategy
- `DEPLOYMENT.md` — Stockfish WASM Deployment
- `CLAUDE.md` — Performance Guidelines

---

## ADR-012: Local-First Architecture

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Chess games work offline. Stockfish is local. Gemini commentary is the only feature requiring network connectivity. Users should be able to play and analyze without an internet connection after the initial page load.

### Decision

Design as a **local-first** application:

- Game state in localStorage via Zustand persistence middleware
- Stockfish runs locally (no server round-trip for moves)
- Gemini commentary is optional — degrades gracefully when offline
- Future cloud features (multiplayer, sync) are additive, not required

### Consequences

- Users can play and analyze offline
- Gemini commentary shows "Connect to the internet for AI insights" when offline
- No server costs for core game functionality
- Adds complexity for future sync (reconciliation of local + cloud state)

### References

- `ARCHITECTURE.md` — Key Design Decisions
- `PRODUCT.md` — Core Experience section
- `FUTURE_FEATURES.md` — Cloud Game Sync

---

## ADR-013: Framer Motion for Animations

- **Status:** Accepted
- **Category:** TOOL
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

Chess has natural opportunities for animation: piece slides, capture effects, check indicators, panel transitions, eval bar changes. The platform differentiates on "delightful" UX.

### Decision

Use **Framer Motion** for all animations. Prefer layout animations (`AnimatePresence`, `layoutId`) over imperative CSS transitions.

### Alternatives Considered

| Option | Reason Against |
|---|---|
| CSS transitions + keyframes | Manual state management for enter/exit animations. No layout animation support. |
| react-spring | More physics-focused, less declarative API. |
| CSS `transition` | No orchestration (sequencing, staggered children). |

### Consequences

- Consistent animation programming model across the app
- Framer Motion adds ~30 KB to the bundle (tree-shakeable)
- Reduced-motion `prefers-reduced-motion` must be respected
- Animated piece movement on drag release ("snap to square") for polish

### References

- `ROADMAP.md` — Milestone 18: Animations & Micro-interactions
- `PERFORMANCE.md` — Bundle Optimization (Framer Motion tree-shaken)
- `ACCESSIBILITY.md` — Motion reduction

---

## ADR-014: Branded Types for Domain Primitives

- **Status:** Accepted
- **Category:** TOOL
- **Date:** 2026-07-12
- **Supersedes:** None

### Context

FEN strings and PGN strings are both `string` at runtime, but passing a PGN where a FEN is expected would cause subtle bugs. TypeScript's structural typing doesn't distinguish them.

### Decision

Use **branded types** to distinguish domain primitives at the type level:

```typescript
type FEN = string & { readonly __brand: 'FEN' };
type PGN = string & { readonly __brand: 'PGN' };
```

### Alternatives Considered

| Option | Reason Against |
|---|---|
| Just `string` | Runtime bugs when wrong string type is passed |
| Wrapper classes | Runtime overhead, more complex than branded types. |
| `type` aliases without branding | Same problem — TypeScript structural typing treats them as interchangeable strings. |

### Consequences

- Compile-time safety: passing a PGN to a function expecting FEN is a type error
- Lightweight — zero runtime cost (compile-time only)
- Requires conversion functions at module boundaries (parseFEN, toPGN)
- Developers must be aware of the branding pattern

### References

- `CODING_STANDARDS.md` — Type Definitions section

---

## ADR-015: React 19 Server Components for Content, Client Components for Interaction

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-12
- **Supersedes:** ADR-007

### Context

Next.js 16 with React 19 supports Server Components by default. The distinction between server and client boundaries affects component architecture, data loading, and bundle size.

### Decision

Adopt a **"client boundary at the lowest possible level"** approach:

- Page layouts and data fetching are Server Components by default
- Interactive components (ChessBoard, GameControls, ChatPanel) are Client Components
- Client Components import Server Components, not vice versa
- `"use client"` is added to the leaf component, not its parent

### Consequences

- Server Components reduce client-side JS bundle
- "use client" at leaf level means layout components remain server-rendered
- Event handlers and lifecycle hooks (useState, useEffect) stay in leaf components
- Zustand stores are imported only in Client Components that need them

### References

- `ARCHITECTURE.md` — Rendering Strategy
- `CODING_STANDARDS.md` — Component Patterns

---

## ADR-019: AI Submodule Separation — Six Independent Modules Over a Monolithic `lib/ai/`

- **Status:** Accepted
- **Category:** ARCH
- **Date:** 2026-07-14
- **Supersedes:** None

### Context

The AI integration for chess commentary involves multiple distinct responsibilities: defining data shapes, managing personality-driven tone, constructing prompts for Gemini, tracking conversation/game/player memory, assembling context from multiple sources, and formatting/validating Gemini's output.

### Decision

Partition `lib/ai/` into six independent submodules: `types/`, `personalities/`, `prompts/`, `memory/`, `context/`, `formatter/`. Each has a single responsibility, does NOT import from other AI submodules, and exports via `index.ts`.

### Consequences

- Clear dependency direction: `types/` → `personalities/` → `prompts/` → `memory/` → `context/` → `formatter/`
- Each submodule independently testable
- Tree-shakeable imports

### References

- `lib/ai/` — All submodule directories
- `docs/AI_GUIDELINES.md` — Pipeline architecture documentation
- `reports/MILESTONE_07_REPORT.md` — ADR-019 section

---

## ADR-020: Five Personalities as Data, Not Code

- **Status:** Accepted
- **Category:** AI
- **Date:** 2026-07-14
- **Supersedes:** None

### Context

The platform needs multiple commentary personalities (coach, analyst, hype man, etc.) controlling tone, humour, emoji, and reaction templates.

### Decision

Define personalities as plain data objects conforming to the `Personality` interface. NOT as classes, abstract base classes, or strategy pattern implementations.

### Consequences

- Adding a personality = one plain object + one registry entry
- Personality data is serialisable — could be loaded from config in the future
- No runtime polymorphism overhead
- TypeScript guarantees every `ReactionType` has at least one template

### References

- `lib/ai/personalities/personalities.ts` — All 5 built-in personalities
- `lib/ai/personalities/types.ts` — `Personality` interface
- `docs/AI_GUIDELINES.md` — Adding a New Personality section

---

## ADR-021: ConversationTranscript vs ConversationMemory — Pipeline Data vs Storage Shapes

- **Status:** Accepted
- **Category:** AI
- **Date:** 2026-07-14
- **Supersedes:** None

### Context

The same conversation data flows through two contexts: the AI pipeline (context assembly, prompt building, Gemini calls) and memory storage (Zustand/localStorage). The pipeline needs a simple ordered list of messages; storage needs configuration fields like `maxMessages` and `maxAgeMs`.

### Decision

Define two separate interfaces:
- **`ConversationTranscript`** (in `lib/ai/types/`): pipeline-facing, minimal — `{ messages, createdAt, updatedAt }`
- **`ConversationMemory`** (in `lib/ai/memory/types/`): storage-facing — extends with `sessionId`, `messageCount`, config fields

### Consequences

- Pipeline code never imports from `lib/ai/memory/`
- Memory code imports `ConversationTranscript` from `lib/ai/types/`
- Clear boundary between pipeline data shapes and storage shapes

### References

- `lib/ai/types/index.ts` — `ConversationTranscript`
- `lib/ai/memory/types.ts` — `ConversationMemory`, `ConversationMemoryConfig`
- `docs/AI_GUIDELINES.md` — Memory System section
