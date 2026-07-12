# Database Plan — AI Chess Platform

## Status

**MVP does not require a database.** All game state is managed client-side via Zustand with localStorage persistence. Games are playable offline.

This document defines the **future schema** for when cloud features are added: user accounts, game sync, puzzles, and multiplayer.

---

## Design Decisions

| Decision | Rationale |
|---|---|
| **PostgreSQL** | Mature, reliable, excellent JSON support, great tooling (Drizzle, Supabase) |
| **Drizzle ORM** | Type-safe, lightweight, no code generation, SQL-like syntax |
| **Supabase** | Recommended hosting: PostgreSQL + auth + real-time + storage in one product |
| **Neon** | Alternative: serverless PostgreSQL, branching for preview deploys |

## Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Game : plays
    User ||--o{ PuzzleAttempt : solves
    User ||--o{ Analysis : requests
    Game ||--o{ Move : contains
    Game ||--o{ Analysis : has
    Puzzle ||--o{ PuzzleAttempt : attempted_by

    User {
        uuid id PK
        string username UK
        string email UK
        string display_name
        string password_hash
        string avatar_url
        jsonb rating "{"rapid": 1500, "blitz": 1200, "classical": 1400, "puzzle": 1600}"
        jsonb preferences "{"board_theme": "classic", "piece_set": "standard", "sound_enabled": true}"
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_login_at
    }

    Game {
        uuid id PK
        uuid white_player_id FK
        uuid black_player_id FK
        text pgn
        string result "1-0 | 0-1 | 1/2-1/2 | *"
        string termination "checkmate | resignation | timeout | draw_agreement | stalemate"
        string time_control "{"initial": 600, "increment": 5}"
        int white_rating
        int black_rating
        string eco_code
        string opening_name
        boolean rated
        jsonb tags "["blitz", "tournament"]"
        timestamptz played_at
        timestamptz created_at
    }

    Move {
        uuid id PK
        uuid game_id FK
        int move_number
        string side "white | black"
        string from_square
        string to_square
        string promotion
        string san "e4 | Nf3 | O-O"
        string fen_before
        string fen_after
        int clock_seconds
        int eval_before
        int eval_after
        int eval_delta
        jsonb commentary "{"grade": "blunder", "text": "This loses material."}"
        timestamptz created_at
    }

    Analysis {
        uuid id PK
        uuid game_id FK
        uuid user_id FK
        int depth
        int multi_pv
        int accuracy_white
        int accuracy_black
        jsonb summary
        jsonb critical_moments
        jsonb blunders
        timestamptz created_at
    }

    Puzzle {
        uuid id PK
        string fen
        string[] solution "["e2e4", "d7d5", "e4d5"]"
        int rating
        string[] themes "["fork", "sacrifice", "checkmate"]"
        string instruction
        int popularity
        int attempts_count
        int solves_count
        timestamptz created_at
    }

    PuzzleAttempt {
        uuid id PK
        uuid puzzle_id FK
        uuid user_id FK
        boolean solved
        int time_seconds
        int moves_attempted
        timestamptz attempted_at
    }
```

---

## Schema Details

### Users

```sql
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(30) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  display_name  VARCHAR(100),
  password_hash VARCHAR(255) NOT NULL,
  avatar_url    TEXT,
  rating        JSONB NOT NULL DEFAULT '{"rapid": 1200, "blitz": 1200, "classical": 1200, "puzzle": 1200}',
  preferences   JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
```

### Games

```sql
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  white_player_id UUID REFERENCES users(id),
  black_player_id UUID REFERENCES users(id),
  pgn             TEXT NOT NULL,
  result          VARCHAR(8) NOT NULL CHECK (result IN ('1-0', '0-1', '1/2-1/2', '*')),
  termination     VARCHAR(32),
  time_control    JSONB,
  white_rating    INT,
  black_rating    INT,
  eco_code        VARCHAR(8),
  opening_name    VARCHAR(255),
  rated           BOOLEAN DEFAULT FALSE,
  tags            JSONB DEFAULT '[]',
  played_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_games_white ON games(white_player_id);
CREATE INDEX idx_games_black ON games(black_player_id);
CREATE INDEX idx_games_played_at ON games(played_at DESC);
CREATE INDEX idx_games_eco ON games(eco_code);
CREATE INDEX idx_games_result ON games(result);
```

### Moves

```sql
CREATE TABLE moves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id     UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  move_number INT NOT NULL,
  side        VARCHAR(5) NOT NULL CHECK (side IN ('white', 'black')),
  from_square VARCHAR(2),
  to_square   VARCHAR(2),
  promotion   VARCHAR(1),
  san         VARCHAR(16) NOT NULL,
  fen_before  VARCHAR(128) NOT NULL,
  fen_after   VARCHAR(128) NOT NULL,
  clock_seconds INT,
  eval_before INT,
  eval_after  INT,
  eval_delta  INT,
  commentary  JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_moves_game ON moves(game_id);
CREATE INDEX idx_moves_game_order ON moves(game_id, move_number, side);
```

### Analysis

```sql
CREATE TABLE analysis (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id         UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  depth           INT NOT NULL DEFAULT 22,
  multi_pv        INT NOT NULL DEFAULT 1,
  accuracy_white  REAL,
  accuracy_black  REAL,
  summary         JSONB,
  critical_moments JSONB,
  blunders        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analysis_game ON analysis(game_id);
CREATE INDEX idx_analysis_user ON analysis(user_id);
```

### Puzzles

```sql
CREATE TABLE puzzles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fen            VARCHAR(128) NOT NULL,
  solution       TEXT[] NOT NULL,
  rating         INT NOT NULL DEFAULT 1500,
  themes         TEXT[] NOT NULL DEFAULT '{}',
  instruction    TEXT NOT NULL,
  popularity     INT NOT NULL DEFAULT 0,
  attempts_count INT NOT NULL DEFAULT 0,
  solves_count   INT NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_puzzles_rating ON puzzles(rating);
CREATE INDEX idx_puzzles_themes ON puzzles USING GIN(themes);
```

### Puzzle Attempts

```sql
CREATE TABLE puzzle_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  puzzle_id       UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id),
  solved          BOOLEAN NOT NULL,
  time_seconds    INT,
  moves_attempted INT,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_puzzle_attempts_user ON puzzle_attempts(user_id);
CREATE INDEX idx_puzzle_attempts_puzzle ON puzzle_attempts(puzzle_id);
```

---

## Indexing Strategy

| Index | Purpose |
|---|---|
| `idx_games_played_at` DESC | Sort game history by date |
| `idx_games_eco` | Filter games by opening (ECO code) |
| `idx_moves_game_order` | Efficiently load moves in order for a game |
| `idx_puzzles_themes` GIN | Filter puzzles by theme (array contains) |
| `idx_puzzles_rating` | Order puzzles by difficulty |
| Composite on `(user_id, played_at)` | User game history queries |

## Migration Strategy

```bash
# Drizzle Kit commands (future)
npm run db:generate    # Generate migration from schema
npm run db:push        # Push to dev database
npm run db:migrate     # Apply migrations to production
npm run db:studio      # Drizzle Studio GUI
```

## Why No Database in MVP

1. **Zero setup** — players click "Play" and start. No signup friction.
2. **Works offline** — localStorage persists games on device.
3. **No infrastructure cost** — no servers, no database, no API.
4. **Stockfish runs locally** — no server-side compute needed.
5. **Gemini runs client-side** — API key in environment, direct from browser.

When we add accounts and cloud sync, we add the database. The game data model (FEN, PGN, moves) is stable and portable — localStorage games will migrate to the cloud via PGN import.
