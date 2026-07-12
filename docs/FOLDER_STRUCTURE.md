# Folder Structure — AI Chess Platform

```
src/
│
├── app/                                # Next.js App Router
│   ├── (main)/                         # Route group — main app layout
│   │   ├── play/                       #   /play — Play vs AI or human
│   │   │   └── page.tsx
│   │   ├── analysis/                   #   /analysis — Post-game / live analysis
│   │   │   └── page.tsx
│   │   ├── puzzles/                    #   /puzzles — Tactic training (future)
│   │   │   └── page.tsx
│   │   ├── games/                      #   /games — Game history (future)
│   │   │   └── page.tsx
│   │   ├── settings/                   #   /settings — User preferences
│   │   │   └── page.tsx
│   │   ├── layout.tsx                  #   Main app layout (header, nav)
│   │   └── page.tsx                    #   / — Landing / lobby
│   ├── layout.tsx                      # Root layout (fonts, providers, globals)
│   ├── providers.tsx                   # ThemeProvider + other context providers
│   ├── globals.css                     # Tailwind imports + shadcn CSS variables
│   ├── robots.ts                       # robots.txt generation
│   ├── sitemap.ts                      # XML sitemap generation
│   └── not-found.tsx                   # 404 page
│
├── components/
│   ├── ui/                             # shadcn/ui primitives (auto-generated)
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── tabs.tsx
│   │   ├── tooltip.tsx
│   │   └── ...                         # Other shadcn primitives
│   ├── board/                          # Board-specific components
│   │   ├── chess-board.tsx             #    react-chessboard wrapper
│   │   ├── square.tsx                  #    Individual square (coords, highlight)
│   │   ├── piece.tsx                   #    Piece rendering (Unicode / SVG)
│   │   ├── move-indicators.tsx         #    Legal move dots / highlights
│   │   ├── promotion-dialog.tsx        #    Pawn promotion picker
│   │   └── check-indicator.tsx         #    Check animation overlay
│   ├── game/                           # Game UI components
│   │   ├── game-layout.tsx             #    Orchestrates board + sidebar
│   │   ├── game-controls.tsx           #    New game, resign, draw, undo
│   │   ├── game-info.tsx               #    Player names, rating, game status
│   │   ├── move-history.tsx            #    Scrollable PGN notation
│   │   ├── captured-pieces.tsx         #    Material advantage display
│   │   ├── clock.tsx                   #    Chess clock with increment
│   │   ├── game-result.tsx             #    End-of-game overlay
│   │   ├── draw-dialog.tsx             #    Draw offer confirmation
│   │   └── resign-dialog.tsx           #    Resign confirmation
│   ├── analysis/                       # Analysis-focused components
│   │   ├── analysis-layout.tsx         #    Analysis page layout
│   │   ├── analysis-panel.tsx          #    Side panel (eval + moves + commentary)
│   │   ├── move-navigator.tsx          #    Step through moves (arrows + slider)
│   │   ├── eval-bar.tsx                #    Vertical evaluation bar
│   │   ├── eval-graph.tsx              #    Game evaluation chart
│   │   ├── best-line.tsx               #    Top engine line display
│   │   ├── multi-pv-display.tsx        #    Multiple engine variations
│   │   └── engine-controls.tsx         #    Depth, stop/start engine
│   ├── ai/                             # AI commentary components
│   │   ├── chat-panel.tsx              #    Chat interface for AI coach
│   │   ├── chat-message.tsx            #    Single message bubble
│   │   ├── chat-input.tsx              #    Chat input with send
│   │   ├── commentary-bubble.tsx       #    Inline move commentary
│   │   ├── move-grade.tsx              #    Brilliant / good / mistake / blunder
│   │   └── suggestion-card.tsx         #    Suggested questions chip row
│   ├── settings/                       # Settings components
│   │   ├── settings-panel.tsx          #    Settings page layout
│   │   ├── board-theme-selector.tsx    #    Board color/style picker
│   │   ├── piece-set-selector.tsx      #    Piece style picker
│   │   ├── sound-settings.tsx          #    Sound toggle + volume
│   │   ├── commentary-settings.tsx     #    AI commentary level + toggle
│   │   ├── clock-settings.tsx          #    Time control presets
│   │   └── engine-settings.tsx         #    Stockfish depth + analysis toggle
│   ├── puzzles/                        # Puzzle components (future)
│   │   ├── puzzle-board.tsx
│   │   ├── puzzle-info.tsx
│   │   └── puzzle-result.tsx
│   ├── games/                          # Game history components (future)
│   │   ├── game-list.tsx
│   │   ├── game-card.tsx
│   │   └── game-import.tsx
│   └── shared/                         # Truly reusable components
│       ├── loading-skeleton.tsx         #    Skeleton loaders
│       ├── empty-state.tsx             #    Empty state with illustration
│       ├── error-state.tsx             #    Error state with retry
│       ├── spinner.tsx                 #    Loading spinner
│       └── error-boundary.tsx          #    React error boundary
│
├── lib/
│   ├── chess/                          # Chess business logic (NO React imports)
│   │   ├── engine.ts                   #    chess.js wrapper API
│   │   ├── game.ts                     #    Game state machine
│   │   ├── fen.ts                      #    FEN utilities
│   │   ├── pgn.ts                      #    PGN import / export
│   │   ├── validation.ts              #    Move validation helpers
│   │   └── constants.ts               #    STARTING_FEN, PIECE_VALUES, Unicode maps
│   ├── engine/                         # Stockfish bridge (NO React imports)
│   │   ├── stockfish.ts               #    Web Worker wrapper
│   │   ├── evaluation.ts              #    Eval score parsing
│   │   ├── analysis.ts                #    Multi-variation analysis
│   │   ├── worker.ts                  #    Web Worker entry (separate chunk)
│   │   └── types.ts                   #    Engine types
│   ├── ai/                             # Gemini bridge (NO React imports)
│   │   ├── gemini.ts                   #    Gemini API client
│   │   ├── prompts.ts                  #    Prompt templates (constrained)
│   │   ├── commentary.ts              #    Commentary pipeline orchestration
│   │   ├── validation.ts              #    Output validation (reject moves)
│   │   └── types.ts                   #    AI response types
│   ├── store/                          # Zustand stores
│   │   ├── game-store.ts              #    Game state store
│   │   ├── engine-store.ts            #    Engine evaluation store
│   │   ├── settings-store.ts          #    User preferences store
│   │   ├── analysis-store.ts          #    Analysis session store
│   │   └── index.ts                   #    Re-exports
│   ├── utils/                          # General utilities
│   │   ├── cn.ts                       #    clsx + tailwind-merge
│   │   ├── time.ts                     #    Time formatting
│   │   └── sound.ts                   #    Sound effect management
│   └── db/                             # Database layer (future)
│       ├── schema.ts                   #    Drizzle schema definitions
│       ├── queries.ts                  #    Database query functions
│       └── client.ts                  #    Database client config
│
├── hooks/                              # React hooks
│   ├── use-chess.ts                   #    Bridge game store to board events
│   ├── use-engine.ts                  #    Bridge engine store to UI
│   ├── use-clock.ts                   #    Chess clock logic
│   ├── use-sound.ts                   #    Sound effect hook
│   ├── use-mobile.ts                  #    Mobile breakpoint detection
│   └── use-keyboard.ts               #    Keyboard shortcuts
│
├── types/                              # TypeScript type definitions
│   ├── chess.ts                       #    Square, Piece, Color, Move, GameStatus
│   ├── engine.ts                      #    EvalScore, EngineState, PV, SearchOptions
│   ├── ai.ts                          #    Commentary, AnalysisResult, ChatMessage
│   └── settings.ts                    #    User preferences types
│
├── public/
│   ├── sounds/                        # Sound effects
│   │   ├── move.mp3
│   │   ├── capture.mp3
│   │   ├── check.mp3
│   │   ├── castle.mp3
│   │   ├── promote.mp3
│   │   ├── game-end.mp3
│   │   └── notification.mp3
│   ├── pieces/                        # Custom piece SVGs (optional)
│   ├── favicon.ico
│   └── og-image.png
│
├── tests/                              # Integration and E2E tests
│   ├── integration/
│   │   ├── game-flow.test.ts          #    Full game lifecycle
│   │   └── engine-pipeline.test.ts    #    Stockfish integration
│   └── e2e/
│       ├── play-game.spec.ts          #    Playwright: play a full game
│       └── analyze-game.spec.ts       #    Playwright: analysis flow
│
└── workers/                            # Web Worker scripts
    └── stockfish.worker.ts             #    Stockfish WASM worker
```

## Directory Purpose Summary

| Directory | Purpose | React? | Notes |
|---|---|---|---|
| `app/` | Next.js pages and layouts | Yes | App Router conventions |
| `components/board/` | Chess board rendering | Yes | react-chessboard wrapper |
| `components/game/` | Game UI panels | Yes | Sidebar, controls, history |
| `components/analysis/` | Analysis tools | Yes | Eval, engine controls |
| `components/ai/` | AI commentary UI | Yes | Chat, bubbles, grades |
| `components/shared/` | Reusable UI patterns | Yes | Loading, empty, error states |
| `lib/chess/` | Chess logic | No | Pure functions, chess.js wrapper |
| `lib/engine/` | Stockfish bridge | No | Web Worker communication |
| `lib/ai/` | Gemini integration | No | API client, prompts, validation |
| `lib/store/` | Zustand state | No | Store definitions only |
| `hooks/` | React hooks | Yes | Bridge logic to UI |
| `types/` | TypeScript types | No | Shared across all modules |
| `workers/` | Web Worker scripts | No | Stockfish worker entry |
| `tests/` | Integration + E2E | Mix | Playwright + Vitest |
