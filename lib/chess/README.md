# lib/chess/ — Chess Business Logic

## Purpose
Pure functions for chess operations, wrapping chess.js behind a stable API.

## Responsibility
- All chess move validation and generation
- FEN/PGN parsing, manipulation, and serialization
- Game state machine (start, move, undo, resign, game-over detection)
- Chess constants (starting FEN, piece values, Unicode maps)

## Files That Will Live Here
- `engine.ts` — chess.js wrapper: createGame, makeMove, getLegalMoves, getStatus
- `game.ts` — Game state machine (lifecycle: waiting → playing → game-over)
- `fen.ts` — FEN parsing and validation utilities
- `pgn.ts` — PGN import/export with header handling
- `validation.ts` — Move validation helpers
- `constants.ts` — STARTING_FEN, PIECE_VALUES, Unicode maps, square colors

## Constraints
- **No React imports.** Zero dependency on the UI framework.
- **No side effects.** Pure functions only. All state mutations return new state.
- **No Zustand imports.** Store integration happens in `lib/store/`.
- **Import chess.js internally.** No other module should import chess.js directly.
- Every function must have a corresponding unit test.
