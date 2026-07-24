/**
 * ──────────────────────────────────────────────────────────
 * Personality Types  —  lib/ai/personalities/types.ts
 *
 * Core type definitions for the AI Personality Engine.
 * Each personality defines a unique character that drives
 * the tone, style, and content of chess commentary.
 * ──────────────────────────────────────────────────────────
 */

/** Unique identifiers for all built-in personalities. */
export type PersonalityId =
  | "coach"
  | "grandmaster"
  | "sarcastic"
  | "villain"
  | "friend";

/** Tone categories a personality can use. */
export type PersonalityTone =
  | "educational"
  | "professional"
  | "playful"
  | "dramatic"
  | "casual";

/** How frequently emojis appear in commentary. */
export type EmojiFrequency = "frequent" | "moderate" | "rare" | "none";

/** Target length of commentary responses. */
export type ResponseLength = "short" | "medium" | "long";

/** Fixed traits that define a personality's character. */
export interface PersonalityTraits {
  /** Primary speaking tone. */
  tone: PersonalityTone;
  /** Humour level: 0 = none, 10 = maximum. */
  humorLevel: number;
  /** Competitiveness: 0 = friendly, 10 = intense. */
  competitiveness: number;
  /** How often emojis are used. */
  emojiFrequency: EmojiFrequency;
  /** Target response length in sentences. */
  responseLength: ResponseLength;
}

/**
 * Reaction templates keyed by game event type.
 * Each template is a string with optional {variable} placeholders.
 */
export interface ReactionMap {
  general: string;
  check: string;
  capture: string;
  checkmate: string;
  victory: string;
  defeat: string;
  draw: string;
  blunder: string;
  mistake: string;
  brilliant: string;
  goodMove: string;
  opening: string;
  midgame: string;
  endgame: string;
}

/** A complete personality definition. */
export interface PersonalityDefinition {
  /** Unique identifier (kebab-case). */
  id: PersonalityId;
  /** Human-readable display name. */
  name: string;
  /** Short one-line description. */
  description: string;
  /** Emoji avatar. */
  avatar: string;
  /** Core character traits. */
  traits: PersonalityTraits;
  /**
   * A paragraph injected into the system prompt that
   * establishes the personality's voice and mannerisms.
   */
  styleGuide: string;
  /**
   * The first line of the system prompt: "You are ...".
   * Establishes the character's identity.
   */
  identityPrompt: string;
  /** Event-specific reaction templates. */
  reactions: ReactionMap;
}

/** Shape returned by the personality settings store. */
export interface PersonalitySettings {
  activeId: PersonalityId;
}
