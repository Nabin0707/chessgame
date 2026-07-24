/**
 * ──────────────────────────────────────────────────────────
 * Memory Tracker  —  lib/ai/memory/tracker.ts
 *
 * Records game events into player memory.
 * Pure functions that take MemoryData and return updated MemoryData.
 * ──────────────────────────────────────────────────────────
 */

import type { GameRecord, GameOutcome, MemoryData, PlayStyle } from "./types";
import {
  computeWinStreak,
  computeLossStreak,
  computeLongestWinStreak,
  computeLongestLossStreak,
} from "./statistics";

let gameIdCounter = 0;
const MAX_RECENT_GAMES = 50;

function nextId(): string {
  return `game-${++gameIdCounter}-${Date.now()}`;
}

function classifyPhase(moveCount: number): "opening" | "midgame" | "endgame" {
  if (moveCount <= 20) return "opening";
  if (moveCount <= 50) return "midgame";
  return "endgame";
}

/**
 * Record a completed game and return updated memory.
 */
export function recordGame(
  memory: MemoryData,
  params: {
    outcome: GameOutcome;
    opening: string;
    totalMoves: number;
    playerColor: "w" | "b";
    blunders: number;
    mistakes: number;
    inaccuracies: number;
    queenLost: boolean;
    castled: boolean;
    earlyQueenMove: boolean;
    avgPawnPushDistance: number;
  },
): MemoryData {
  const { stats, recentGames } = memory;
  const game: GameRecord = {
    id: nextId(),
    outcome: params.outcome,
    opening: params.opening,
    opponent: "stockfish",
    totalMoves: params.totalMoves,
    playerColor: params.playerColor,
    blunders: params.blunders,
    mistakes: params.mistakes,
    inaccuracies: params.inaccuracies,
    queenLost: params.queenLost,
    castled: params.castled,
    earlyQueenMove: params.earlyQueenMove,
    avgPawnPushDistance: params.avgPawnPushDistance,
    timestamp: Date.now(),
  };

  const phase = classifyPhase(params.totalMoves as number);

  const wins = stats.wins + (params.outcome === "win" ? 1 : 0);
  const losses = stats.losses + (params.outcome === "loss" ? 1 : 0);
  const draws = stats.draws + (params.outcome === "draw" ? 1 : 0);

  const updatedRecent = [game, ...recentGames].slice(0, MAX_RECENT_GAMES);
  const openingCounts = { ...stats.openingCounts };
  openingCounts[params.opening] = (openingCounts[params.opening] || 0) + 1;

  const updated: MemoryData = {
    ...memory,
    lastUpdated: Date.now(),
    recentGames: updatedRecent,
    stats: {
      ...stats,
      gamesPlayed: stats.gamesPlayed + 1,
      totalMoves: stats.totalMoves + params.totalMoves,
      wins,
      losses,
      draws,
      totalBlunders: stats.totalBlunders + params.blunders,
      totalMistakes: stats.totalMistakes + params.mistakes,
      totalInaccuracies: stats.totalInaccuracies + params.inaccuracies,
      gamesWithQueenLoss: stats.gamesWithQueenLoss + (params.queenLost ? 1 : 0),
      castlingCount: stats.castlingCount + (params.castled ? 1 : 0),
      earlyQueenMoveCount: stats.earlyQueenMoveCount + (params.earlyQueenMove ? 1 : 0),
      openingCounts,
      gamesByPhase: {
        ...stats.gamesByPhase,
        [phase]: stats.gamesByPhase[phase] + 1,
      },
      currentWinStreak: computeWinStreak(updatedRecent),
      currentLossStreak: computeLossStreak(updatedRecent),
      longestWinStreak: Math.max(
        stats.longestWinStreak,
        computeLongestWinStreak(updatedRecent),
      ),
      longestLossStreak: Math.max(
        stats.longestLossStreak,
        computeLongestLossStreak(updatedRecent),
      ),
    },
  };

  return updated;
}

/**
 * Update play style scores based on observed patterns.
 */
export function recordStyleEvent(
  memory: MemoryData,
  style: PlayStyle,
  delta: number,
): MemoryData {
  const scores = { ...memory.stats.styleScores };
  scores[style] = Math.min(100, Math.max(0, scores[style] + delta));
  return {
    ...memory,
    stats: { ...memory.stats, styleScores: scores },
    lastUpdated: Date.now(),
  };
}

/**
 * Extract the opening name from a move history string.
 * Returns "Unknown Opening" if no pattern matches.
 */
export function detectOpeningFromHistory(movesSan: string): string {
  const common = [
    { pattern: /^e4\s+e5\s+Nf3\s+Nc6\s+Bb5/, name: "Ruy Lopez" },
    { pattern: /^e4\s+e5\s+Nf3\s+Nc6\s+Bc4/, name: "Italian Game" },
    { pattern: /^e4\s+e5\s+Nf3\s+Nf6/, name: "Petrov Defense" },
    { pattern: /^e4\s+e5\s+Nf3\s+d6/, name: "Philidor Defense" },
    { pattern: /^e4\s+e5\s+f4/, name: "King's Gambit" },
    { pattern: /^e4\s+e5\s+Nf3\s+Nc6\s+d4/, name: "Scotch Game" },
    { pattern: /^e4\s+e5\s+Bc4/, name: "Bishop's Opening" },
    { pattern: /^e4\s+c5/, name: "Sicilian Defense" },
    { pattern: /^e4\s+e6/, name: "French Defense" },
    { pattern: /^e4\s+d5/, name: "Scandinavian Defense" },
    { pattern: /^e4\s+g6/, name: "Modern Defense" },
    { pattern: /^e4\s+d6/, name: "Pirc Defense" },
    { pattern: /^e4\s+c6/, name: "Caro-Kann Defense" },
    { pattern: /^e4\s+e5\s+Qh5/, name: "Scholar's Mate" },
    { pattern: /^d4\s+d5/, name: "Queen's Gambit" },
    { pattern: /^d4\s+Nf6/, name: "Indian Defense" },
    { pattern: /^d4\s+d5\s+c4/, name: "Queen's Gambit Declined" },
    { pattern: /^d4\s+Nf6\s+c4/, name: "King's Indian Defense" },
    { pattern: /^d4\s+Nf6\s+c4\s+g6/, name: "King's Indian" },
    { pattern: /^d4\s+Nf6\s+c4\s+e6/, name: "Bogo-Indian Defense" },
    { pattern: /^d4\s+e6/, name: "Dutch Defense" },
    { pattern: /^d4\s+f5/, name: "Dutch Defense" },
    { pattern: /^c4\s+e5/, name: "English Opening" },
    { pattern: /^Nf3/, name: "Zukertort Opening" },
    { pattern: /^g3/, name: "King's Fianchetto" },
    { pattern: /^b3/, name: "Nimzo-Larsen Attack" },
    { pattern: /^f4/, name: "Bird's Opening" },
    { pattern: /^b4/, name: "Polish Opening" },
  ];

  const trimmed = movesSan.trim().toLowerCase();
  for (const entry of common) {
    if (entry.pattern.test(trimmed)) {
      return entry.name;
    }
  }
  return "Unknown Opening";
}
