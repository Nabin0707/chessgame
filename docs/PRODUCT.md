# Product Overview — AI Chess Platform

## Vision

Create the world's most entertaining AI-powered chess experience. A platform where players of every skill level — from complete beginners to tournament competitors — can play, learn, and fall in love with chess through intelligent, personalized, and delightful interactions.

## Mission

To make chess accessible, engaging, and deeply rewarding by combining world-class chess engine analysis with natural-language AI commentary that explains, teaches, and entertains.

## Core Experience

A player opens the platform and within seconds is facing an opponent that:

- **Plays strong chess** via Stockfish WASM running entirely in the browser
- **Explains itself** via Gemini-powered natural-language commentary that adapts to the player's skill level
- **Grows with them** — adjustable difficulty, post-game analysis, personalized insights
- **Respects their time** — instant load, no server round-trips for moves, works offline-capable

## Target Audience

| Persona | Needs | Experience |
|---|---|---|
| **Casual Learner** | Friendly AI, move explanations, no account needed | Never played or knows basic rules |
| **Club Player** | Adjustable Stockfish strength, post-game analysis, PGN export | 800–1800 Elo |
| **Competitive Player** | Deep analysis, opening explorer, engine evaluation bar | 1800+ Elo |
| **Coach / Parent** | Share games, analyze student games, export PGN | Technical but chess-interested |

## Core Principles

1. **Chess integrity first.** Stockfish is the sole chess engine. Gemini provides commentary — never moves.
2. **Performance is a feature.** The board loads instantly. Stockfish runs in a Web Worker — no server dependency for moves.
3. **Privacy by design.** No account required to play. Game data stored locally by default.
4. **Progressive enhancement.** Full experience on desktop and mobile. Touch-optimized board interactions.
5. **Delight in every interaction.** Smooth animations, satisfying move sounds, thoughtful micro-interactions.

## Success Metrics

| Metric | Target | Why |
|---|---|---|
| Time to first move | < 2 seconds | First impression is everything |
| Board FPS | 60 FPS | Smooth drag-and-drop is table stakes |
| Stockfish response time (depth 12) | < 3 seconds | Players won't wait for engine |
| Session retention | > 15 min average | Indicates genuine engagement |
| Move explanation CTR | > 30% | Gemini commentary is our differentiator |
| Page load (LCP) | < 1.5 seconds | Mobile-first performance |

## Competitive Landscape

| Platform | Strength | Gap |
|---|---|---|
| **chess.com** | Massive user base, lessons, puzzles | Heavy subscription model, no AI commentary |
| **lichess.org** | Free, open-source, fast | Sparse UI, no AI coach, limited explanations |
| **Our Platform** | AI-powered commentary, instant play, modern UX | New entrant, building audience |

## Differentiators

1. **Gemini-powered move commentary** — natural-language explanations of why a move is good/bad, tailored to the player's level
2. **Zero server dependency for core play** — Stockfish runs locally via WebAssembly. Games work offline.
3. **Modern, opinionated UX** — Framer Motion animations, shadcn/ui design system, mobile-first responsive layout
4. **Privacy-first** — no account needed. Optional cloud sync for power users.
5. **Engine-powered coaching** — Stockfish analysis + Gemini explanation = instant tutoring

## User Stories

### Casual (no account)
- "I want to click 'Play' and start a game immediately"
- "I want the AI to explain what I did wrong in simple words"
- "I want to adjust difficulty without understanding chess ratings"

### Intermediate (optional account)
- "I want to analyze my game move by move with the engine"
- "I want AI to point out my biggest mistakes"
- "I want to export my game as PGN"
- "I want to see my rating improve over time"

### Advanced
- "I want deep Stockfish analysis with multiple variations"
- "I want to study specific openings"
- "I want to set custom time controls"
- "I want an evaluation bar that's as good as my desktop GUI"

### Coach / Parent
- "I want to review a game my student played, move by move"
- "I want AI to generate a plain-language summary of mistakes"
- "I want to share game links with others"
