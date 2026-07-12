# Development Roadmap — AI Chess Platform

## Legend

- 🎯 **Milestone** — Shippable increment
- ⏱ **Estimate** — Target duration
- 🔑 **Key deliverable** — The main output
- ⚠️ **Risk** — Things that could go wrong

---

## Phase 0: Foundation (Milestones 1–2)

### Milestone 1: Project Scaffold
⏱ 1 day

- [ ] Rename project from "ckcleaning" to "ai-chess-platform"
- [ ] Update `SITE_CONFIG` with real name, URL, description
- [ ] Install dependencies: chess.js, react-chessboard, zustand, @google/generative-ai, framer-motion, stockfish (nmrugg)
- [ ] Move code into `src/` directory layout
- [ ] Update `tsconfig.json` paths for `src/` structure
- [ ] Update ESLint config with custom rules
- [ ] Verify `npm run dev` works with new structure
- [ ] Clean up default create-next-app boilerplate from `app/page.tsx`
- [ ] Remove template assets (Vercel SVG, template SVGs)
- [ ] 🔑 **Clean, buildable project with new identity**

### Milestone 2: Core Types & Constants
⏱ 1 day

- [ ] Define all TypeScript types in `types/chess.ts` (Square, Piece, Color, Move, GameStatus, GameResult, etc.)
- [ ] Define engine types in `types/engine.ts` (EvalScore, SearchLimit, EngineState, PV)
- [ ] Define AI types in `types/ai.ts` (Commentary, Analysis, ChatMessage)
- [ ] Create `lib/chess/constants.ts` (STARTING_FEN, PIECE_VALUES, piece Unicode maps, SQUARE_COLORS)
- [ ] Create `lib/utils/cn.ts` (existing cn() stays)
- [ ] Create `lib/utils/format.ts` (time formatting, algebraic notation helpers)
- [ ] 🔑 **All shared types — every module imports from `types/`, not inline**

---

## Phase 1: Core Chess (Milestones 3–7)

### Milestone 3: chess.js Wrapper
⏱ 2 days

- [ ] Create `lib/chess/engine.ts`:
  - `createGame(fen?)` → Chess instance
  - `makeMove(game, from, to)` → MoveResult
  - `getLegalMoves(game, square?)` → Move[]
  - `getStatus(game)` → GameStatus
  - `getPGN(game)` → string
  - `loadPGN(pgn)` → Chess
- [ ] Create `lib/chess/fen.ts` (FEN parsing / validation utilities)
- [ ] Create `lib/chess/pgn.ts` (PGN import/export, header parsing)
- [ ] Write unit tests for every function
- [ ] 🔑 **Pure functions — no React, no side effects, fully tested**

### Milestone 4: Game State Machine
⏱ 2 days

- [ ] Create Zustand `gameStore`:
  - State shape: chess.js instance, FEN, PGN, move history, selected square, legal moves, captured pieces, game status, turn
  - Actions: `makeMove`, `undoMove`, `newGame`, `resign`, `selectSquare`, `clearSelection`
- [ ] Handle all game-over conditions (checkmate, stalemate, insufficient material, threefold repetition, fifty-move rule)
- [ ] Create `lib/chess/game.ts` — state machine layer on top of chess.js
- [ ] Write unit tests (game lifecycle, edge cases, all draw conditions)
- [ ] 🔑 **Game state is predictable, serializable, and tested**

### Milestone 5: Zustand Game Store
⏱ 1 day

- [ ] Complete `gameStore` with all actions
- [ ] Add Zustand selectors for derived state (isCheck, isCheckmate, materialCount, etc.)
- [ ] Add localStorage persistence for game state
- [ ] Create `useChess` hook — bridges component events to store actions
- [ ] Test store with mock actions
- [ ] 🔑 **Store is the single source of truth**

### Milestone 6: Chess Board UI
⏱ 3 days

- [ ] Install and configure react-chessboard
- [ ] Create `ChessBoard.tsx`:
  - Drag-and-drop piece movement
  - Highlight selected square and legal moves
  - Show last move highlight
  - Check indicator
  - Promotion dialog (modal)
- [ ] Create `Square.tsx` — coordinate labels, rank/file display
- [ ] Create `MoveIndicators.tsx` — dots for legal moves, colored highlights
- [ ] Create `PromotionDialog.tsx` with Framer Motion animations
- [ ] Create `CapturedPieces.tsx` — material advantage display
- [ ] Board responsive sizing (works on mobile)
- [ ] 🔑 **Fully interactive, responsive, animated chess board**

### Milestone 7: Game UI Components
⏱ 2 days

- [ ] Create `GameControls.tsx`: New Game, Resign, Draw Offer, Undo Move buttons
- [ ] Create `MoveHistory.tsx`: scrollable algebraic notation panel
- [ ] Create `GameInfo.tsx`: player names, ratings, game status
- [ ] Create `Clock.tsx`: chess clock with increment support
- [ ] Create `GameLayout.tsx`: orchestrates board + sidebar layout
- [ ] Responsive layout — sidebar collapses on mobile
- [ ] Create `app/(main)/play/page.tsx` — full play page
- [ ] 🔑 **A human can play a complete game of chess**

---

## Phase 2: Stockfish Engine (Milestones 8–11)

### Milestone 8: Stockfish Web Worker Bridge
⏱ 3 days

- [ ] Stockfish is installed as `stockfish` v18 (nmrugg). Copy `stockfish-18-lite-single.js` to `public/stockfish/` via automated postinstall script.
- [ ] Create `lib/engine/stockfish.ts`:
  - `initEngine()` — instantiate Worker from `/stockfish/stockfish.js`
  - `setPosition(fen)` — send UCI position command
  - `goSearch(options)` — depth, time, infinite
  - `stop()` — halt search
  - `onMessage(handler)` — register callback
  - `destroy()` — terminate Worker
- [ ] Handle Worker lifecycle (loading, ready, error, crash recovery)
- [ ] Create `lib/engine/types.ts` — all engine message types
- [ ] Write tests with Mock Worker
- [ ] 🔑 **Engine is a reliable, restartable, testable service**

### Milestone 9: Evaluation Parser
⏱ 1 day

- [ ] Create `lib/engine/evaluation.ts`:
  - Parse `info` lines from Stockfish output
  - Extract: score (cp/mate), depth, PV, nodes, NPS, time
  - Type-safe parsing with error handling
- [ ] Handle multi-PV output (multiple best lines)
- [ ] Handle mate scores correctly (display as `#+5`, `#-3`)
- [ ] Handle engine errors / timeouts gracefully
- [ ] 🔑 **Raw UCI output → typed, usable data**

### Milestone 10: Engine Store
⏱ 1 day

- [ ] Create Zustand `engineStore`:
  - State: eval, bestLine, depth, multiPv, isThinking, isEngineReady
  - Actions: toggleAnalysis, setDepth, startSearch, stopSearch
- [ ] Wire Stockfish bridge to engine store
- [ ] Create `useEngine` hook
- [ ] Handle engine state transitions (loading → ready → searching → result)
- [ ] 🔑 **Any component can subscribe to engine state**

### Milestone 11: Engine UI Components
⏱ 2 days

- [ ] Create `EngineEvaluation.tsx` — vertical eval bar with score display
- [ ] Create `BestLineDisplay.tsx` — top engine line in algebraic notation
- [ ] Create `MultiVariantDisplay.tsx` — multiple lines from multi-PV
- [ ] Create `EngineControls.tsx` — depth selector, toggle, stop/start
- [ ] Animation: eval bar smoothly transitions between scores
- [ ] 🔑 **Player can see Stockfish analysis in real-time**

---

## Phase 3: AI Commentary (Milestones 12–16)

### Milestone 12: Gemini Integration
⏱ 2 days

- [ ] Install `@google/generative-ai`
- [ ] Create `lib/ai/gemini.ts`:
  - `initGemini(apiKey)` → Gemini client
  - `explainMove(move, fen, context)` → Commentary
  - `analyzeGame(pgn)` → GameAnalysis
  - `explainPosition(fen, history)` → PositionAnalysis
  - `chat(message, gameContext)` → ChatResponse
- [ ] Create `lib/ai/prompts.ts` — system prompts:
  - **Critical**: "You never output chess moves. You explain and analyze only."
  - Constrained output format (structured JSON)
  - Prompt templates for each use case
- [ ] Create `lib/ai/types.ts` — response types
- [ ] Write unit tests (mock Gemini, verify no move output)
- [ ] 🔑 **AI commentary is safe, structured, and testable**

### Milestone 13: Commentary Pipeline
⏱ 2 days

- [ ] Create commentary orchestration in `lib/ai/`:
  - Determine when to trigger commentary (user setting, move quality threshold)
  - Build context for Gemini (position, previous moves, player skill level)
  - Parse and validate Gemini response (reject if it contains move suggestions)
  - Rate limiting (throttle API calls)
- [ ] Handle API errors gracefully (retry with backoff, fallback messages)
- [ ] Handle API key missing (graceful degradation — no commentary)
- [ ] 🔑 **Commentary is reliable, responsive, and safe**

### Milestone 14: Move Commentary UI
⏱ 2 days

- [ ] Create `CommentaryPanel.tsx`:
  - Real-time commentary after moves
  - Commentary levels: Beginner / Intermediate / Advanced
  - Typing animation for AI text (Framer Motion)
  - Collapsible panel on mobile
- [ ] Create `CommentaryBubble.tsx` — inline board annotation
- [ ] Create `MoveGrade.tsx` — grade icon (brilliant, good, mistake, blunder)
- [ ] Settings toggle: Commentary ON/OFF, level selector
- [ ] 🔑 **Every move can be explained in plain language**

### Milestone 15: Post-Game Analysis
⏱ 3 days

- [ ] Create `AnalysisPage` at `app/(main)/analysis/page.tsx`
- [ ] Create `PostGameSummary.tsx`:
  - Game result, accuracy %, top moves, blunders
  - Accuracy comparison (player vs Stockfish)
- [ ] Create `MoveNavigator.tsx` — step through game with arrows
- [ ] Create `AnalysisPanel.tsx`:
  - Side-by-side board and analysis
  - Engine eval at each move
  - Gemini commentary at key moments
- [ ] Create `EvalGraph.tsx` — chart of evaluation over time
- [ ] 🔑 **Complete post-mortem with engine + AI**

### Milestone 16: Chat Interface
⏱ 2 days

- [ ] Create `ChatPanel.tsx`:
  - Chat history with message bubbles
  - Input bar with send button
  - Loading indicator for AI response
- [ ] Chat context includes current position and game history
- [ ] Suggested questions ("Why was that a blunder?", "What should I have played?")
- [ ] Markdown rendering for AI responses
- [ ] Error handling (API down, rate limited, inappropriate content)
- [ ] 🔑 **Player can ask questions about their game in natural language**

---

## Phase 4: Polish & Experience (Milestones 17–21)

### Milestone 17: Settings & Preferences
⏱ 2 days

- [ ] Create Zustand `settingsStore` with persistence
- [ ] Board themes (classic, blue, green, dark)
- [ ] Piece sets (standard, neo, wood, animated)
- [ ] Sound effects (move, capture, check, game-over, notification)
- [ ] Commentary level and on/off
- [ ] Engine depth and auto-analysis toggle
- [ ] Clock settings (time control presets)
- [ ] Reset settings button
- [ ] 🔑 **Every preference is persisted and reactive**

### Milestone 18: Animations & Micro-interactions
⏱ 2 days

- [ ] Framer Motion animations:
  - Piece movement (smooth slide on drop)
  - Capture (piece fade + scale)
  - Check indicator (pulse animation)
  - Promotion dialog (scale + fade)
  - Move history scroll (auto-scroll)
  - Eval bar transitions
  - Commentary text reveal
  - Page transitions
- [ ] Loading states (skeleton screens for analysis)
- [ ] Empty states (no games yet, no analysis yet)
- [ ] Error states with recovery actions
- [ ] 🔑 **Every interaction feels polished**

### Milestone 19: Mobile Experience
⏱ 2 days

- [ ] Touch-optimized drag-and-drop for mobile
- [ ] Responsive board sizing (fills width, maintains aspect ratio)
- [ ] Bottom sheet for game sidebar on mobile
- [ ] Swipe gestures for move navigation
- [ ] Mobile-safe touch targets (min 44px)
- [ ] Landscape optimization
- [ ] Test on real devices (iOS Safari, Android Chrome)
- [ ] 🔑 **Equal experience on desktop and mobile**

### Milestone 20: PGN Import/Export
⏱ 1 day

- [ ] PGN import: parse PGN text → load into game
- [ ] PGN export: copy to clipboard, download as file
- [ ] PGN validation with user-friendly error messages
- [ ] Support for standard PGN headers (Event, Site, Date, Round, White, Black, Result)
- [ ] 🔑 **Interoperable with other chess tools**

### Milestone 21: Performance Optimization
⏱ 2 days

- [ ] Bundle analysis and optimization
- [ ] Code-split Stockfish Worker (load on first analysis, not page load; Worker creation is lazy)
- [ ] Lazy-load Gemini SDK (load when user opens chat)
- [ ] Memoize board components (React.memo, useMemo for legal moves)
- [ ] Virtualize move history (if > 100 moves)
- [ ] Analyze and fix layout shifts
- [ ] Lighthouse audit — target 90+ Performance score
- [ ] 🔑 **Metrics prove performance targets are met**

---

## Phase 5: Quality & Release (Milestones 22–24)

### Milestone 22: Testing Suite
⏱ 3 days

- [ ] Unit tests for all `lib/chess/` functions (100% coverage)
- [ ] Unit tests for all `lib/engine/` functions (mock Worker)
- [ ] Unit tests for all Zustand stores
- [ ] Integration tests for game flow (select → drag → move → update)
- [ ] Integration tests for Stockfish → eval pipeline
- [ ] E2E tests for critical paths (play a game, analyze a game)
- [ ] Accessibility tests (keyboard navigation, screen reader, ARIA)
- [ ] 🔑 **CI pipeline enforces test pass before merge**

### Milestone 23: Edge Cases & Error Handling
⏱ 2 days

- [ ] Handle Stockfish Web Worker crash → auto-restart
- [ ] Handle Gemini API timeout → fallback message
- [ ] Handle localStorage full → graceful degradation
- [ ] Handle browser tab visibility → pause engine
- [ ] Handle offline → disable Gemini, Stockfish still works
- [ ] Handle very long games (200+ moves) → performance check
- [ ] Handle promotion on mobile → responsive dialog
- [ ] Handle draw by agreement → both players must confirm
- [ ] 🔑 **Platform handles failure gracefully in every scenario**

### Milestone 24: Production Readiness
⏱ 2 days

- [ ] Configure environment variables (NEXT_PUBLIC_GEMINI_API_KEY)
- [ ] Vercel deployment configuration
- [ ] Analytics integration (Vercel Analytics or PostHog)
- [ ] Error tracking (Sentry)
- [ ] CSP headers configuration
- [ ] SEO metadata for all routes
- [ ] Open Graph images per route
- [ ] Final Lighthouse audit (target 95+)
- [ ] Performance budget enforcement
- [ ] Create production checklist
- [ ] 🔑 **Ready for public launch**

---

## Phase 6: Post-Launch (Milestone 25+)

### Milestone 25: Launch & Monitor
⏱ Ongoing

- [ ] Deploy to production
- [ ] Monitor error rates, performance, user engagement
- [ ] Collect feedback
- [ ] Iterate on commentary quality
- [ ] Fix discovered issues
- [ ] 🔑 **Live platform with real users**

### Future Milestones (not yet scoped)
- [ ] Puzzle mode (tactic trainer)
- [ ] Opening explorer with ECO database
- [ ] User accounts and cloud sync
- [ ] Game history with search
- [ ] Multiplayer (WebSocket)
- [ ] Tournament mode
- [ ] Coach / classroom features
- [ ] Streaming mode (Twitch integration)
- [ ] Mobile app (PWA → native)
- [ ] Stockfish NNUE for stronger analysis

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Stockfish WASM fails on some browsers | Low | High | Use single-threaded lite build (nmrugg) — no pthreads/SharedArrayBuffer needed. Covers all modern browsers. Fallback to server-side analysis if needed. |
| Gemini API costs exceed budget | Medium | Medium | Cache responses, rate-limit, offer tiers |
| Web Worker not supported | Low | Medium | Polyfill or inline execution |
| Large WASM binary (~7 MB lite) | Medium | Medium | Lazy-load Worker, show loading state, compress; lite build is smaller than full build (~100 MB) |
| Prompt injection → Gemini outputs a move | Low | Critical | Output guardrails, validate response before rendering |
| chess.js performance with 100+ move game | Low | Low | Limit history length, virtualize |
