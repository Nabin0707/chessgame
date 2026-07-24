# Player Memory & Adaptive Commentary

## Architecture

```
lib/ai/memory/
│
├── types.ts           — Data shapes (GameRecord, PlayerStatistics, PlayerProfile, MemoryData)
├── types-legacy.ts    — Original M7 memory interfaces (ConversationMemory, GameMemory, etc.)
├── storage.ts         — localStorage persistence (load, save, export, import, reset)
├── statistics.ts      — Pure functions (profile generation, streak calc, accuracy estimate)
├── tracker.ts         — Record game events and play style observations
├── memory-engine.ts   — Orchestrator (buildMemoryContext() → summary string for prompts)
├── index.ts           — Barrel exports
└── README.md          — This file
```

## Flow

1. **Tracker** records completed games (outcome, opening, mistakes, patterns) into `MemoryData`
2. **Storage** persists `MemoryData` to localStorage
3. **Memory Engine** builds a natural-language summary from the data
4. **Workspace** reads memory context and sends it alongside commentary requests
5. **Gemini** receives the player profile + recent history and references it naturally

## Key Types

- `PlayerProfile` — High-level assessment (level, playStyle, favouriteOpening, weaknesses)
- `MemoryContext` — The string injected into Gemini prompts
- `MemoryData` — Full persisted state (versioned for migration)

## API

```typescript
import { loadMemory, recordGame, buildMemoryContext } from "@/lib/ai/memory";

// Record a game
const memory = loadMemory();
const updated = recordGame(memory, { outcome: "win", opening: "Italian Game", ... });
saveMemory(updated);

// Build context for commentary
const ctx = buildMemoryContext();
// ctx.summary → "Player is Intermediate level with 15 games played..."
```
