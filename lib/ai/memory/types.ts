/**
 * ──────────────────────────────────────────────────────────
 * Memory Types  —  lib/ai/memory/types.ts
 *
 * Player memory & adaptive commentary types.
 * Pure data shapes — no implementation.
 * ──────────────────────────────────────────────────────────
 */

/* ─── Game Records ──────────────────────────────────────── */

export type GameOutcome = "win" | "loss" | "draw";
export type PlayStyle = "aggressive" | "defensive" | "tactical" | "positional";

/** A single recorded game with metadata. */
export interface GameRecord {
  id: string;
  outcome: GameOutcome;
  opening: string;
  opponent: "stockfish";
  totalMoves: number;
  playerColor: "w" | "b";
  blunders: number;
  mistakes: number;
  inaccuracies: number;
  queenLost: boolean;
  castled: boolean;
  earlyQueenMove: boolean;
  avgPawnPushDistance: number;
  timestamp: number;
}

/* ─── Aggregated Statistics ─────────────────────────────── */

export interface PlayerStatistics {
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  totalMoves: number;
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  openingCounts: Record<string, number>;
  gamesByPhase: { opening: number; midgame: number; endgame: number };
  totalBlunders: number;
  totalMistakes: number;
  totalInaccuracies: number;
  gamesWithQueenLoss: number;
  castlingCount: number;
  earlyQueenMoveCount: number;
  styleScores: Record<PlayStyle, number>;
}

/* ─── Player Profile ───────────────────────────────────── */

export interface PlayerProfile {
  level: string;
  playStyle: PlayStyle;
  favouriteOpening: string;
  biggestWeakness: string;
  biggestStrength: string;
  recurringMistake: string;
  gamesPlayed: number;
}

/* ─── Memory Store ──────────────────────────────────────── */

export interface MemoryData {
  version: number;
  stats: PlayerStatistics;
  recentGames: GameRecord[];
  lastUpdated: number;
}

/* ─── Context for Prompts ───────────────────────────────── */

export interface MemoryContext {
  profile: PlayerProfile;
  recentHistory: string[];
  summary: string;
}
