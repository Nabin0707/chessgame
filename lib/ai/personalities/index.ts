/**
 * ──────────────────────────────────────────────────────────
 * Personality Engine  —  lib/ai/personalities/index.ts
 *
 * Barrel exports for the personality system.
 * ──────────────────────────────────────────────────────────
 */

// Types
export type {
  PersonalityDefinition,
  PersonalityId,
  PersonalityTone,
  PersonalityTraits,
  EmojiFrequency,
  ResponseLength,
  ReactionMap,
  PersonalitySettings,
} from "./types";

// Constants & helpers
export {
  DEFAULT_PERSONALITY_ID,
  RESPONSE_LENGTH_LIMITS,
  MIN_SENTENCES,
  GLOBAL_SAFETY_CONSTRAINTS,
  buildStylePrompt,
  buildConstraintsSection,
} from "./base";

// Registry
export {
  getPersonality,
  getAllPersonalities,
  getDefaultPersonality,
  hasPersonality,
  getPersonalityIds,
} from "./registry";

// Engine
export {
  buildPersonalityPrompt,
  buildUserPrompt,
  buildFullPrompt,
} from "./engine";
export type { BuiltPersonalityPrompt } from "./engine";

// Personalities
export { COACH } from "./personalities/coach";
export { GRANDMASTER } from "./personalities/grandmaster";
export { SARCASTIC } from "./personalities/sarcastic";
export { VILLAIN } from "./personalities/villain";
export { FRIEND } from "./personalities/friend";

// Settings
export {
  getPersonalitySetting,
  setPersonalitySetting,
  clearPersonalitySetting,
} from "./settings";
