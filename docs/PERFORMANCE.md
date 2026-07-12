# Performance — AI Chess Platform

## Performance Budgets

| Metric | Target | Measurement |
|---|---|---|
| **LCP (Largest Contentful Paint)** | < 1.5s | Lighthouse |
| **TBT (Total Blocking Time)** | < 100ms | Lighthouse |
| **CLS (Cumulative Layout Shift)** | < 0.05 | Lighthouse |
| **Board interaction FPS** | 60 FPS | Chrome DevTools Performance |
| **Stockfish response (depth 18)** | < 3s | User-perceived wait |
| **Gemini commentary** | < 2s | User-perceived wait |
| **Initial JS bundle** | < 150 KB (gzip) | `next-bundle-analyzer` |
| **Time to first move** | < 2s | Custom metric |
| **Lighthouse Performance score** | >= 90 | CI gate |

---

## Stockfish Web Worker

### Why a Web Worker

Stockfish's search algorithm is CPU-intensive. Running it on the main thread would:
- Freeze the UI during engine search (hundreds of ms to seconds per search)
- Make drag-and-drop feel laggy
- Prevent animations from running smoothly

### Worker Architecture

```typescript
// lib/engine/stockfish.ts
export function createStockfishWorker(): Worker {
  // Workers are loaded from a separate chunk
  const worker = new Worker(
    new URL('@/workers/stockfish.worker.ts', import.meta.url),
    { type: 'module' }
  );

  worker.onmessage = (event) => {
    const line = event.data as string;
    handleStockfishOutput(line);
  };

  return worker;
}
```

### Worker Lifecycle Management

```typescript
// Pool management for long-lived sessions
const workerPool = {
  workers: [] as Worker[],
  activeWorker: null as Worker | null,

  async getWorker(): Promise<Worker> {
    if (this.activeWorker?.ready) return this.activeWorker;
    // Terminate dead worker, create new one
    this.activeWorker?.terminate();
    this.activeWorker = await initWorker();
    return this.activeWorker;
  },

  // On visibility change → pause engine (save CPU/battery)
  handleVisibilityChange(): void {
    if (document.hidden) {
      this.activeWorker?.postMessage('stop');
    }
  },
};
```

### Optimizations

| Technique | Implementation |
|---|---|
| **Lazy initialization** | Load Stockfish WASM on first analysis request, not page load |
| **Depth throttling** | Limit depth by user setting (8-24). Default: 18 |
| **Time-bounded search** | Use `go movetime N` instead of fixed depth for responsive feel |
| **Cancellation** | Stop current search when user makes a move |
| **Memory cleanup** | Terminate Worker when user leaves analysis page |
| **Pause on tab hide** | Stop engine when tab is backgrounded |

---

## Bundle Optimization

### Code Splitting Strategy

| Module | Split Strategy | Trigger |
|---|---|---|
| **Stockfish WASM** | Dynamic import + Worker | First engine analysis |
| **Gemini SDK** | Dynamic import | First chat open / commentary trigger |
| **react-chessboard** | Dynamic import | Below fold, loaded with board |
| **Framer Motion** | ESM tree-shaken | Only used components are bundled |
| **Game history / PGN** | Route-based code split | Visit `/games` route |
| **Puzzles** | Route-based code split | Visit `/puzzles` route |

### Implementation

```typescript
// Lazy-load Stockfish engine
// components/analysis/engine-controls.tsx
import dynamic from 'next/dynamic';

const EvalBar = dynamic(
  () => import('@/components/analysis/eval-bar'),
  { ssr: false, loading: () => <EvalBarSkeleton /> }
);

// Dynamic Worker import
async function initEngine() {
  const { createStockfishWorker } = await import('@/lib/engine/stockfish');
  return createStockfishWorker();
}
```

### Bundle Analysis

```bash
# Add to package.json scripts:
npm install --save-dev @next/bundle-analyzer
# Run: ANALYZE=true npm run build
```

---

## React Rendering Optimization

### Memoization

```typescript
// ChessBoard.tsx — prevent re-render when unrelated state changes
export const ChessBoard = React.memo(function ChessBoard({
  fen,
  orientation,
  onMove,
}: ChessBoardProps) {
  return <Board position={fen} orientation={orientation} onDrop={onMove} />;
});

// MoveHistory.tsx — virtualize if many moves
// use react-window or simple slice for first 50 + "show more"
```

### Zustand Selector Optimization

```typescript
// ❌ Bad — subscribes to entire store, re-renders on any change
const fen = useGameStore((state) => state.fen);
const turn = useGameStore((state) => state.turn);

// ✅ Good — combine into single selector if components update together
const { fen, turn } = useGameStore((state) => ({
  fen: state.fen,
  turn: state.turn,
}));

// ✅ Best — use shallow equality for object selectors
import { useShallow } from 'zustand/react/shallow';

const { fen, turn } = useGameStore(
  useShallow((state) => ({ fen: state.fen, turn: state.turn }))
);
```

### Preventing Unnecessary Renders

```typescript
// EvalBar only needs engineStore.eval, not entire engine state
function EvalBar() {
  const evalScore = useEngineStore((s) => s.eval);
  // Only re-renders when eval changes — not when depth or isThinking changes
}
```

---

## Board Rendering Performance

react-chessboard renders 64 squares + 32 pieces. Key optimizations:

```typescript
// 1. Pass stable callback references
const handleMove = useCallback((from: string, to: string) => {
  gameStore.getState().makeMove(from, to);
}, []);

// 2. Avoid re-rendering the entire board for non-board state changes
// Keep board state (FEN, orientation) separate from UI state

// 3. Use CSS transforms for piece drag (GPU-accelerated)
// react-chessboard handles this internally via CSS transforms
```

---

## Image and Asset Optimization

```typescript
// next.config.ts
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 768, 1024, 1280],
  },
};
```

---

## Network Performance

| Resource | Strategy |
|---|---|
| **Gemini API calls** | Debounce (500ms), cache identical positions |
| **Stockfish WASM binary** | Cache via `Cache-Control: immutable`, preload via `<link rel="preload">` |
| **Static assets** | Vercel CDN (automatic) |
| **Fonts (Geist)** | `next/font` with `display: swap` |

---

## Monitoring (Future)

| Tool | What it monitors |
|---|---|
| **Vercel Analytics** | Page views, Web Vitals (LCP, CLS, INP) |
| **Sentry** | Error traces, performance spans |
| **Custom metrics** | Stockfish response time, Gemini latency, board FPS |
| **Console.time** | Development profiling for engine operations |

---

## Performance Checklist

- [ ] Stockfish runs in Web Worker
- [ ] Stockfish WASM loaded lazily
- [ ] Gemini SDK loaded lazily
- [ ] Board component memoized with `React.memo`
- [ ] Zustand selectors optimized (shallow equality)
- [ ] Callbacks stable (`useCallback`)
- [ ] Bundle analyzed (`@next/bundle-analyzer`)
- [ ] Images optimized (next/image, AVIF/WebP)
- [ ] Framer Motion components lazy-loaded
- [ ] Route-based code splitting for all pages
- [ ] CSP configured
- [ ] Fonts use `display: swap`
- [ ] Lighthouse audit passed (90+)
- [ ] Stockfish pauses on tab hide
- [ ] Debounced Gemini calls (no spam)
