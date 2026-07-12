# Coding Standards — AI Chess Platform

## TypeScript

### Strictness
- `strict: true` in `tsconfig.json`
- No `any` — use `unknown` and narrow with type guards
- No `as` casts unless unavoidable; prefer type guards
- No `// @ts-ignore` or `// @ts-expect-error` — fix the type

### Naming Conventions

| Construct | Convention | Example |
|---|---|---|
| **Files** | kebab-case | `chess-board.tsx`, `game-store.ts` |
| **React components** | PascalCase | `ChessBoard.tsx`, `MoveHistory.tsx` |
| **Functions** | camelCase | `makeMove()`, `getLegalMoves()` |
| **Variables** | camelCase | `selectedSquare`, `legalMoves` |
| **Types / Interfaces** | PascalCase | `GameStatus`, `MoveResult`, `Square` |
| **Constants** | UPPER_SNAKE_CASE | `STARTING_FEN`, `PIECE_VALUES`, `MAX_DEPTH` |
| **Zustand stores** | camelCase, suffixed Store | `gameStore`, `engineStore` |
| **CSS classes** | kebab-case (Tailwind) | `bg-card`, `text-muted-foreground` |
| **Test files** | co-located, `.test.ts` | `engine.test.ts`, `chess-board.test.tsx` |

### Type Definitions

```typescript
// Prefer type over interface
type Square = `${File}${Rank}`;

// Use interface for public APIs / store shapes
interface GameState {
  fen: string;
  pgn: string;
  moveHistory: Move[];
  status: GameStatus;
}

// Use discriminated unions for state machines
type GameStatus =
  | { kind: 'playing'; turn: Color }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: DrawReason };

// Use branded types for domain primitives
type FEN = string & { readonly __brand: 'FEN' };
type PGN = string & { readonly __brand: 'PGN' };
```

### Functions

- Pure functions preferred. Side effects isolated to stores.
- Single responsibility — a function does one thing.
- Document parameters and return types for public API functions.
- Default exports: only for pages (`app/page.tsx`). Everything else: named exports.

```typescript
// ✅ Good
export function makeMove(game: Chess, from: Square, to: Square): MoveResult {
  const move = game.move({ from, to, promotion: 'q' });
  // ...
}

// ❌ Bad
export default function doStuff(fen: any, thing: any) {
  // ...
}
```

## React

### Component Patterns

```typescript
// ✅ Prefer function components
function ChessBoard({ fen, onMove }: ChessBoardProps) {
  return <Board position={fen} onDrop={onMove} />;
}

// ❌ Avoid class components
// class ChessBoard extends React.Component { ... }
```

### Props

```typescript
// ✅ Name your prop types
interface ChessBoardProps {
  fen: string;
  onMove: (from: Square, to: Square) => void;
  orientation?: Color;
  disabled?: boolean;
}

function ChessBoard({ fen, onMove, orientation = 'w', disabled = false }: ChessBoardProps) {
  // ...
}
```

### Composition over Configuration

Break components into small, focused pieces:

```typescript
// ✅ Good — composition
<GameLayout>
  <ChessBoard />
  <GameSidebar>
    <MoveHistory />
    <CapturedPieces />
    <EvalBar />
  </GameSidebar>
</GameLayout>

// ❌ Bad — giant component
<GameView orientation="white" showBoard showHistory showEval showCaptured />
```

### State Co-location

- Local UI state → `useState` in component
- Shared state → Zustand store
- Derived state → `useMemo` / selector

```typescript
// Local UI state (panel open/closed)
const [isPanelOpen, setIsPanelOpen] = useState(false);

// Shared game state from store
const fen = useGameStore((state) => state.fen);

// Derived state
const materialCount = useMemo(() => countMaterial(fen), [fen]);
```

## File Organization

```
src/
  components/
    board/
      chess-board.tsx      # Component files: kebab-case
      chess-board.test.tsx # Co-located tests
      chess-board.stories.tsx  # Stories (future)
  lib/
    chess/
      engine.ts            # Pure logic files: descriptive names
      engine.test.ts
  types/
    chess.ts               # Type files: one domain per file
```

### Max Lengths

- Component: ~300 lines. Extract subcomponents if longer.
- Function: ~50 lines. Extract helpers if longer.
- File: ~500 lines. Split domain if longer.

## Imports

Order imports consistently:

1. React / Next.js
2. Third-party libraries
3. Internal modules (`@/lib/...`, `@/components/...`)
4. Types (`@/types/...`)
5. Styles (rare — use Tailwind)

```typescript
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';

import { makeMove } from '@/lib/chess/engine';
import { useGameStore } from '@/lib/store/game-store';
import { Button } from '@/components/ui/button';

import type { Square, Move } from '@/types/chess';
```

## Testing

```typescript
// Tests co-located with source
// lib/chess/engine.test.ts

import { describe, it, expect } from 'vitest';
import { createGame, makeMove } from './engine';

describe('makeMove', () => {
  it('applies a legal move and returns new FEN', () => {
    const game = createGame();
    const result = makeMove(game, 'e2', 'e4');
    expect(result.success).toBe(true);
    expect(result.fen).toContain('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR');
  });

  it('rejects an illegal move', () => {
    const game = createGame();
    const result = makeMove(game, 'e2', 'e5');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Git Conventions

See [CONTRIBUTING.md](./CONTRIBUTING.md) for full conventions.

### Commit Messages

Follow Conventional Commits:

```
feat: implement Stockfish evaluation bridge
fix: handle promotion dialog on mobile
refactor: extract game state machine from store
docs: add API design document
test: add engine parser unit tests
chore: update dependencies
perf: lazy-load Stockfish WASM
style: format with Prettier
```

### Branch Naming

```
feat/stockfish-bridge
fix/promotion-dialog-mobile
refactor/game-state-machine
docs/api-design
```

## CSS Conventions

- **Always use Tailwind.** No inline styles, no CSS modules, no styled-components.
- Use Tailwind's `cn()` utility for conditional classes.
- Component variants via `class-variance-authority` (CVA), consistent with shadcn patterns.
- Dark mode: use `.dark` class variant (`dark:bg-black`).

```typescript
// ✅ Good
<div className={cn("flex items-center gap-2 p-4", className)}>
<div className="dark:bg-zinc-900 bg-white rounded-lg">

// ❌ Bad
<div style={{ display: 'flex', padding: '16px' }}>
```

## Accessibility

- All interactive elements must be keyboard accessible.
- Use semantic HTML (`<button>`, `<nav>`, `<main>`, `<aside>`).
- ARIA labels on icon-only buttons.
- Focus indicators never removed.
- Board squares have proper ARIA roles.
- Color not the only indicator for piece selection, check, etc.
