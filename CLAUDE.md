# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**AI Chess Platform** — An AI-powered chess experience combining Stockfish (engine) with Gemini (commentary). Built with Next.js 16 App Router, TypeScript, Tailwind CSS v4, and shadcn/ui.

**Goal**: Create the world's most entertaining AI-powered chess experience.

---

## Commands

```bash
npm run dev           # Start Next.js dev server (port 3000)
npm run build         # Production build
npm run start         # Start production server
npm run lint          # Run ESLint (flat config)
npm run typecheck     # Run TypeScript type checking (tsc --noEmit)
npm run test          # Run Vitest unit + integration tests
npm run test:watch    # Tests in watch mode
npm run test:coverage # Tests with coverage report
npm run test:e2e      # Playwright E2E tests
```

---

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 16 (App Router), React 19 |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4, shadcn/ui (New York), CVA, lucide-react |
| Chess | chess.js, react-chessboard, stockfish (v18, nmrugg) |
| AI | @google/generative-ai (Gemini API) |
| State | Zustand (sliced by domain) |
| Animation | Framer Motion |
| Testing | Vitest, @testing-library/react, Playwright |
| Deployment | Vercel |
| Error Tracking | Sentry (future) |

---

## Project Rules

### Chess Engine Rules (CRITICAL)
- **Stockfish is the ONLY chess engine.** Never introduce a second engine.
- **Gemini NEVER decides chess moves.** Gemini provides context, commentary, and analysis — never moves.
- **Never modify Stockfish evaluation output.** Display it as-is. No handicapping, no adjusting.
- **Stockfish runs in a Web Worker.** Never on the main thread.

### Stockfish Integration (nmrugg/stockfish.js v18)

**Package:** [`stockfish`](https://www.npmjs.com/package/stockfish) by nmrugg (Stockfish 18, lite-single build)

**Build used:** `stockfish-18-lite-single` — single-threaded, ~7 MB WASM, no COOP/COEP headers needed, no SharedArrayBuffer required. The lite build is recommended: "far stronger than any human will ever be."

**Engine files (auto-copied to `public/stockfish/` via `scripts/copy-stockfish.mjs`):**
- `stockfish.js` (Worker entry point — IS the worker script itself)
- `stockfish.wasm` (WASM binary)

**Worker URL:** `/stockfish/stockfish.js` (served as static asset by Next.js)

**Communication protocol — Raw UCI over Worker messages:**
```
Main thread                        Worker (stockfish.js)
    │                                    │
    │── postMessage("uci") ──────────────→│
    │←── onmessage("uciok") ←─────────────│
    │── postMessage("isready") ──────────→│
    │←── onmessage("readyok") ←───────────│
    │── postMessage("position fen ...") →│
    │── postMessage("go depth 15") ─────→│
    │←── onmessage("info score cp 45") ←─│
    │←── onmessage("bestmove e2e4") ←────│
    │── postMessage("stop") ────────────→│
```

**Available Stockfish builds (in `node_modules/stockfish/bin/`):**
| Build | Size | Threads | Requires COOP/COEP |
|---|---|---|---|
| `stockfish-18` | 108 MB | Multi | ✅ Yes |
| `stockfish-18-single` | 108 MB | Single | ❌ No |
| `stockfish-18-lite` | 7 MB | Multi | ✅ Yes |
| `stockfish-18-lite-single` | 7 MB | Single | ❌ No |
| `stockfish-18-asm` | 11 MB | Single | ❌ No (no WASM) |
| `stockfish-18-lite-single` is the CURRENT choice. |

**How the Worker works (stockfish.js internals):**
- The `.js` file IS the worker — create with `new Worker("/stockfish/stockfish.js")`
- On load, it auto-detects Worker context, fetches the WASM binary (same directory), compiles Stockfish
- Commands received via `worker.onmessage` are queued in `r[]` until Stockfish is ready
- After initialization (`_isReady()` returns true), queued commands are processed
- Stockfish output forwarded via `postMessage(line)` back to main thread
- The file also doubles as a Node.js CLI binary (via `scripts/cli.js`)

**Progress reporting:** The Worker supports optional download progress:
```javascript
// Before sending UCI commands, send this to opt in:
worker.postMessage("setoption name CanOutputEngineDownloadProgress");
// Worker responds: "info WillOutputEngineDownloadProgress"
```

**Engine bridge: `lib/engine/stockfish.ts`**
- `createEngine()` → returns `{ initialize, evaluate, getBestMove, stop, dispose, ready }`
- Worker is created lazily (on first command), not on page load
- `EngineCallbacks` pattern: `onEval`, `onBestMove`, `onReady`, `onError`
- `SearchOptions`: `{ depth?: number, movetime?: number }`
- Depth defaults to 18, can be overridden per-call
- The bridge uses a single Worker with rotating `currentCallbacks` so stale search results are dropped
  when a new search starts before the previous one finishes

**Scripts:**
- `node scripts/copy-stockfish.mjs` — copies engine files from `node_modules/stockfish/bin/` to `public/stockfish/`
- Runs automatically via `postinstall` (after `npm install`) and `dev` script
- Defined in `package.json` as: `"postinstall": "node scripts/copy-stockfish.mjs"` and `"dev": "node scripts/copy-stockfish.mjs && next dev"`

**Stockfish directory (public/stockfish/):**
```
public/stockfish/
  stockfish.js    # Worker script (auto-copied, 21 KB)
  stockfish.wasm  # WASM binary (auto-copied, 7 MB)
```

**If you need to switch builds** (e.g., to multi-threaded), update these files:
1. `scripts/copy-stockfish.mjs` — change the source paths to the desired build
2. `next.config.ts` — add COOP/COEP headers for SharedArrayBuffer (multi-threaded only)
3. `CLAUDE.md` — update this section

### AI Integration Rules (CRITICAL)
- **Gemini output must be validated** before reaching the UI. Reject any response containing UCI notation or algebraic moves.
- **Every prompt template must explicitly forbid** outputting chess moves.
- **No prompt engineering tricks** to extract moves from Gemini. If the user asks "what move should I play?", Gemini must politely decline and offer strategic advice instead.
- **Rate limit Gemini calls** — minimum 2 seconds between calls.
- **Handle API key missing gracefully** — show no commentary, not an error page.

### Architecture Rules
- **Business logic never exists inside UI components.** Chess logic lives in `lib/chess/`, engine bridge in `lib/engine/`, AI in `lib/ai/`.
- **Zustand stores are the bridge** between logic and UI. Components read from stores and dispatch actions.
- **Components under ~300 lines.** Extract subcomponents when they exceed this.
- **Functions under ~50 lines.** Extract helpers when they exceed this.
- **Named exports only** (except Next.js pages which use default exports).
- **No `any`.** Use `unknown` with type guards. No `as` casts unless unavoidable. No `// @ts-ignore` or `// @ts-expect-error`.

### UI Guidelines
- **Always use Tailwind.** No inline styles, no CSS modules, no styled-components.
- **Use `cn()` utility** for conditional class merging.
- **Component variants via CVA** (class-variance-authority), consistent with shadcn patterns.
- **Dark mode** via `.dark` class variant (`dark:bg-zinc-900`).
- **Accessibility is required.** Keyboard navigation, ARIA labels, semantic HTML, focus management.
- **Loading, empty, and error states** are required for every data-driven component.

### Performance Guidelines
- **Stockfish Worker created lazily** (on first engine call, not page load via `ensureWorker()`).
- **Gemini SDK loaded lazily** (on first chat/commentary trigger).
- **Board component memoized** with `React.memo`.
- **Zustand selectors optimized** — use shallow equality for object selectors.
- **Stockfish pauses when tab is hidden** (visibilitychange — `worker.postMessage("stop")` on tab hide).
- **WASM binary is 7 MB** (lite-single build) — loads in ~1-3 seconds on modern connections.
- **Lighthouse score 90+** target.

### Documentation Requirements
- All documentation lives in `docs/`. See [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md) for the full index.
- **Architecture changes must update** `docs/ARCHITECTURE.md` (including Mermaid diagrams).
- **New features must update** `docs/ROADMAP.md`.
- **All changes must update** `docs/CHANGELOG.md`.

---

## Key Conventions

- **Path alias:** `@/` maps to `src/` root (`@/components/ui/button`, `@/lib/chess/engine`)
- **CSS:** Tailwind v4 with `@import "tailwindcss"` syntax. shadcn CSS variables in `app/globals.css` with `@theme inline` for light/dark via `.dark` class.
- **shadcn/ui:** config in `components.json`. Use `npx shadcn add <component>` to add new primitives.
- **Forms:** react-hook-form + zod v4 available.
- **Files:** kebab-case (`chess-board.tsx`, `game-store.ts`).
- **React components:** PascalCase (`ChessBoard`, `MoveHistory`).
- **Functions:** camelCase (`makeMove`, `getLegalMoves`).
- **Types:** PascalCase (`GameStatus`, `Square`).
- **Constants:** UPPER_SNAKE_CASE (`STARTING_FEN`, `PIECE_VALUES`).
- **Tests:** co-located with source (`engine.test.ts`, `chess-board.test.tsx`).
- **Stores:** camelCase, descriptive (`gameStore`, `engineStore`).

---

## Directory Structure (Summary)

```
src/
  app/              # Next.js App Router (pages, layouts, providers)
  components/       # React components
    ui/             # shadcn/ui primitives (auto-generated)
    board/          # Chess board (ChessBoard, PromotionDialog)
    game/           # Game UI (GameControls, MoveHistory, Clock, EvalBar)
    analysis/       # Analysis tools (AnalysisPanel, MoveNavigator, EvalGraph)
    ai/             # AI commentary UI (ChatPanel, CommentaryBubble, MoveGrade)
    settings/       # Settings panels (board theme, piece set, clock)
    shared/         # Reusable (LoadingSkeleton, EmptyState, ErrorBoundary, Spinner)
  lib/
    chess/          # chess.js wrapper (engine.ts, game.ts, fen.ts, pgn.ts)
    engine/         # Stockfish bridge (stockfish.ts, evaluation.ts, worker.ts)
    ai/             # Gemini integration (gemini.ts, prompts.ts, commentary.ts, validation.ts)
    store/          # Zustand stores (game-store, engine-store, settings-store)
    utils/          # Utilities (cn.ts, time.ts, sound.ts)
  hooks/            # React hooks (useChess, useEngine, useClock, useSound, useMobile)
  types/            # TypeScript types (chess.ts, engine.ts, ai.ts, settings.ts)
  workers/          # Web Worker scripts (stockfish.worker.ts)
  tests/            # Integration + E2E tests
```

Full structure: [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md)

---

## Git Workflow

```
main ← production
  feat/feature-name
  fix/bug-description
  refactor/what-changed
```

- Branch naming: `type/description` (kebab-case)
- Commits: Conventional Commits (`feat(scope): message`, `fix(scope): message`, etc.)
- PRs: merge to `main` via squash merge after CI passes + review

Full process: [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md)

---

## Things Claude Should NEVER Do

1. **Never make Stockfish output incorrect** by modifying evaluation scores, handicapping analysis, or replacing Stockfish evaluation.
2. **Never make Gemini decide a chess move.** Not via prompt engineering, tool use, output parsing, or any other technique.
3. **Never introduce a second chess engine.** Stockfish is the only engine.
4. **Never place chess logic inside a React component.** All chess logic belongs in `lib/chess/`.
5. **Never add a dependency without approval.** Every new dependency must be justified.
6. **Never use `any`.** Use `unknown` and narrow with type guards.
7. **Never modify `components/ui/` files.** These are auto-generated shadcn primitives. Add new primitives via `npx shadcn add`.
8. **Never delete files without permission.**
9. **Never skip testing.** Every function in `lib/` needs a unit test. Every component needs interaction tests.
10. **Never bypass the Gemini output validation layer.**
11. **Never hardcode API keys** — always use environment variables.
12. **Never inline styles** — always use Tailwind classes.
13. **Never assume a database or backend exists** — the MVP is fully client-side.
14. **Never skip loading, empty, or error states** for any component that fetches or processes data.

---

## Documentation Index

All documentation files:

| File | Purpose |
|---|---|
| [docs/PRODUCT.md](./docs/PRODUCT.md) | Product vision, target audience, success metrics |
| [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md) | System architecture with Mermaid diagrams |
| [docs/ROADMAP.md](./docs/ROADMAP.md) | 25 milestones across 6 phases |
| [docs/TECH_STACK.md](./docs/TECH_STACK.md) | Technology choices and rationale |
| [docs/CODING_STANDARDS.md](./docs/CODING_STANDARDS.md) | TypeScript, React, CSS, testing standards |
| [docs/API_DESIGN.md](./docs/API_DESIGN.md) | Future API contract design |
| [docs/DATABASE_PLAN.md](./docs/DATABASE_PLAN.md) | Future PostgreSQL schema |
| [docs/FOLDER_STRUCTURE.md](./docs/FOLDER_STRUCTURE.md) | Complete directory layout |
| [docs/TESTING_STRATEGY.md](./docs/TESTING_STRATEGY.md) | Unit, integration, E2E testing plan |
| [docs/SECURITY.md](./docs/SECURITY.md) | Security model (AI, API keys, CSP) |
| [docs/PERFORMANCE.md](./docs/PERFORMANCE.md) | Performance budgets and optimization |
| [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md) | Vercel deployment, CI/CD, monitoring |
| [docs/CONTRIBUTING.md](./docs/CONTRIBUTING.md) | Development workflow and conventions |
| [docs/CHANGELOG.md](./docs/CHANGELOG.md) | Release history (Keep a Changelog) |
| [docs/FUTURE_FEATURES.md](./docs/FUTURE_FEATURES.md) | Post-MVP feature catalog |
