# Milestone 10: Intelligent Commentary Engine

> **Date:** 2026-07-24
> **Status:** ✅ Complete
> **Phase:** 4 — AI & Commentary

---

## Summary

Built an intelligent commentary orchestration layer that manages the lifecycle of AI commentary requests — queuing, throttling, staleness detection, and rapid-move merging — along with a visual legal-move highlighting system on the board.

---

## What Was Built

### 1. Commentary Orchestrator (`lib/ai/orchestrator/`)

A lightweight event-emitter class that interposes between the game loop and the commentary API:

| File | Purpose |
|---|---|
| `types.ts` | `OrchestratorConfig`, `CommentaryQueueItem`, `CommentaryResult`, `OrchestratorEvent`, `FetchCommentaryFn` |
| `orchestrator.ts` | `CommentaryOrchestrator` class — queue, dispatch, discard logic |
| `__tests__/orchestrator.test.ts` | Unit tests for all major behaviours |

**Key Behaviours:**

- **Queue AI requests** — FIFO queue, one in-flight at a time. Subsequent requests are enqueued.
- **Cancel outdated requests** — both pre-request and post-response FEN checks silently discard stale entries.
- **Merge rapid moves** — during cooldown, the last queued entry is **replaced** with the latest move, never accumulating a backlog of old positions.
- **Importance filter** — trivial moves (no capture, check, checkmate, or game-over) inside cooldown are skipped entirely. Important events always dispatch.
- **Configurable cooldown** — defaults to 2000 ms between API calls, adjustable via `OrchestratorConfig.cooldownMs`.
- **Stale-position defence** — the orchestrator compares `currentFen` + the request's `fen` before dispatching **and** after the response arrives. If they don't match, the result is silently discarded.
- **Clean lifecycle** — `reset()`, `destroy()`, and a subscriber pattern for clean React integration.

**React Integration (`chess-workspace.tsx`):**

- The orchestrator is created once in a `useEffect` with a `useRef`.
- `handleMove` calls `orchestrator.enqueue()` instead of `fetch()` directly.
- Orchestrator events (`loading`, `result`, `skipped`) drive `commentaryState` via `setCommentaryState`.
- On "New Game", the orchestrator is reset and `commentaryState` returns to `kind: "idle"`.
- On undo, commentary is cleared to avoid stale text.

### 2. Legal Move Highlighting (`chess-board-container.tsx`)

| Feature | Detail |
|---|---|
| **Click-to-select** | Click a piece → highlights it + all legal destination squares |
| **Drag-to-select** | Start dragging → highlights all legal destination squares |
| **Click-to-move** | Click a highlighted square → move made, highlights cleared |
| **Drop-to-move** | Drop on legal square → move made, highlights cleared |
| **Deselect** | Click same piece again → deselects, highlights cleared |
| **No legal moves** | Clicking a piece with zero legal destinations silently clears selection |
| **Disabled state** | No highlighting when board is disabled (opponent thinking, game over) |

**Visual styles:**

```
Selected square:   yellow overlay (rgba(255, 255, 0, 0.35))
Legal destination: radial-gradient dot (25% radius, semi-transparent black)
Capture square:    (enhanced ring style — prepared for capture detection)
```

**Integration:** The ChessBoardContainer receives a new optional prop `getLegalMovesForSquare?: (square: string) => string[]`, which is wired from `gameRef.current.moves({ square, verbose: true })` in the workspace. This keeps the board pure — it never imports chess.js directly.

---

## Architecture

```
User Move
    │
    ├─▶ makeMove(gameRef)
    │       ↓
    │   setRevision(r+1)
    │       ↓
    │   triggerEngineMove()        ← Stockfish opponent
    │
    └─▶ orchestrator.enqueue({ fen, lastMove, isCapture, ... })
            │
            ▼
    ┌───────────────────────────────────┐
    │  CommentaryOrchestrator          │
    │                                   │
    │  1. cooldown check?               │
    │  2. importance filter?            │
    │  3. pre-request staleness check   │
    │  4. dispatch fetch                    │
    │  5. post-response staleness check │
    │  6. emit result / skip            │
    └───────────────────────────────────┘
            │
            ▼
    setCommentaryState({ kind: "success" | "error" | ... })
            │
            ▼
    ChessInfoPanel renders commentary
```

---

## Files Changed

### New Files
| File | Lines | Purpose |
|---|---|---|
| `lib/ai/orchestrator/types.ts` | ~109 | Orchestrator type definitions |
| `lib/ai/orchestrator/orchestrator.ts` | ~229 | Orchestrator class implementation |
| `lib/ai/orchestrator/index.ts` | ~12 | Re-exports |
| `lib/ai/orchestrator/__tests__/orchestrator.test.ts` | ~170 | Unit tests |
| `reports/MILESTONE_10_SUMMARY.md` | ~145 | This report |

### Modified Files
| File | Changes |
|---|---|
| `lib/ai/index.ts` | Added orchestrator type + class exports |
| `components/chess/chess-workspace.tsx` | Replaced `generateCommentary()` with `CommentaryOrchestrator`; added `getLegalMovesForSquare`; removed unused imports/refs |
| `components/chess/chess-board-container.tsx` | Added `getLegalMovesForSquare` prop; click/drag selection state; `squareStyles` map; full highlight logic |

---

## Testing

### Orchestrator Unit Tests (`orchestrator.test.ts`)

| Test | What It Verifies |
|---|---|
| dispatches immediately when idle | First enqueue fires `fetchFn` immediately |
| queues during in-flight | Second enqueue while first is pending doesn't double-call |
| merges during cooldown | Non-important event within cooldown replaces queue, doesn't dispatch |
| dispatches important events (capture) | Capture bypasses cooldown |
| dispatches important events (check) | Check bypasses cooldown |
| dispatches important events (checkmate) | Checkmate bypasses cooldown |
| dispatches important events (gameover) | Game over bypasses cooldown |
| discards stale pre-request | FEN mismatch before dispatch → skip |
| discards stale post-request | FEN changes during flight → result discarded |
| disabled state | `config.enabled = false` → no fetch |
| reset | Clears queue, processing flag, timestamp |
| destroy | Removes all listeners |

### TypeScript
```
npx tsc --noEmit    →  0 errors
```

### Manual Testing Checklist
- [ ] Make a move → commentary loads after cooldown
- [ ] Make 3 rapid moves → only the last one gets commentary
- [ ] Checkmate → commentary shows immediately (no cooldown delay)
- [ ] Capture → commentary shows immediately
- [ ] Click piece → legal destinations highlighted with dots
- [ ] Click legal square → move executes, highlights clear
- [ ] Click illegal square → selection switches, highlights update
- [ ] Drag piece to legal square → move executes, highlights clear
- [ ] New game → commentary resets to idle
- [ ] Undo → commentary clears

---

## Migration Path

Old code path (direct `generateCommentary()` call in `handleMove`):

```typescript
// REMOVED
const generateCommentary = useCallback(async () => {
  const res = await fetch("/api/ai/commentary", { ... });
  const data = await res.json();
  setCommentaryState({ kind: "success", text: data.commentary, ... });
}, []);
```

New code path (orchestrator):

```typescript
// ADDED
const fetchFn = async (item: CommentaryQueueItem): Promise<CommentaryResult> => {
  const res = await fetch("/api/ai/commentary", { ... });
  const data = await res.json();
  return { kind: "success", text: data.commentary, ... };
};

const orchestrator = new CommentaryOrchestrator({ cooldownMs: 2000 }, fetchFn);
orchestrator.onEvent((event) => {
  if (event.type === "result") setCommentaryState(...);
});

// In handleMove:
orchestrator.updateCurrentFen(currentFen);
orchestrator.enqueue({ fen: currentFen, lastMove, ... });
```

---

## Next Steps (Post-Milestone 10)

1. **Engine evaluation comparison** — pass eval deltas to the orchestrator for quantitative "importance" scoring.
2. **Personalities** — integrate personality selection into the commentary pipeline.
3. **Prompt polish** — refine Gemini prompts for richer analysis (explicitly deferred by the requirements).
4. **Opening-book detection** — detect novelty/book-exit for another importance dimension.

---

*End of Milestone 10 Summary*
