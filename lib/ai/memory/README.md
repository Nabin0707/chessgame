# Memory

## Purpose

Defines the memory system that tracks conversation context, game history, and player statistics across sessions. Memory is essential for the AI to maintain coherent, context-aware conversations and for the personality system to build a picture of the player's style and improvement over time.

## Responsibilities

- Define conversation memory interfaces (session-based message history)
- Define game memory interfaces (move-by-move records with evaluations)
- Define player statistics interfaces (aggregated across games)
- Define the memory injection contract for prompt construction

## Future Files

| File | Purpose |
|---|---|
| `conversation-memory.ts` | In-memory conversation store (ring buffer) |
| `game-memory.ts` | Game state memory for the current session |
| `player-memory.ts` | Persisted player statistics (localStorage) |
| `memory-builder.ts` | Assembles memory slices for prompt injection |

## Dependencies

- `lib/ai/types/index.ts` — MoveRecord, CommentRecord, AIMessage, PlayerStats
- `lib/ai/types/index.ts` — PipelineContext
