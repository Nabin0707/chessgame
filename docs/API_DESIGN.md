# API Design — AI Chess Platform

## Design Philosophy

The current platform runs entirely client-side: chess.js manages game state, Stockfish runs in a Web Worker, and Gemini runs via the browser SDK. There is **no backend API** for the MVP.

This document describes the **future API surface** for features that require a server (multiplayer, cloud sync, user accounts, game sharing). Designing these contracts now prevents frontend assumptions that would require painful refactoring later.

---

## REST API (Future)

Base URL: `https://api.ai-chess.com/v1`

### Authentication

```
POST /v1/auth/register
POST /v1/auth/login
POST /v1/auth/refresh
POST /v1/auth/logout

Headers:
  Authorization: Bearer <jwt-token>
  Content-Type: application/json
```

### Users

```
GET    /v1/users/me              -> Current user profile
PATCH  /v1/users/me              -> Update profile
GET    /v1/users/me/stats        -> Game statistics (win/loss/draw, rating history)
DELETE /v1/users/me              -> Delete account

Response: User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  rating: {
    rapid: number;
    blitz: number;
    classical: number;
    puzzle: number;
  };
  createdAt: string;
}
```

### Games

```
POST   /v1/games                 -> Create a new game (vs AI or human)
GET    /v1/games                 -> List user's games (paginated)
GET    /v1/games/:id             -> Get game details + full PGN
DELETE /v1/games/:id             -> Delete a game
PATCH  /v1/games/:id             -> Update game metadata (name, visibility)

Query params for GET /v1/games:
  ?page=1
  &limit=20
  &result=win|loss|draw
  &opening=italian
  &dateFrom=2026-01-01
  &dateTo=2026-07-12
  &sortBy=date|rating|opponent
  &sortOrder=asc|desc

Response: Game {
  id: string;
  pgn: string;
  fen: string;
  result: '1-0' | '0-1' | '1/2-1/2' | '*';
  players: {
    white: { id: string; username: string; rating: number };
    black: { id: string; username: string; rating: number };
  };
  timeControl: { initial: number; increment: number };
  playedAt: string;
  analysis?: {
    accuracy: { white: number; black: number };
    topMoves: number;
    blunders: number;
  };
}

Request body (POST /v1/games):
{
  opponentType: 'ai' | 'human';
  opponentId?: string;
  timeControl: { initial: number; increment: number };
  color?: 'white' | 'black' | 'random';
  aiDifficulty?: number; // Stockfish depth
}
```

### Analysis

```
POST /v1/analysis               -> Request server-side engine analysis (deep)
GET  /v1/analysis/:id            -> Get analysis results
GET  /v1/analysis/:id/graph      -> Get evaluation graph data

Request body:
{
  pgn: string;
  depth?: number;       // default 22
  multiPv?: number;     // default 1, max 5
}

Response: Analysis {
  id: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  evals: {
    moveNumber: number;
    fen: string;
    score: { type: 'cp' | 'mate'; value: number };
    depth: number;
    bestLine: string[];
    multiPv?: { score: { type: 'cp' | 'mate'; value: number }; line: string[] }[];
  }[];
  summary: {
    accuracy: { white: number; black: number };
    criticalMoments: { moveNumber: number; description: string }[];
    blunders: { moveNumber: number; side: 'white' | 'black'; move: string }[];
  };
}
```

### AI Commentary (Server-side)

```
POST /v1/ai/analyze-game         -> Full AI game analysis (Gemini)
POST /v1/ai/explain-move         -> Explain a single move
POST /v1/ai/chat                 -> Conversational AI coaching

Rate limits:
  10 requests/min (unauthenticated)
  60 requests/min (authenticated)
  300 requests/min (premium)
```

### Puzzles

```
GET    /v1/puzzles               -> List puzzles (paginated, filterable)
GET    /v1/puzzles/:id           -> Get puzzle details
POST   /v1/puzzles/:id/attempt   -> Submit an attempt
GET    /v1/puzzles/daily         -> Daily puzzle

Puzzle:
{
  id: string;
  fen: string;
  rating: number;
  themes: string[];
  moves: string[];          // Solution sequence
  instruction: string;
  popularity: number;
}
```

---

## WebSocket API (Future — Multiplayer)

Endpoint: `wss://api.ai-chess.com/v1/ws`

### Connection

```
-> { type: "auth", token: "<jwt>" }
<- { type: "auth_ok", userId: "<id>" }
```

### Matchmaking

```
-> { type: "find_game", timeControl: { initial: 300, increment: 3 }, ratingRange: [1200, 1400] }
<- { type: "match_found", gameId: "<id>", color: "white", opponent: {...} }
<- { type: "match_cancelled", reason: "opponent_disconnected" }
```

### Game Play

```
<- { type: "game_start", gameId, white, black, timeControl, initialFen }
-> { type: "move", gameId, from: "e2", to: "e4", promotion?: "q", clientMoveTime: 1234 }
<- { type: "move", gameId, from, to, promotion, fen, pgn, clock: { white, black } }
<- { type: "game_over", result, reason, pgn }
-> { type: "resign", gameId }
-> { type: "draw_offer", gameId }
<- { type: "draw_offer", gameId, from: "opponent" }
-> { type: "draw_response", gameId, accept: true }
<- { type: "draw_accepted", gameId }
-> { type: "rematch", gameId }
```

### Analysis Sync

```
<- { type: "analysis_update", gameId, moveNumber, eval, depth, bestLine }
```

---

## Internal Client APIs (Current — No Server)

These are the APIs consumed by the UI, served entirely client-side:

```
// lib/chess/engine.ts
createGame(initialFen?: FEN): Chess
makeMove(chess: Chess, from: Square, to: Square, promotion?: PieceType): MoveResult
getLegalMoves(chess: Chess, square?: Square): Move[]
isCheck(chess: Chess): boolean
isCheckmate(chess: Chess): boolean
isStalemate(chess: Chess): boolean
isDraw(chess: Chess): DrawReason | null
getStatus(chess: Chess): GameStatus
getFen(chess: Chess): FEN
getPgn(chess: Chess): PGN
loadPgn(pgn: PGN): Chess
undoMove(chess: Chess): Chess | null

// lib/engine/stockfish.ts
initEngine(): Promise<void>
setPosition(fen: FEN): void
goSearch(options: SearchOptions): void
stop(): void
onEvaluation(callback: (eval: EngineEval) => void): void
onBestMove(callback: (move: string) => void): void
setOption(name: string, value: string): void
destroy(): void

// lib/ai/gemini.ts
explainMove(move: string, fen: FEN, context: CommentaryContext): Promise<Commentary>
analyzeGame(pgn: PGN): Promise<GameAnalysis>
explainPosition(fen: FEN, history: string[]): Promise<PositionAnalysis>
chat(message: string, context: ChatContext): Promise<ChatResponse>
```

---

## Error Response Format (Future)

```json
{
  "error": {
    "code": "INVALID_MOVE",
    "message": "The move e2-e5 is not legal in this position.",
    "details": {
      "fen": "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
      "attemptedMove": "e2e5",
      "legalMoves": ["e2e4", "e2e3", "d2d4", "d2d3", "..."]
    }
  }
}
```

Error codes: `INVALID_MOVE`, `GAME_NOT_FOUND`, `UNAUTHORIZED`, `RATE_LIMITED`, `ANALYSIS_TIMEOUT`, `ENGINE_ERROR`, `AI_UNAVAILABLE`, `VALIDATION_ERROR`.

---

## Versioning

- API version in URL path: `/v1/`
- Breaking changes → new version (`/v2/`)
- Non-breaking additions allowed within version
- Deprecated endpoints announced with `Sunset` header
