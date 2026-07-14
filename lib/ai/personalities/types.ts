/**
 * ──────────────────────────────────────────────────────────
 * Personality Types  —  lib/ai/personalities/types.ts
 *
 * Interfaces and type aliases for the AI commentary
 * personality system.  Each personality defines a distinct
 * character with its own tone, humour, aggression, and
 * game-event reactions.
 * ──────────────────────────────────────────────────────────
 */

/* ─── Scalar Trait Types ─────────────────────────────── */

/** The overall tone of the personality's commentary. */
export type Tone =
  | "enthusiastic"
  | "analytical"
  | "witty"
  | "dramatic"
  | "calm"
  | "sarcastic"
  | "encouraging"
  | "stoic";

/** How much humour the personality injects into commentary. */
export type HumorLevel = "none" | "light" | "moderate" | "high";

/** How aggressively the personality critiques moves. */
export type AggressionLevel = "gentle" | "moderate" | "savage" | "merciless";

/* ─── Emoji Style ────────────────────────────────────── */

/**
 * Per-event emoji sets.  Each event type maps to an array of
 * candidate emojis; the commentary formatter picks one at
 * random (or cycles through them) for variety.
 */
export interface EmojiStyle {
  opening: string[];
  check: string[];
  capture: string[];
  blunder: string[];
  mistake: string[];
  brilliant: string[];
  checkmate: string[];
  victory: string[];
  defeat: string[];
  draw: string[];
  trade: string[];
  timeTrouble: string[];
}

/* ─── Reaction Templates ─────────────────────────────── */

/**
 * Template strings for in-game events.  These are
 * parameterised strings that the prompt builder uses
 * to construct the system prompt for each commentary
 * request.  Variables are denoted with `{placeholder}`
 * syntax.
 *
 * Example:
 *   "${playerName} just played {move}. That's a
 *   {reaction} move!"
 */
export interface ReactionTemplates {
  opening: string;
  midgame: string;
  endgame: string;
  check: string;
  capture: string;
  blunder: string;
  mistake: string;
  inaccuracy: string;
  goodMove: string;
  excellentMove: string;
  brilliantMove: string;
  checkmate: string;
  victory: string;
  defeat: string;
  draw: string;
  timeTrouble: string;
  comeback: string;
  trade: string;
  novelty: string;
}

/* ─── Personality ────────────────────────────────────── */

/** A complete personality definition. */
export interface Personality {
  /** Unique identifier (kebab-case, e.g. "the-analyst"). */
  id: string;
  /** Human-readable name (e.g. "The Analyst"). */
  name: string;
  /** Emoji or URL for the avatar. */
  avatar: string;
  /** One-line description shown in the personality picker. */
  description: string;
  /** Core commentary tone. */
  tone: Tone;
  /** How much humour the personality uses. */
  humor: HumorLevel;
  /** How harshly it critiques mistakes. */
  aggression: AggressionLevel;
  /** Emoji reactions per event type. */
  emojiStyle: EmojiStyle;
  /** Reaction template strings for prompt construction. */
  reactions: ReactionTemplates;
  /**
   * Style guide injected into the system prompt.
   * Describes how the personality speaks — e.g.
   * "Speak in short, punchy sentences. Use metaphors."
   */
  styleGuide: string;
}

/* ─── Personality Collection ─────────────────────────── */

/** A registry of all available personalities. */
export type PersonalityRegistry = Record<string, Personality>;
