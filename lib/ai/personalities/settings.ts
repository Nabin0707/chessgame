/**
 * ──────────────────────────────────────────────────────────
 * Personality Settings  —  lib/ai/personalities/settings.ts
 *
 * Lightweight localStorage-based persistence for personality
 * selection.  No dependencies, no React — works in any
 * browser context.
 *
 * The default personality is "sarcastic" (Sarcastic Rival).
 * ──────────────────────────────────────────────────────────
 */

import { DEFAULT_PERSONALITY_ID } from "./base";

/* ─── Storage key ──────────────────────────────────────── */

const STORAGE_KEY = "chess-ai-personality";

/* ─── API ──────────────────────────────────────────────── */

/**
 * Read the persisted personality ID from localStorage.
 * Returns the default if nothing is stored or if storage
 * is unavailable (SSR, quota exceeded, etc.).
 */
export function getPersonalitySetting(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      // Validate it's a non-empty string
      const parsed = JSON.parse(stored);
      if (typeof parsed === "string" && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // localStorage unavailable or corrupted — use default
  }
  return DEFAULT_PERSONALITY_ID;
}

/**
 * Persist a personality ID to localStorage.
 */
export function setPersonalitySetting(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(id));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/**
 * Remove the persisted personality setting, reverting to default.
 */
export function clearPersonalitySetting(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}
