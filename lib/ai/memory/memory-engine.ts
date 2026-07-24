/**
 * ──────────────────────────────────────────────────────────
 * Memory Engine  —  lib/ai/memory/memory-engine.ts
 *
 * High-level orchestrator that builds adaptive commentary
 * context from player memory.
 *
 * The output of buildMemoryContext() is a natural-language
 * paragraph injected into Gemini prompts so the AI can
 * reference the player's history.
 * ──────────────────────────────────────────────────────────
 */

import type { MemoryData, PlayerProfile, MemoryContext } from "./types";
import { loadMemory } from "./storage";
import { computeProfile, estimateAccuracy } from "./statistics";

/* ─── Profile ──────────────────────────────────────────── */

/**
 * Get or compute the player profile from memory.
 */
export function getProfile(memory?: MemoryData): PlayerProfile {
  const data = memory ?? loadMemory();
  return computeProfile(data.stats);
}

/* ─── Context Builder ──────────────────────────────────── */

/**
 * Build a memory context object for injection into the prompt.
 */
export function buildMemoryContext(memory?: MemoryData): MemoryContext {
  const data = memory ?? loadMemory();
  const profile = computeProfile(data.stats);
  const recentHistory = buildRecentHistory(data);
  const summary = buildSummary(data, profile);
  return { profile, recentHistory, summary };
}

/**
 * Return recent memorable events as a short string list.
 */
function buildRecentHistory(data: MemoryData): string[] {
  const lines: string[] = [];
  const recent = data.recentGames.slice(0, 5);
  if (recent.length === 0) return lines;

  for (const game of recent) {
    const outcomeEmoji =
      game.outcome === "win" ? "W" : game.outcome === "loss" ? "L" : "D";
    lines.push(
      `[${outcomeEmoji}] ${game.opening} (${game.totalMoves} moves, ${game.blunders}B/${game.mistakes}M/${game.inaccuracies}I)`,
    );
  }
  return lines;
}

/**
 * Build a one-paragraph summary of the player's memory.
 */
function buildSummary(data: MemoryData, profile: PlayerProfile): string {
  const s = data.stats;
  if (s.gamesPlayed === 0) return "";

  const accuracy = estimateAccuracy(s);
  const streak = s.currentWinStreak > 0
    ? `Winning streak: ${s.currentWinStreak}`
    : s.currentLossStreak > 0
      ? `Losing streak: ${s.currentLossStreak}`
      : "";

  return [
    `Player is ${profile.level} level with ${s.gamesPlayed} games played.`,
    `Style: ${profile.playStyle}. Favourite opening: ${profile.favouriteOpening}.`,
    `Estimated accuracy: ${accuracy}%.`,
    `Weakness: ${profile.biggestWeakness}. Strength: ${profile.biggestStrength}.`,
    streak && `${streak}.`,
    `Recurring issue: ${profile.recurringMistake}.`,
  ]
    .filter(Boolean)
    .join(" ");
}
