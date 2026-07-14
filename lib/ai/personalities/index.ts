/**
 * Personalities — lib/ai/personalities/index.ts
 *
 * Personality system for AI commentary.  Defines tone,
 * humour, aggression, and reaction templates.
 */
export { BUILT_IN_PERSONALITIES, DEFAULT_PERSONALITY, PERSONALITY_MAP } from "./personalities";
export type {
  AggressionLevel,
  EmojiStyle,
  HumorLevel,
  Personality,
  PersonalityRegistry,
  ReactionTemplates,
  Tone,
} from "./types";
