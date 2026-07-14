# Personalities

## Purpose

Defines the personality system that controls the tone, humour, aggression level, and reaction style of the AI commentary. Each personality is a distinct "character" that players can choose as their AI commentator.

## Responsibilities

- Define the `Personality` type shape
- Provide built-in personality definitions (at least 4)
- Define emoji reaction sets per personality
- Define reaction templates for game events (blunders, checkmates, victories, etc.)
- Document how new personalities are added

## Future Files

| File | Purpose |
|---|---|
| `personality-builder.ts` | Factory functions for constructing custom personalities |
| `personality-presets.ts` | Additional preset personalities (seasonal, themed) |

## Dependencies

- `lib/ai/types/index.ts` — ReactionType, CommentaryLevel
