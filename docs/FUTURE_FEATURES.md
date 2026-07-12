# Future Features — AI Chess Platform

This document catalogs ideas for post-MVP features. Each entry has a status and brief notes to prevent scope creep during initial development.

---

## Short Term (Post-MVP, Next 3 Months)

### Puzzle Mode
Tactic training with curated puzzles by theme and rating.

- FEN + solution sequence from puzzle database
- Rating progression (Glicko-like for puzzles)
- Themes: fork, pin, skewer, sacrifice, checkmate, endgame
- Daily puzzle featured on landing page
- Streak tracking

### Opening Explorer
Visual tree of opening lines with ECO classification.

- Search by opening name (Italian, Sicilian, etc.)
- Move-by-move tree navigation
- Win/loss/draw statistics per line
- Bookmark favorite openings

### Game Import / Export
Full PGN interoperability.

- Paste PGN from clipboard → load into analysis
- Download game as PGN file
- Import multiple games (batch)
- Export with engine evaluations embedded as comments

### User Accounts
Optional accounts for cloud features.

- Email + password registration (Argon2 hashing)
- OAuth (Google, GitHub)
- Username + avatar
- Rating tracking (Glicko-2)
- Game history synced across devices

---

## Medium Term (3–6 Months)

### Multiplayer (Real-Time)
Play against humans over WebSocket.

- Matchmaking by rating range and time control
- Live clock sync
- Draw offers, resignation
- Rematch option
- Spectator mode
- Anti-cheat: server validates all moves via chess.js

### Cloud Game Sync
Games saved to cloud when signed in.

- Automatic sync on game completion
- Access games from any device
- Share game links with viewers
- Embeddable game viewer (iframe)

### Stockfish Deep Analysis (Server-Side)
Heavy analysis on server for depth beyond what runs in browser.

- Request deep analysis (depth 30+) on server
- Server-side Stockfish with NNUE
- Async job queue with webhook notification
- Eval graph with engine commentary at key moments

### Coach / Classroom Mode
Tools for teaching chess.

- Create student accounts (no email required)
- Assign puzzles and track completion
- Review student games with annotation
- AI-generated skill assessment
- Lesson plans with themed puzzle sets

---

## Long Term (6–12 Months)

### Tournament System
Automated tournaments with brackets.

- Swiss system or round-robin
- Time control per round
- Standings, pairings, and results
- Live broadcast of top boards

### Streaming Mode
Integration for content creators.

- Streamer overlay (board + chat + eval bar)
- OBS browser source support
- Auto-highlight best moves for audience
- Twitch extension (future)

### PWA / Mobile App
Native-quality mobile experience.

- Offline play (already supported by architecture)
- Install prompt (PWA)
- Haptic feedback for moves
- Push notifications (move alerts, daily puzzle)
- App Store / Play Store (TWA wrapper)

### Opening Repertoire Trainer
Build and practice your opening repertoire.

- Add lines to your repertoire
- Spaced-repetition drilling
- Highlight when you deviate from book
- Opponent's most common responses

### Endgame Trainer
Practice specific endgame positions.

- Tablebase integration (Syzygy, 7-piece)
- "Play this endgame against Stockfish"
- Endgame classification (K+P vs K, Rook endgames, etc.)
- Win/draw/loss percentage from tablebase

### Clubs & Teams
Social features.

- Create a club (name, description, logo)
- Club leaderboard and tournaments
- Team matches
- Club puzzles and challenges

### AI Coaching Plan
Subscription-based personalized coaching.

- Weekly skill assessment
- Personalized puzzle recommendations
- Mistake pattern analysis ("You blunder with your queen in 30% of games")
- AI-generated study plan

### Game Database
Searchable database of played games.

- Full-text search of PGN
- Filter by opening, opponent, result, date
- Stats dashboard (accuracy trend, opening performance)
- Export all data (GDPR export)

---

## Features Considered and Rejected

| Feature | Reason for Rejection |
|---|---|
| **Chess variants (960, Bughouse, etc.)** | Adds complexity. Focus on standard chess excellence. |
| **Custom board themes marketplace** | Too early. User-generated content is a moderation burden. |
| **Stockfish vs Stockfish mode** | Niche. Low engagement for development cost. |
| **Play against Gemini** | Violates core principle: Gemini never decides moves. |
| **Blockchain / NFTs** | No product value. Distraction from core experience. |
| **Desktop app (Electron)** | PWA covers mobile. Desktop web is sufficient. |

---

## Feature Prioritization Matrix

```
                     High Impact
                         |
    Puzzle Mode          |  Multiplayer
    Opening Explorer     |  Game Sync
    PGN Import/Export    |  Deep Analysis
                         |
        Easy ────────────┼──────────── Hard
                         |
    Streaming Mode       |  Tournament System
    Club Features        |  AI Coaching Plan
    Endgame Trainer      |  Opening Repertoire
                         |
                     Low Impact
```

**Next up**: Puzzle Mode and Opening Explorer — highest impact for lowest development cost.
