/**
 * ──────────────────────────────────────────────────────────
 * Memory Statistics  —  lib/ai/memory/statistics.ts
 *
 * Pure functions for computing derived statistics and
 * player profiles from raw memory data.
 *
 * All functions are synchronous, side-effect-free, and
 * fully testable.
 * ──────────────────────────────────────────────────────────
 */

import type {
  GameRecord,
  PlayerStatistics,
  PlayerProfile,
  PlayStyle,
  MemoryData,
} from "./types";

/* ─── Empty State ──────────────────────────────────────── */

export const EMPTY_MEMORY: MemoryData = {
  version: 1,
  stats: {
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    totalMoves: 0,
    currentWinStreak: 0,
    currentLossStreak: 0,
    longestWinStreak: 0,
    longestLossStreak: 0,
    openingCounts: {},
    gamesByPhase: { opening: 0, midgame: 0, endgame: 0 },
    totalBlunders: 0,
    totalMistakes: 0,
    totalInaccuracies: 0,
    gamesWithQueenLoss: 0,
    castlingCount: 0,
    earlyQueenMoveCount: 0,
    styleScores: {
      aggressive: 0,
      defensive: 0,
      tactical: 0,
      positional: 0,
    },
  },
  recentGames: [],
  lastUpdated: 0,
};

/* ─── Profile Generation ───────────────────────────────── */

const LEVEL_THRESHOLDS = [
  { min: 100, label: "Grandmaster" },
  { min: 50, label: "Expert" },
  { min: 20, label: "Advanced" },
  { min: 5, label: "Intermediate" },
  { min: 0, label: "Beginner" },
] as const;

const WEAKNESS_PATTERNS: Array<{ key: keyof PlayerStatistics; label: string }> = [
  { key: "totalBlunders", label: "Tactical oversight" },
  { key: "gamesWithQueenLoss", label: "Queen safety" },
  { key: "earlyQueenMoveCount", label: "Premature queen development" },
] as const;

const STRENGTH_PATTERNS: Array<{ key: keyof PlayerStatistics; label: string }> = [
  { key: "castlingCount", label: "King safety awareness" },
] as const;

const RECURRING_MISTAKES: Array<{
  threshold: number;
  key: keyof PlayerStatistics;
  label: string;
}> = [
  { threshold: 5, key: "totalBlunders", label: "Rushing moves under pressure" },
  { threshold: 10, key: "totalMistakes", label: "Positional misjudgment" },
  { threshold: 15, key: "totalInaccuracies", label: "Inconsistent calculation" },
] as const;

export function computeProfile(stats: PlayerStatistics): PlayerProfile {
  const level = determineLevel(stats);
  const playStyle = detectPlayStyle(stats);
  const favouriteOpening = findFavouriteOpening(stats);
  const biggestWeakness = findBiggestWeakness(stats);
  const biggestStrength = findBiggestStrength(stats);
  const recurringMistake = findRecurringMistake(stats);

  return {
    level,
    playStyle,
    favouriteOpening,
    biggestWeakness,
    biggestStrength,
    recurringMistake,
    gamesPlayed: stats.gamesPlayed,
  };
}

export function determineLevel(stats: PlayerStatistics): string {
  if (stats.gamesPlayed === 0) return "Newcomer";
  for (const t of LEVEL_THRESHOLDS) {
    if (stats.gamesPlayed >= t.min && stats.gamesPlayed < t.min + 50) {
      return t.label;
    }
  }
  return "Grandmaster";
}

export function detectPlayStyle(stats: PlayerStatistics): PlayStyle {
  const scores = stats.styleScores;
  let best: PlayStyle = "positional";
  let bestScore = 0;
  for (const [style, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      best = style as PlayStyle;
    }
  }
  return best;
}

export function findFavouriteOpening(stats: PlayerStatistics): string {
  const counts = stats.openingCounts;
  let best = "";
  let bestCount = 0;
  for (const [opening, count] of Object.entries(counts)) {
    if (count > bestCount) {
      bestCount = count;
      best = opening;
    }
  }
  return best || "None yet";
}

export function findBiggestWeakness(stats: PlayerStatistics): string {
  for (const p of WEAKNESS_PATTERNS) {
    const val = stats[p.key];
    if (typeof val === "number" && val >= 3) return p.label;
  }
  if (stats.totalMistakes > stats.totalInaccuracies) return "Positional play";
  return "Endgame technique";
}

export function findBiggestStrength(stats: PlayerStatistics): string {
  for (const p of STRENGTH_PATTERNS) {
    const val = stats[p.key];
    if (typeof val === "number" && val >= 5) return p.label;
  }
  if (stats.wins > stats.losses && stats.gamesPlayed > 0) return "Closing out games";
  return "Opening preparation";
}

export function findRecurringMistake(stats: PlayerStatistics): string {
  for (const m of RECURRING_MISTAKES) {
    const val = stats[m.key];
    if (typeof val === "number" && val >= m.threshold) return m.label;
  }
  return "None detected yet";
}

/* ─── Streak Calculations ──────────────────────────────── */

export function computeWinStreak(games: GameRecord[]): number {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i].outcome !== "win") break;
    streak++;
  }
  return streak;
}

export function computeLossStreak(games: GameRecord[]): number {
  let streak = 0;
  for (let i = games.length - 1; i >= 0; i--) {
    if (games[i].outcome !== "loss") break;
    streak++;
  }
  return streak;
}

export function computeLongestWinStreak(games: GameRecord[]): number {
  let best = 0;
  let current = 0;
  for (const g of games) {
    if (g.outcome === "win") {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

export function computeLongestLossStreak(games: GameRecord[]): number {
  let best = 0;
  let current = 0;
  for (const g of games) {
    if (g.outcome === "loss") {
      current++;
      best = Math.max(best, current);
    } else {
      current = 0;
    }
  }
  return best;
}

/* ─── Estimated Accuracy ───────────────────────────────── */

export function estimateAccuracy(stats: PlayerStatistics): number {
  if (stats.gamesPlayed === 0) return 0;
  const totalErrors = stats.totalBlunders + stats.totalMistakes + stats.totalInaccuracies;
  const estimatedMoves = Math.max(stats.totalMoves, 1);
  const errorRate = totalErrors / estimatedMoves;
  return Math.round(Math.max(50, 100 - errorRate * 100));
}
