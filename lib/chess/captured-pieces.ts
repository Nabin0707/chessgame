/**
 * ──────────────────────────────────────────────────────────
 * Captured Pieces  —  lib/chess/captured-pieces.ts
 *
 * Pure functions for calculating captured pieces and
 * material balance from a chess.js game instance.
 * ──────────────────────────────────────────────────────────
 */

import type { GameInstance } from "@/lib/chess/game";

/* ─── Constants ──────────────────────────────────────────── */

export const PIECE_VALUES: Record<string, number> = {
  q: 9,
  r: 5,
  b: 3,
  n: 3,
  p: 1,
};

export const PIECE_SYMBOLS: Record<string, string> = {
  wq: "♕",
  wr: "♖",
  wb: "♗",
  wn: "♘",
  wp: "♙",
  bq: "♛",
  br: "♜",
  bb: "♝",
  bn: "♞",
  bp: "♟",
};

export const PIECE_SORT_ORDER: string[] = ["q", "r", "b", "n", "p"];

/* ─── Types ──────────────────────────────────────────────── */

export interface CapturedPieces {
  white: string[];   // pieces white has captured (from black)
  black: string[];   // pieces black has captured (from white)
}

export interface CapturedSet {
  white: Record<string, number>;  // piece type → count
  black: Record<string, number>;
}

/* ─── Pure Helpers ───────────────────────────────────────── */

/**
 * Compute captured pieces by comparing the current board state
 * against the starting position.  Works from any FEN, not just
 * the initial position, by counting which pieces are missing.
 */
export function getCapturedPieces(game: GameInstance): CapturedPieces {
  const board = game.board();
  const missing: { white: string[]; black: string[] } = {
    white: [],
    black: [],
  };

  // Starting counts per side
  const startPieces: Record<string, number> = {
    p: 8, n: 2, b: 2, r: 2, q: 1,
  };

  // Count pieces still on the board
  const present: Record<string, { white: number; black: number }> = {
    p: { white: 0, black: 0 },
    n: { white: 0, black: 0 },
    b: { white: 0, black: 0 },
    r: { white: 0, black: 0 },
    q: { white: 0, black: 0 },
  };

  for (const row of board) {
    for (const sq of row) {
      if (sq && sq.type !== "k") {
        const colorKey = sq.color === "w" ? "white" : "black";
        present[sq.type][colorKey]++;
      }
    }
  }

  for (const [type, start] of Object.entries(startPieces)) {
    const whiteMissing = start - present[type].white;
    if (whiteMissing > 0) {
      for (let i = 0; i < whiteMissing; i++) missing.white.push(type);
    }
    const blackMissing = start - present[type].black;
    if (blackMissing > 0) {
      for (let i = 0; i < blackMissing; i++) missing.black.push(type);
    }
  }

  // Sort by value (highest first)
  const sortByValue = (a: string, b: string) =>
    (PIECE_VALUES[b] ?? 0) - (PIECE_VALUES[a] ?? 0);

  return {
    white: missing.white.sort(sortByValue),
    black: missing.black.sort(sortByValue),
  };
}

/**
 * Group captured piece arrays into counts per type.
 */
export function getCapturedSets(captured: CapturedPieces): CapturedSet {
  const group = (arr: string[]): Record<string, number> => {
    const counts: Record<string, number> = {};
    for (const p of arr) {
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return counts;
  };
  return {
    white: group(captured.white),
    black: group(captured.black),
  };
}

/**
 * Compute material balance from White's perspective.
 * Positive = White advantage, negative = Black advantage.
 */
export function getMaterialBalance(
  capturedWhite: string[],
  capturedBlack: string[],
): number {
  const sum = (arr: string[]) =>
    arr.reduce((acc, p) => acc + (PIECE_VALUES[p] ?? 0), 0);
  return sum(capturedWhite) - sum(capturedBlack);
}
