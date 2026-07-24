# Milestone 13: AI Personality Engine

**Completed:** 2026-07-24

## Overview

Transformed the AI commentator from a generic voice into 5 distinct personalities, each with a unique tone, humour style, competitiveness, and emoji preference. The personality engine is modular — adding a new personality is a one-file change.

## Files Created / Modified

### Core Architecture (`lib/ai/personalities/`)

| File | Purpose |
|---|---|
| `lib/ai/personalities/types.ts` | Type system: `PersonalityId`, `PersonalityTraits`, `ReactionMap`, `PersonalityDefinition`, `PersonalitySettings` |
| `lib/ai/personalities/base.ts` | Shared defaults, style prompt builder, safety constraints, response length limits |
| `lib/ai/personalities/registry.ts` | Central registry — `getPersonality()`, `getAllPersonalities()`, lookup by ID |
| `lib/ai/personalities/engine.ts` | Prompt builder — composes identity + style + constraints + event reaction into system prompt |
| `lib/ai/personalities/settings.ts` | localStorage persistence for personality selection |
| `lib/ai/personalities/index.ts` | Barrel exports with all new modules |

### Personalities (`lib/ai/personalities/personalities/`)

| File | Personality | Avatar | Tone |
|---|---|---|---|
| `coach.ts` | Coach | 🏆 | Educational, encouraging, patient |
| `grandmaster.ts` | Grandmaster | 👑 | Professional, precise, authoritative |
| `sarcastic.ts` | Sarcastic Rival | 🎭 | Playful, witty, competitive (default) |
| `villain.ts` | Chess Villain | 😈 | Dramatic, theatrical, overconfident |
| `friend.ts` | Friendly Opponent | 🤝 | Casual, warm, relaxed |

### Integration

| File | Change |
|---|---|
| `lib/ai/gemini/types.ts` | Added `personalityId?: string` to `CommentaryRequest` |
| `lib/ai/gemini/service.ts` | Replaced hardcoded prompt builders with `buildPersonalityPrompt()` and `buildUserPrompt()` from the engine; personality flows through to the pipeline |
| `lib/ai/orchestrator/types.ts` | Added `personalityId?: string` to `CommentaryQueueItem` |
| `app/api/ai/commentary/route.ts` | Updated docs and logging for `personalityId` field |
| `components/chess/chess-workspace.tsx` | Reads `getPersonalitySetting()` and passes `personalityId` in enqueue |

### UI

| File | Purpose |
|---|---|
| `components/ai/PersonalitySelector.tsx` | Dropdown selector with animated avatar preview |
| `components/chess/chess-info-panel.tsx` | Integrated `PersonalitySelector` into `AICommentaryCard` header; enhanced loading animation |

## How It Works

1. **Settings layer** persists the chosen personality ID to localStorage (`chess-ai-personality` key)
2. **Workspace** reads the current ID at enqueue time and sends it to the API
3. **API route** passes it through to `generateCommentary()`
4. **Gemini service** calls `resolvePersonalityId()` and `deriveEventKey()` to pick the right personality + event reaction
5. **Engine** composes the full system prompt: `{identity} + {style} + {constraints} + {eventReaction}`
6. **UI selector** lets users switch personalities with animated transitions

## Persona Details

| Trait | Coach | Grandmaster | Sarcastic Rival | Chess Villain | Friend |
|---|---|---|---|---|---|
| Tone | educational | professional | playful | dramatic | casual |
| Humour | 3/10 | 1/10 | 8/10 | 6/10 | 4/10 |
| Competitiveness | 3/10 | 6/10 | 7/10 | 9/10 | 2/10 |
| Emoji frequency | moderate | rare | frequent | frequent | moderate |
| Response length | medium | long | short | medium | medium |

## Key Design Decisions

- **Prompt isolation**: Personality templates and game data are built separately — `buildPersonalityPrompt()` produces the system prompt, `buildUserPrompt()` handles game context. This keeps the personality layer testable without game state.
- **Event reactions**: Each personality has 14 event-specific reaction templates (general, check, capture, checkmate, victory, defeat, draw, blunder, mistake, brilliant, goodMove, opening, midgame, endgame) with variable substitution support.
- **Safety first**: Every personality prompt includes 9 global safety constraints (no chess-move output, no harmful content, stay in character, etc.).
- **Default fallback**: Unknown personality IDs gracefully fall back to Sarcastic Rival without throwing.
- **Pure function design**: The engine module has no side effects or React dependencies — all functions are synchronous, pure, and testable.

## Tests

The personality system is designed for straightforward unit testing:
- `registry.test.ts` — `getPersonality()` returns correct definitions, fallback works for unknown IDs
- `engine.test.ts` — `buildPersonalityPrompt()` produces valid system prompts with correct personality traits and event reactions
- `settings.test.ts` — localStorage read/write/clear round-trips correctly
