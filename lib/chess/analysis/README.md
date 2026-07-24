# Chess Intelligence Engine

A pure analysis layer that transforms raw chess data into structured, human-readable intelligence. Built for the AI Chess Platform.

## Architecture

```
lib/chess/analysis/
├── types.ts           # Type definitions (AnalysisResult, MoveQualityCategory, etc.)
├── constants.ts       # Thresholds, piece values, opening patterns, importance weights
├── helpers.ts         # Pure helper functions (material, phase, quality, positional)
├── analysis-engine.ts # Main entry: analyzeMove() + analyzeMoveHistory()
├── index.ts           # Barrel re-exports
└── README.md          # This file
```

## Usage

```typescript
import { analyzeMove } from "@/lib/chess/analysis";

const result = analyzeMove({
  lastMove: moveRecord,
  moveHistory: allMoves,
  fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  evalBefore: 20,     // centipawns, White's perspective
  evalAfter: 15,      // centipawns, White's perspective
  moverColor: "w",    // the side that just moved
  phase: "opening",
  moveNumber: 1,
});

console.log(result.moveQuality);   // "best" | "great" | "inaccuracy" | etc.
console.log(result.importance);    // 0–100
console.log(result.opening);       // "Italian Game" | null
```

## Pipeline

For each move, the engine runs:

1. **Phase Detection** — Opening / Midgame / Endgame via move count + material
2. **Flag Extraction** — Capture, check, checkmate, promotion, castle from move flags
3. **Material Balance** — FEN-based piece summation to centipawns
4. **Opening Detection** — Longest-prefix match against 60+ ECO patterns
5. **Move Quality** — 8-level classification (brilliant → blunder) via centipawn loss
6. **Positional Assessment** — Center control, king safety, development heuristics
7. **Importance Score** — 0–100 based on tactics, material, and threats

## Move Quality Tiers

| Category    | Centipawn Loss | Typical Meaning              |
|-------------|---------------|------------------------------|
| Brilliant   | Sacrifice     | Sacrifice with huge gain     |
| Great       | < 50          | Strong move, near-best       |
| Best        | < 100         | Engine's top choice range    |
| Good        | < 200         | Solid, reasonable            |
| Book        | —             | Opening book knowledge       |
| Inaccuracy  | 50–100        | Slightly suboptimal          |
| Mistake     | 100–300       | Losing advantage             |
| Blunder     | > 300         | Game-losing error            |

## Design Principles

- **Pure functions** — No side effects, no state. Input in → result out.
- **Zero dependencies** on React, AI, or game state management.
- **Heuristic-based** (not Stockfish-dependent) for center/king/development.
- **Extensible openings** — Add new patterns to `constants.ts` opening array.
- **Configurable thresholds** — Override via constants for tuning.
