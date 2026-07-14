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
