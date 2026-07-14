# AI Module

## Purpose

The AI module is the foundation for all Gemini-powered features in the AI Chess Platform. It provides the type system, pipeline architecture, personality system, prompt templates, memory management, context construction, and output formatting that the Gemini integration layer will use.

**This module contains NO Gemini API calls.** It is purely the architectural skeleton — interfaces, types, and pipeline definitions that describe how information will flow between subsystems.

## Responsibilities

- Define the complete type system for AI commentary, analysis, and chat
- Design the data pipeline from player move → context → prompt → Gemini → formatter → UI
- Define personality system that controls tone, humor, and reaction style
- Define prompt template system for building constrained AI prompts
- Define memory system for conversation context and game history
- Define context construction from game state, engine evaluation, and player profile
- Define output formatting for AI responses

## Module Structure

```
lib/ai/
  README.md          # This file
  index.ts           # Public API re-exports
  types/             # Core AI type definitions
  personalities/     # Personality system (tone, humor, reactions)
  prompts/           # Prompt template definitions
  memory/            # Conversation and game memory interfaces
  context/           # Context builder interfaces
  formatter/         # Output formatting interfaces
```

## Dependencies

| Dependency | Purpose |
|---|---|
| `lib/chess/` | Game state, FEN, PGN, move history |
| `lib/engine/` | Stockfish evaluation scores |
| `types/engine.ts` | EvalScore type |
| `types/chess.ts` | Game status, color types |

## Design Principles

1. **No Gemini code.** This module defines the shape of the integration — it does not implement it.
2. **Interfaces only, no implementations.** Every module in `lib/ai/` defines types and contracts, not concrete logic.
3. **No React imports.** AI logic is framework-agnostic, consistent with `lib/chess/` and `lib/engine/`.
4. **Validation-first.** Every output path assumes a validation layer will verify Gemini responses before they reach the UI.
5. **Personality-aware.** All prompts and reactions are parameterised by the selected personality at runtime.
