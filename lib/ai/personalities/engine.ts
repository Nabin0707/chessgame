/**
 * ──────────────────────────────────────────────────────────
 * Personality Engine  —  lib/ai/personalities/engine.ts
 *
 * Builds personality-injected system prompts for Gemini.
 * Takes a personality definition and game event, produces a
 * complete system prompt with:
 *
 *   - Identity
 *   - Tone & speaking style
 *   - Humour & competitiveness
 *   - Emoji preference
 *   - Response length limits
 *   - Safety constraints
 *   - Event-specific reaction
 *
 * The engine keeps prompts modular — no duplicated text
 * across personalities.  Shared structure comes from
 * base.ts, personality-specific content comes from the
 * personality definition.
 * ──────────────────────────────────────────────────────────
 */

import type { PersonalityDefinition } from "./types";
import { getPersonality } from "./registry";
import { buildStylePrompt, buildConstraintsSection } from "./base";

/* ─── Built Prompt ───────────────────────────────────── */

export interface BuiltPersonalityPrompt {
  /** Full system prompt ready for Gemini. */
  systemPrompt: string;
  /** The personality id used. */
  personalityId: string;
  /** The personality name used. */
  personalityName: string;
  /** The default reaction template for the event type. */
  reactionTemplate: string;
}

/* ─── Prompt Builder ─────────────────────────────────── */

const SYSTEM_PROMPT_TEMPLATE = `{identityPrompt}

## Your Style

{stylePrompt}

{constraints}

## Event-Specific Tone

For the current situation, channel the following energy:
"{eventReaction}"

## Critical Rules (NEVER Violate)

{constraints}

## Response Format

Respond in JSON format with these fields:
  - "commentary": string (your response in character)
  - "reactions": string[] (0-2 relevant emojis)
  - "tip": string | null (brief strategic insight, or null)
  - "followUpQuestions": string[] (0-1 question)

Keep your response in character at all times.
Do not wrap the JSON in markdown code fences. Start with an opening brace and end with a closing brace.
`;

/**
 * Build a complete system prompt for a given personality and event.
 *
 * @param personalityId - The personality to use.
 * @param eventKey - The game event key (general, check, capture, etc.).
 * @param eventContext - Optional variables to substitute into the reaction.
 * @returns A BuiltPersonalityPrompt with the assembled system prompt.
 */
export function buildPersonalityPrompt(
  personalityId: string,
  eventKey: string,
  eventContext?: Record<string, string>,
): BuiltPersonalityPrompt {
  const personality = getPersonality(personalityId);
  const stylePrompt = buildStylePrompt(personality.traits);
  const constraintsSection = buildConstraintsSection();
  const eventReaction = resolveReaction(personality, eventKey, eventContext);

  const systemPrompt = SYSTEM_PROMPT_TEMPLATE
    .replace("{identityPrompt}", personality.identityPrompt)
    .replace("{stylePrompt}", stylePrompt)
    .replace(/\{constraints\}/g, constraintsSection)
    .replace("{eventReaction}", eventReaction);

  return {
    systemPrompt,
    personalityId: personality.id,
    personalityName: personality.name,
    reactionTemplate: eventReaction,
  };
}

/**
 * Build only the user prompt with context data.
 * This is separate from the system prompt to keep the
 * personality layer distinct from game data.
 */
export function buildUserPrompt(
  lastMove: string,
  playerColor: "w" | "b",
  moveNumber: number,
  gamePhase: string,
  isCheck: boolean,
  isGameOver: boolean,
  moveHistorySan: string,
): string {
  const checkDesc = isCheck ? " (the player is in check!)" : "";
  const gameOverDesc = isGameOver ? "\nThe game has ended after this move." : "";

  return [
    `The player (${playerColor === "w" ? "White" : "Black"}) just played ${lastMove} on move ${moveNumber}.${checkDesc}`,
    "",
    `Game phase: ${gamePhase}`,
    `Move history: ${moveHistorySan}`,
    gameOverDesc,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Build the full prompt (system + user) for a definitive test.
 */
export function buildFullPrompt(
  personalityId: string,
  eventKey: string,
  lastMove: string,
  playerColor: "w" | "b",
  moveNumber: number,
  gamePhase: string,
  isCheck: boolean,
  isGameOver: boolean,
  moveHistorySan: string,
  eventContext?: Record<string, string>,
): string {
  const { systemPrompt } = buildPersonalityPrompt(personalityId, eventKey, eventContext);
  const userPrompt = buildUserPrompt(
    lastMove,
    playerColor,
    moveNumber,
    gamePhase,
    isCheck,
    isGameOver,
    moveHistorySan,
  );
  return `${systemPrompt}\n\n${userPrompt}`;
}

/* ─── Helpers ────────────────────────────────────────── */

/**
 * Resolve the reaction template for a given event key,
 * substituting any provided context variables.
 *
 * Falls back to the "general" reaction if the specific
 * event key is not found.
 */
function resolveReaction(
  personality: PersonalityDefinition,
  eventKey: string,
  context?: Record<string, string>,
): string {
  const template =
    personality.reactions[eventKey as keyof typeof personality.reactions] ??
    personality.reactions.general;

  if (!context) return template;

  // Substitute {variable} placeholders
  return template.replace(/\{(\w+)\}/g, (_, key) => context[key] ?? `{${key}}`);
}
