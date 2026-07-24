# Changelog — AI Chess Platform

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Milestone 9: Gemini AI Commentary (Production Foundation) — live AI commentary after every player move
  - Gemini module (`lib/ai/gemini/`): `client.ts`, `service.ts`, `types.ts`, `index.ts`, `README.md`
  - Server-side API route at `app/api/ai/commentary/route.ts` (Next.js POST handler)
  - `@google/genai` SDK wrapper with retry logic (exponential backoff: 1s, 2s, 4s), timeout (10s default), and error normalisation
  - Prompt builder with system constraints (7 rules: no moves, no UCI, no FEN, no PGN, no engine lines, no prompt leaks, no filtering mentions)
  - Game phase detection: opening (≤10 moves), midgame (≤40), endgame (>40)
  - Validation pipeline integration — every Gemini response runs through `processCommentary()` before reaching the UI
  - Graceful degradation: fallback messages per game phase (opening / midgame / endgame)
  - `AICommentaryCard` with 5 UI states: idle, loading, success (with emoji reactions + tip), error (with retry button), unconfigured
  - `.env.example` updated: `GEMINI_API_KEY` (server-side only, never `NEXT_PUBLIC_`), optional `GEMINI_MODEL`
  - API key guard: returns unconfigured fallback if `GEMINI_API_KEY` is missing — no crash, no error page
  - Milestone report: `reports/MILESTONE_09_SUMMARY.md`
- Milestone 8: AI Validation & Response Pipeline — output validation middleware for Gemini responses
  - Schema validation: Zod schemas for `CommentResponse`, `ChatResponse`, `PostGameSummary`
  - Injection detection: 7 pattern categories (algebraic moves, UCI, FEN, PGN, suggestions, partials, prohibited terms)
  - Response sanitizer: strip notation, normalise whitespace, smart truncation
  - Validator orchestrator: parse → schema validate → detect → sanitize pipeline
  - Score calculation: 100 base, -25 per error, -10 per warning/info, min 0
  - Fallback generation: personality-aware fallback messages per event type
  - Pipeline orchestrator: 3-stage processing (validation → sanitization → formatting)
  - Error classification: fatal (stop + fallback) vs recoverable (continue) vs warning (log)
  - 6 test files: 120+ test cases across detector, sanitizer, schemas, validator, error, pipeline
  - Updated `lib/ai/index.ts` with 40+ new exports for validation and pipeline
  - Comprehensive documentation updates
  - Milestone report: `reports/MILESTONE_08_REPORT.md`
- Milestone 7: AI Foundation Architecture — six submodule type system for Gemini integration
  - Core types (30+): `ReactionType`, `GameContext`, `CommentaryContext`, `CommentResponse`,
    `ChatResponse`, `PipelineContext`, `PlayerStats`, and more
  - Personality system: 5 built-in personalities (The Coach, The Analyst, The Hype Man,
    The Stoic, The Wit) with tone, humour, emoji, and reaction templates
  - Prompt templates: 4 categories (commentary-after-move, position-analysis, chat-message,
    post-game-summary) with ADR-006 GLOBAL_CONSTRAINTS
  - Memory interfaces: `ConversationMemory`, `GameMemory`, `PlayerMemory`, `MemorySlice`
  - Context assembly: `ContextAssembler`, `GameContextBuilder`, `MoveContextBuilder`,
    `PlayerContextBuilder`
  - Formatter interfaces: `CommentaryFormatter`, `ChatFormatter`, `EmojiApplier`,
    `ResponseParser`, `GradeExtractor`
  - Comprehensive documentation: `docs/AI_GUIDELINES.md` with Mermaid pipeline diagrams
  - Milestone report: `reports/MILESTONE_07_REPORT.md`
- Milestone 12: Chess Intelligence Engine — pure analysis layer extracting structured game intelligence before it reaches AI commentary
  - 6 new files in `lib/chess/analysis/`: types, constants (60+ ECO openings), helpers (14 functions), analysis-engine (9-step pipeline), barrel exports, README
  - 8-tier move quality classification (brilliant → blunder) using centipawn loss thresholds
  - Phase detection, opening identification, positional heuristics (center/king/development)
  - Importance scoring (0–100) weighted by tactics, material swings, and threats
  - Pure function design — no side effects, no React dependencies
  - Milestone report: `reports/MILESTONE_12_SUMMARY.md`
- Milestone 13: AI Personality Engine — modular personality system transforming the AI commentator into 5 unique characters
  - 5 personalities: Coach (🏆), Grandmaster (👑), Sarcastic Rival (🎭), Chess Villain (😈), Friendly Opponent (🤝)
  - Personality type system with `PersonalityDefinition`, `PersonalityTraits`, `ReactionMap`
  - `lib/ai/personalities/` — types, base, registry, engine, settings (localStorage), 5 personality files, barrel exports
  - `components/ai/PersonalitySelector.tsx` — compact dropdown with animated avatar transitions
  - Integrated into Gemini pipeline: `personalityId` flows from UI → orchestrator → API route → Gemini service → prompt builder
  - Personality avatar and selector displayed in `AICommentaryCard` header
  - Default personality: Sarcastic Rival
  - Milestone report: `reports/MILESTONE_13_SUMMARY.md`
- Milestone 14: Player Memory & Adaptive Commentary — AI that remembers the player across games
  - `lib/ai/memory/` — types, storage (localStorage), statistics (profile/level/style), tracker (game recording), memory-engine (context builder), barrel exports, README
  - Tracks: games played, wins, losses, draws, openings, streaks, blunders, play style scores
  - Generates player profile: level, playStyle, favouriteOpening, weaknesses, strengths, recurring mistakes
  - Memory context injected into Gemini prompts for adaptive commentary
  - `components/ai/PlayerStatsCard.tsx` — game record grid, profile details, accuracy %, streaks, memory management (reset/export/import)
  - Existing M7 memory types preserved in `types-legacy.ts`
  - Milestone report: `reports/MILESTONE_14_SUMMARY.md`
- Milestone 15: Complete Chess Experience — 10 gameplay and UX features for a polished chess experience
  - `lib/chess/captured-pieces.ts`, `components/chess/CapturedPiecesCard.tsx` — captured pieces with material balance
  - `lib/chess/clock.ts`, `hooks/useClock.ts`, `components/chess/ChessClock.tsx` — chess clock with 12 time control presets
  - `lib/chess/notation.ts`, `components/chess/PgnTools.tsx` — PGN/FEN copy, download, import, export
  - `lib/chess/sound.ts`, `components/chess/SoundToggle.tsx` — Web Audio API sound engine (7 event types)
  - `components/chess/BoardImprovements.tsx` — last move highlight, check highlight, legal move indicators
  - `components/chess/AnalysisTools.tsx` — animated eval bar with depth, nodes, speed, best move
  - `components/chess/chess-sidebar.tsx` — enhanced game controls (flip board, resign, offer draw)
  - `hooks/useKeyboardShortcuts.ts` — keyboard shortcuts (N/U/F/M/R) with input-field detection
  - `types/engine.ts`, `lib/engine/stockfish.ts` — enhanced engine analysis data (depth/nodes/nps/PV)
  - `components/chess/chess-workspace.tsx` — mobile toggle panels, responsive layout, all integrations wired
  - Milestone report: `reports/MILESTONE_15_SUMMARY.md`

### Security
- Gemini API key (`GEMINI_API_KEY`) is now server-side only via Next.js Route Handler — never exposed to the browser
- All Gemini API calls go through `app/api/ai/commentary/route.ts` which reads the key from `process.env`
- The `@google/genai` SDK is never imported in browser code — only in `lib/ai/gemini/client.ts` (server context)

### Foundation
- Initialize Next.js 16 project with TypeScript, Tailwind CSS v4, and shadcn/ui
- Define project architecture and documentation (see `docs/`)
- Configure ESLint flat config with Next.js core-web-vitals + TypeScript rules
- Set up SEO boilerplate (metadata factory, sitemap, robots.txt)
- Create project documentation: PRODUCT, ARCHITECTURE, ROADMAP, TECH_STACK,
  CODING_STANDARDS, API_DESIGN, DATABASE_PLAN, FOLDER_STRUCTURE,
  TESTING_STRATEGY, SECURITY, PERFORMANCE, DEPLOYMENT, CONTRIBUTING,
  CHANGELOG, FUTURE_FEATURES

---

## [0.1.0] — TBD (Initial MVP Release)

### Added
- TBD — First playable milestone

### Fixed
- TBD

### Changed
- TBD

---

## Template

```
## [0.2.0] — 2026-08-01

### Added
- Stockfish AI opponent with configurable difficulty
- Move evaluation bar with real-time analysis
- Post-game analysis with move-by-move navigation

### Fixed
- Promotion dialog not responding on iOS Safari

### Changed
- Reduced Stockfish WASM binary size by 30% via compression
