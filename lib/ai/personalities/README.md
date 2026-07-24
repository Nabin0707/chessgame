# AI Personality Engine

Modular personality system for chess commentary. Each personality defines a unique character with distinct tone, humour, competitiveness, and speaking style.

## Architecture

```
Personality Engine
  │
  ├── types.ts              — PersonalityDefinition, PersonalityId, traits
  ├── base.ts               — Shared defaults, style builders, safety constraints
  ├── registry.ts           — getPersonality(), getAllPersonalities()
  ├── engine.ts             — buildPersonalityPrompt(), buildUserPrompt()
  │
  ├── personalities/
  │   ├── coach.ts          — Educational, encouraging, patient
  │   ├── grandmaster.ts    — Professional, precise, authoritative
  │   ├── sarcastic.ts      — Witty, playful, competitive
  │   ├── villain.ts        — Dramatic, theatrical, overconfident
  │   └── friend.ts         — Casual, warm, relaxed
  │
  └── index.ts              — Barrel exports
```

## Usage

```typescript
import { buildFullPrompt, getPersonality } from "@/lib/ai/personalities";

// Build a complete prompt for Gemini
const { systemPrompt } = buildPersonalityPrompt("sarcastic", "blunder");

// Get a personality definition
const persona = getPersonality("coach");
console.log(persona.name); // "Coach"
```

## How It Works

1. **Registry** maps personality IDs to definitions
2. **Engine** builds system prompts by composing: identity → style → constraints → event reaction
3. **User prompt** is built separately — game data never mixes with personality logic
4. The combined prompt is sent to Gemini

## Adding a Personality

1. Create `personalities/your-name.ts` with a `PersonalityDefinition`
2. Import it in `registry.ts` and add to the `REGISTRY` map
3. Done — no other changes needed
