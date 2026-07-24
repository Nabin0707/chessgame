# Milestone 12: Chess Intelligence Engine

**Completed:** 2026-07-24

## Files Created

| File | Description |
|---|---|
| `lib/chess/analysis/types.ts` | Type definitions (AnalysisResult, MoveQualityCategory, GamePhase, AnalysisInput, ImportanceWeights) |
| `lib/chess/analysis/constants.ts` | Thresholds, piece values, 60+ ECO opening patterns, importance weight defaults |
| `lib/chess/analysis/helpers.ts` | Pure helper functions (material, phase, quality, opening, center/king/development, importance) |
| `lib/chess/analysis/analysis-engine.ts` | Main `analyzeMove()` and `analyzeMoveHistory()` pipeline |
| `lib/chess/analysis/index.ts` | Barrel exports for all public types and functions |
| `lib/chess/analysis/README.md` | Architecture, usage, and design documentation |

## Architecture

The engine separates pure analysis from AI commentary. It takes a move + evaluations and produces a rich AnalysisResult without side effects, dependencies on React, or the commentary pipeline.

## Key Capabilities

- **8-tier move quality** (brilliant → blunder) using centipawn loss thresholds
- **Phase detection** via move count + material heuristics
- **Opening identification** — 60+ ECO patterns (Italian, Sicilian, Ruy Lopez, Queen's Gambit, Indian defenses, flank openings, etc.)
- **Positional assessments** — center control, king safety, development (heuristic, not Stockfish-based)
- **Importance scoring** — 0–100 weighted by tactics, material swings, and threats
