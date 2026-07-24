/**
 * ──────────────────────────────────────────────────────────
 * Personality Registry  —  lib/ai/personalities/registry.ts
 *
 * Central registry for all personality definitions.
 * Provides lookup, enumeration, and default personality
 * resolution.
 * ──────────────────────────────────────────────────────────
 */

import type { PersonalityDefinition, PersonalityId } from "./types";
import { COACH } from "./personalities/coach";
import { GRANDMASTER } from "./personalities/grandmaster";
import { SARCASTIC } from "./personalities/sarcastic";
import { VILLAIN } from "./personalities/villain";
import { FRIEND } from "./personalities/friend";
import { DEFAULT_PERSONALITY_ID } from "./base";

/* ─── Registry ───────────────────────────────────────── */

/**
 * All available personalities keyed by id.
 * Immutable after module load.
 */
const REGISTRY: Record<string, PersonalityDefinition> = {
  coach: COACH,
  grandmaster: GRANDMASTER,
  sarcastic: SARCASTIC,
  villain: VILLAIN,
  friend: FRIEND,
};

/* ─── Public API ─────────────────────────────────────── */

/**
 * Get a personality definition by its id.
 * Falls back to the default personality if the id is unknown.
 */
export function getPersonality(id: string): PersonalityDefinition {
  return REGISTRY[id] ?? REGISTRY[DEFAULT_PERSONALITY_ID];
}

/**
 * Get all registered personalities as an array.
 */
export function getAllPersonalities(): PersonalityDefinition[] {
  return Object.values(REGISTRY);
}

/**
 * Get the default personality.
 */
export function getDefaultPersonality(): PersonalityDefinition {
  return REGISTRY[DEFAULT_PERSONALITY_ID];
}

/**
 * Check whether the given personality id is registered.
 */
export function hasPersonality(id: string): boolean {
  return id in REGISTRY;
}

/**
 * Get all personality ids.
 */
export function getPersonalityIds(): PersonalityId[] {
  return Object.keys(REGISTRY) as PersonalityId[];
}
