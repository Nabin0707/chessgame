# Changelog — AI Chess Platform

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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
