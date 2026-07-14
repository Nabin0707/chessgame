# AI Types

## Purpose

Defines all TypeScript interfaces and type aliases for the AI commentary system. These types describe the shape of every object that flows through the AI pipeline — messages, context, evaluations, requests, responses, memories, personality profiles, and prompt templates.

## Responsibilities

- Provide shared type contracts across all AI subsystems
- Define the request/response types for the future Gemini integration
- Define context types that aggregate game state, engine evaluation, and player info
- Define the personality, memory, and prompt template type systems
- Ensure type safety at every stage of the AI pipeline

## Future Files

| File | Purpose |
|---|---|
| `validators.ts` | Runtime type guards / zod schemas for AI response validation |
| `constants.ts` | Shared AI constants (max context lengths, rate limits, default values) |

## Dependencies

- `types/chess.ts` — GameStatus, Color, Square, Move types
- `types/engine.ts` — EvalScore, SearchOptions types
