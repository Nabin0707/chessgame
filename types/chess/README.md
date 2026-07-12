# types/chess/ — Chess Type Definitions

## Purpose
TypeScript type definitions shared across the chess domain.

## Responsibility
- Defining the core chess data types used throughout the application
- Providing branded types for domain primitives (FEN, PGN)
- Ensuring type safety across module boundaries

## Files That Will Live Here
- `index.ts` — Re-exports and shared types (Square, Piece, Color, Move)
- `game.ts` — GameStatus, GameResult, DrawReason, MoveResult
- `board.ts` — Board orientation, coordinate types, square highlight types

## Key Types To Define
```typescript
type Square = `${File}${Rank}`;  // "a1" through "h8"
type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
type Rank = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
type Color = 'w' | 'b';
type PieceType = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
type FEN = string & { readonly __brand: 'FEN' };
type PGN = string & { readonly __brand: 'PGN' };
```

## Constraints
- **No runtime code.** Types only — no functions, no classes, no constants.
- **No React types.** Keep framework-agnostic.
- **Co-located with chess domain.** Engine types and AI types have their own directories.
