# Context

## Purpose

Defines the context builder system that aggregates game state, engine evaluation, player profile, and memory into a single `CommentaryContext` object. The context builder is the bridge between the raw chess/engine data sources and the prompt builder that constructs Gemini prompts.

## Responsibilities

- Define the context builder interfaces
- Aggregate game state (FEN, PGN, move history) into structured context
- Aggregate Stockfish evaluation into the context
- Aggregate player profile and preferences
- Combine all sources into a CommentaryContext ready for prompt construction

## Future Files

| File | Purpose |
|---|---|
| `game-context-builder.ts` | Builds GameContext from chess.js + game store |
| `move-context-builder.ts` | Builds MoveContext from the last move + engine eval |
| `context-assembler.ts` | Assembles the full CommentaryContext from all sub-builders |
| `context-validator.ts` | Validates context completeness before prompt building |

## Dependencies

- `lib/chess/` — Game state, FEN, PGN, move history
- `lib/engine/` — Stockfish evaluation
- `lib/ai/types/index.ts` — GameContext, MoveContext, PlayerContext, CommentaryContext, EngineEvaluation
