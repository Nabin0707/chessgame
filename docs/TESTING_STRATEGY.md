# Testing Strategy — AI Chess Platform

## Testing Philosophy

1. **Test behavior, not implementation.** A test should verify that a move is correctly made, not that `chess.move()` was called.
2. **Logic is tested more heavily than UI.** `lib/chess/`, `lib/engine/`, and `lib/ai/` have near-100% coverage. UI components get integration tests.
3. **Stockfish is mocked in unit tests.** Real Stockfish is only used in integration and manual tests.
4. **Gemini is mocked in all tests.** Real API calls only in production and manual QA.

---

## Test Pyramid

```
        /\
       /  \           E2E (Playwright)
      /    \          5-10 critical user paths
     /      \
    /        \        Integration (Vitest)
   /          \       20-30 feature interaction tests
  /            \
 /              \     Unit (Vitest)
/________________\    200+ tests: pure logic, stores, utilities
```

## Tooling

| Tool | Purpose | Config |
|---|---|---|
| **Vitest** | Unit + integration tests | `vitest.config.ts` at root |
| **@testing-library/react** | Component tests | Included in Vitest setup |
| **Playwright** | End-to-end tests | `playwright.config.ts` at root |
| **MSW** (future) | API mocking | For multiplayer API tests |

---

## Unit Testing (Vitest)

### Coverage Target: 90%+ on `lib/`, 80%+ overall

#### lib/chess/engine.ts

```typescript
// Tests for:
// - createGame() with default FEN and custom FEN
// - makeMove() with legal/illegal moves
// - makeMove() with promotion (auto-queen vs. choice)
// - getLegalMoves() for all pieces, including castling
// - getStatus(): check, checkmate, stalemate, draw
// - Undo move: makeMove then undo returns to original FEN
// - FEN consistency after multiple moves
// - Board orientation (white/black perspective)

describe('makeMove', () => {
  it('applies a legal pawn move', () => {
    const game = createGame();
    const result = makeMove(game, 'e2', 'e4');
    expect(result.success).toBe(true);
    expect(result.fen).toBe('rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1');
  });

  it('rejects an illegal bishop move (blocked by pawn)', () => {
    const game = createGame();
    const result = makeMove(game, 'f1', 'b5');
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('detects checkmate', () => {
    // Scholar's mate setup
    const game = loadFen('rnb1kbnr/pppp1ppp/8/4p3/5PPq/8/PPPPP2P/RNBQKBNR w KQkq - 1 3');
    makeMove(game, 'g1', 'f3'); // blocks nothing ...
    const status = getStatus(game);
    expect(status.kind).toBe('playing'); // not checkmate yet
  });
});
```

#### lib/engine/evaluation.ts

```typescript
// Tests for:
// - Parsing "info depth 18 score cp 45 pv e2e4 e7e5 ..."
// - Parsing "info depth 22 score mate 3 pv ..."
// - Parsing "bestmove e2e4"
// - Handling partial output (multi-line parse)
// - Error handling (malformed lines, missing values)
// - Mate score display formatting

describe('parseEvalLine', () => {
  it('parses centipawn evaluation', () => {
    const result = parseEvalLine('info depth 18 score cp 45 pv e2e4 e7e5');
    expect(result).toEqual({
      depth: 18,
      score: { type: 'cp', value: 45 },
      pv: ['e2e4', 'e7e5'],
    });
  });

  it('parses mate evaluation', () => {
    const result = parseEvalLine('info depth 22 score mate 3 pv Qh7+ Kxh7 Rh5#');
    expect(result).toEqual({
      depth: 22,
      score: { type: 'mate', value: 3 },
      pv: ['Qh7+', 'Kxh7', 'Rh5#'],
    });
  });
});
```

#### lib/ai/validation.ts

```typescript
// CRITICAL: Verify Gemini output never contains chess moves
describe('validateCommentary', () => {
  it('rejects commentary containing UCI notation', () => {
    const result = validateCommentary('You should play e2e4 here. It opens the center.');
    expect(result.isValid).toBe(false);
    expect(result.reason).toContain('contains move notation');
  });

  it('rejects commentary containing algebraic notation', () => {
    const result = validateCommentary('Nf3 is a good developing move.');
    expect(result.isValid).toBe(false);
  });

  it('accepts pure analytical commentary', () => {
    const result = validateCommentary('This position favors white due to the space advantage in the center.');
    expect(result.isValid).toBe(true);
  });
});
```

#### Zustand Stores

```typescript
describe('gameStore', () => {
  it('starts a new game with default position', () => {
    const store = useGameStore.getState();
    store.newGame();
    const state = useGameStore.getState();
    expect(state.fen).toBe(STARTING_FEN);
    expect(state.status.kind).toBe('playing');
    expect(state.turn).toBe('w');
  });

  it('makes a move and updates state', () => {
    const store = useGameStore.getState();
    store.newGame();
    store.makeMove('e2', 'e4');
    const state = useGameStore.getState();
    expect(state.fen).not.toBe(STARTING_FEN);
    expect(state.turn).toBe('b');
    expect(state.moveHistory.length).toBe(1);
  });

  it('prevents moving opponent pieces', () => {
    const store = useGameStore.getState();
    store.newGame();
    // Try to move a black piece on white's turn
    const result = store.makeMove('e7', 'e5');
    expect(result.success).toBe(false);
  });
});
```

---

## Integration Testing (Vitest)

### Game Flow Integration

```typescript
describe('Game Flow: complete game', () => {
  it('plays a game to checkmate and records all moves', () => {
    // Play through a known short game
    const store = useGameStore.getState();
    store.newGame();

    // Fool's mate: 1. f3 e5 2. g4 Qh4#
    store.makeMove('f2', 'f3');  // White
    store.makeMove('e7', 'e5');  // Black
    store.makeMove('g2', 'g4');  // White
    store.makeMove('d8', 'h4');  // Black (checkmate)

    const state = useGameStore.getState();
    expect(state.status.kind).toBe('checkmate');
    expect(state.status.winner).toBe('b');
    expect(state.moveHistory.length).toBe(4);
    expect(state.pgn).toContain('1. f3 e5 2. g4 Qh4#');
  });
});
```

### Stockfish Pipeline Integration (Mocked Worker)

```typescript
describe('Engine Pipeline', () => {
  it('sends UCI position command when position changes', async () => {
    const mockPostMessage = vi.fn();
    vi.mock('@/workers/stockfish.worker', () => ({
      default: class {
        postMessage = mockPostMessage;
      }
    }));

    const engine = await initEngine();
    setPosition(STARTING_FEN);
    expect(mockPostMessage).toHaveBeenCalledWith('position fen rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });
});
```

---

## End-to-End Testing (Playwright)

### Critical Paths

```
tests/e2e/
  play-game.spec.ts         # Play a full game vs AI to completion
  analyze-game.spec.ts      # Load a game and run analysis
  board-interaction.spec.ts # Drag pieces, highlight squares, promotion
  settings-persistence.spec.ts # Change settings, reload, verify
  responsive-layout.spec.ts # Test mobile and tablet viewports
  keyboard-navigation.spec.ts # Tab through controls, keyboard moves
```

### Example: Play a Game

```typescript
// tests/e2e/play-game.spec.ts
test('user can play a game to checkmate', async ({ page }) => {
  await page.goto('/play');

  // Verify board is rendered
  await expect(page.locator('[data-testid="chess-board"]')).toBeVisible();

  // Make a move (drag e2 pawn to e4)
  await page.dragAndDrop(
    '[data-square="e2"]',
    '[data-square="e4"]'
  );

  // Verify move appears in history
  await expect(page.locator('[data-testid="move-history"]')).toContainText('1. e4');

  // Verify AI commentary loads (if enabled)
  await expect(page.locator('[data-testid="commentary"]')).toBeVisible({ timeout: 10000 });
});
```

---

## Mocking Strategy

| Dependency | Mock Approach | Scope |
|---|---|---|
| **chess.js** | Real instance (no mock) | All tests |
| **Stockfish WASM** | Mock Web Worker `postMessage` + simulated UCI responses | Unit tests |
| **Gemini API** | `vi.mock('@google/generative-ai')` | All tests |
| **Framer Motion** | `vi.mock('framer-motion', () => ({ motion: { div: 'div' } }))` | Component tests |
| **react-chessboard** | Light mock that renders squares + pieces | Component tests |
| **localStorage** | `vi.stubGlobal('localStorage', mockStorage)` | Store tests |

---

## Testing Accessibility

```typescript
test('board is keyboard accessible', async ({ page }) => {
  await page.goto('/play');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-testid="new-game-btn"]')).toBeFocused();
});

test('screen reader announces check', async ({ page }) => {
  await page.goto('/play');
  // Play moves leading to check
  // Verify aria-live region announces "Check"
  await expect(page.locator('[aria-live="polite"]')).toContainText('Check');
});
```

---

## Test Commands (Future)

```bash
# Run all unit + integration tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run E2E tests (requires dev server)
npm run test:e2e
npm run test:e2e:ui    # Playwright UI mode

# Run specific test file
npx vitest lib/chess/engine.test.ts
```

---

## CI Integration (Future — GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm run test:coverage
      - run: npx playwright install
      - run: npm run test:e2e
```

## Quality Gates

| Gate | Threshold | Blocking |
|---|---|---|
| Unit test pass rate | 100% | Yes |
| Integration test pass rate | 100% | Yes |
| E2E test pass rate | 100% | Yes |
| Code coverage (`lib/`) | >= 90% | Yes |
| Code coverage (overall) | >= 80% | Warning |
| ESLint | 0 errors, 0 warnings | Yes |
| TypeScript check | Pass with no errors | Yes |
| Bundle size increase | < 10% per PR | Warning |
| Lighthouse Performance | >= 90 | Warning |
| Lighthouse Accessibility | >= 95 | Yes |
