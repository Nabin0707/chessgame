/**
 * ──────────────────────────────────────────────────────────
 * Analysis Display  —  lib/chess/analysis-display.ts
 *
 * Helpers for the evaluation bar and engine stats display.
 * ──────────────────────────────────────────────────────────
 */

import type { EvalScore } from "@/types/engine";

/* ─── Eval bar data ──────────────────────────────────────── */

export interface EvalBarData {
  score: number;    // centipawns or mate distance
  isMate: boolean;
  depth: number;
  nodes?: number;
  speed?: number;   // nodes per second
  bestMove?: string;
}

/**
 * Convert evaluation score to a percentage for the eval bar.
 * Returns 0–100 (50 = equal).
 * - Clamps cp to ±500 (roughly ±5 pawns) before mapping.
 * - Mate scores get extreme values (95 or 5).
 */
export function getEvalPercentage(data: EvalBarData): number {
  if (data.isMate) {
    return data.score > 0 ? 95 : 5;
  }

  // Clamp to ±500 cp
  const clamped = Math.max(-500, Math.min(500, data.score));
  // Map -500..500 to 5..95
  return 50 + (clamped / 500) * 45;
}

/**
 * Determine which side the eval favours.
 */
export function getEvalColor(
  data: EvalBarData,
): "white" | "black" | "equal" {
  if (data.isMate) {
    return data.score > 0 ? "white" : "black";
  }
  if (data.score > 30) return "white";
  if (data.score < -30) return "black";
  return "equal";
}

/**
 * Format eval score for display.
 */
export function formatEvalScore(data: EvalBarData): string {
  if (data.isMate) {
    return `#${Math.abs(data.score)}`;
  }
  const centipawns = data.score;
  const pawns = Math.abs(centipawns) / 100;
  const sign = centipawns >= 0 ? "+" : "-";
  return `${sign}${pawns.toFixed(2)}`;
}

/**
 * Format node count in human-readable form (e.g., "12.5M").
 */
export function formatNodes(nodes: number): string {
  if (nodes >= 1_000_000) {
    return `${(nodes / 1_000_000).toFixed(1)}M`;
  }
  if (nodes >= 1_000) {
    return `${(nodes / 1_000).toFixed(0)}K`;
  }
  return String(nodes);
}

/**
 * Format search speed (nodes per second), e.g., "2.1M nps".
 */
export function formatSpeed(speed: number): string {
  if (speed >= 1_000_000) {
    return `${(speed / 1_000_000).toFixed(1)}M nps`;
  }
  if (speed >= 1_000) {
    return `${(speed / 1_000).toFixed(0)}K nps`;
  }
  return `${speed} nps`;
}
