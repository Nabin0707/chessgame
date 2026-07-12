# Tech Stack — AI Chess Platform

## Core Framework

| Technology | Version | Purpose | Rationale |
|---|---|---|---|
| **Next.js** | 16.x | Application framework | App Router, RSC, file-based routing, Vercel-native |
| **React** | 19.x | UI library | Concurrent features, Server Components, hooks |
| **TypeScript** | 5.x | Type safety | Strict mode, no `any`, full type coverage |
| **Tailwind CSS** | 4.x | Styling | Utility-first, zero-runtime, consistent design |
| **Framer Motion** | latest | Animation | Declarative gestures, layout animations, exit animations |

## Chess

| Technology | Purpose | Why |
|---|---|---|
| **chess.js** | Move generation, validation, FEN/PGN parsing | Gold standard for chess in JS. Lightweight, no dependencies, isomorphic. |
| **react-chessboard** | Board UI (pieces, drag-and-drop, squares) | Most popular React chess board. Handles piece rendering, drag, drop, and touch. |
| **stockfish** (v18, nmrugg) | Chess engine (WebAssembly, single-threaded) | Strongest open-source engine. Lite single-threaded WASM build (~7 MB) via nmrugg/stockfish.js. No pthreads, no SharedArrayBuffer, no special headers. |

**Architecture**: chess.js is the *source of truth* for game state. The board component dispatches user interactions to chess.js via Zustand. Stockfish receives positions from chess.js and returns evaluations — it never modifies game state.

## AI

| Technology | Purpose | Why |
|---|---|---|
| **@google/generative-ai** | Gemini API client | Natural-language commentary, analysis, and chat. Used ONLY for explanation — never for move decisions. |

**Constraint**: Every prompt template in `lib/ai/prompts.ts` explicitly prohibits outputting chess moves. A response validation layer rejects any Gemini output containing UCI notation or algebraic moves before it reaches the UI.

## State Management

| Technology | Purpose | Why |
|---|---|---|
| **Zustand** | Client state management | Minimal boilerplate, no context provider needed, selector-based renders, works outside React (critical for Worker callbacks). |

**Store architecture**: Sliced by domain — `gameStore` (chess state), `engineStore` (Stockfish evaluation), `settingsStore` (user preferences), `analysisStore` (analysis session). Each store is independently imported, tested, and tree-shakeable.

## UI Component Library

| Technology | Purpose |
|---|---|
| **shadcn/ui** | Primitive components (Button, Dialog, Dropdown, Tabs, Tooltip, Card) |
| **@radix-ui/react-*** | Accessible headless primitives (shadcn dependency) |
| **lucide-react** | Icon set |
| **class-variance-authority** | Component variant system (shadcn dependency) |

## Utilities

| Technology | Purpose |
|---|---|
| **clsx + tailwind-merge** | Class name merging (via `cn()`) |
| **date-fns** | Date formatting (clocks, game timestamps) |
| **zod** | Runtime validation (Gemini responses, user input) |
| **react-hook-form** | Form management (settings, PGN import) |
| **sonner** | Toast notifications |
| **cmdk** | Command menu (future: search, keyboard shortcuts) |

## Not Yet Installed

These dependencies will be added during development (Milestone 1):

```bash
npm install chess.js react-chessboard zustand framer-motion
npm install @google/generative-ai
```

**Note**: Stockfish is already installed as `stockfish` v18 (nmrugg). No additional engine packages needed.

## Development Tooling

| Tool | Purpose |
|---|---|
| **ESLint** (flat config) | Static analysis, Next.js + TypeScript rules |
| **Prettier** (recommended) | Code formatting |
| **Vitest** | Unit and integration testing |
| **@testing-library/react** | Component testing |
| **Playwright** | End-to-end testing |
| **Sentry** | Error tracking (production) |
| **Vercel Analytics** | Usage analytics |

## Deployment

| Platform | Purpose |
|---|---|
| **Vercel** | Hosting, CDN, preview deploys |
| **GitHub** | Source control, CI (GitHub Actions) |

## Excluded (By Design)

| Technology | Why Not |
|---|---|
| **Redux** | Too much boilerplate. Zustand covers all our needs with less code |
| **Context API** | Causes unnecessary re-renders. Zustand selectors are more efficient |
| **Server-side chess engine** | Adds latency, cost, and complexity. Stockfish runs locally in a Web Worker |
| **Database** | No user data stored in MVP. Local storage suffices |
| **Next.js API Routes** | No backend needed for core play. Future: auth, sync, multiplayer |
| **Redis / Cache** | Not needed until multiplayer or cloud sync is added |
