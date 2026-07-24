/**
 * ──────────────────────────────────────────────────────────
 * Orchestrator Types  —  lib/ai/orchestrator/types.ts
 *
 * Types for the Commentary Orchestrator — the intelligent
 * queue / dispatch / discard layer between the game loop
 * and the AI commentary API.
 *
 * Responsibilities:
 *   - Queue AI requests
 *   - Cancel / discard outdated requests
 *   - Merge rapid moves (skip intermediate positions)
 *   - Enforce configurable cooldown
 *   - Filter by move importance
 * ──────────────────────────────────────────────────────────
 */

import type { MoveRecord } from "@/types/chess";
import type { EvalScore } from "@/types/engine";

/* ─── Configuration ───────────────────────────────────────── */

/**
 * Configuration for the CommentaryOrchestrator.
 */
export interface OrchestratorConfig {
  /** Minimum time (ms) between successive AI commentary requests. */
  cooldownMs: number;
  /** Maximum number of queued requests (oldest dropped when exceeded). */
  maxQueueSize: number;
  /** Master toggle — set false to disable all AI commentary. */
  enabled: boolean;
  /**
   * Event types that ALWAYS trigger commentary, regardless of
   * cooldown or queue state.  An empty array means commentary
   * is cooldown-gated for all events.
   */
  alwaysCommentOn: Array<"capture" | "check" | "checkmate" | "gameover">;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  cooldownMs: 2_000,
  maxQueueSize: 5,
  enabled: true,
  alwaysCommentOn: ["capture", "check", "checkmate", "gameover"],
};

/* ─── Queue Items ─────────────────────────────────────────── */

/**
 * A single commentary request queued for processing.
 */
export interface CommentaryQueueItem {
  /** Unique request identifier (monotonic). */
  id: string;
  /** FEN of the position AFTER the move — used for staleness checks. */
  fen: string;
  /** SAN notation of the last move. */
  lastMove: string;
  /** Current move number (half-move count ceil'd). */
  moveNumber: number;
  /** Color of the player who just moved. */
  playerColor: "w" | "b";
  /** Full move history up to this point. */
  moveHistory: MoveRecord[];
  /** Stockfish evaluation (or null if unavailable). */
  evalScore: EvalScore | null;
  /** Engine search depth. */
  evalDepth: number;
  /** Current game phase. */
  gamePhase: string;
  /** Whether the side to move is in check. */
  inCheck: boolean;
  /** Whether the game ended after this move. */
  isGameOver: boolean;
  /** Whether the last move was a capture. */
  isCapture: boolean;
  /** Whether the last move delivered checkmate. */
  isCheckmate: boolean;
  /** Selected personality for commentary tone (defaults to "sarcastic"). */
  personalityId?: string;
  /** Player memory context for adaptive commentary. */
  memoryContext?: string;
  /** Timestamp when the item was created. */
  timestamp: number;
}

/* ─── Results & Events ────────────────────────────────────── */

/**
 * The three possible outcomes of a commentary fetch.
 */
export type CommentaryResult =
  | { kind: "success"; text: string; reactions: string[]; tip?: string }
  | { kind: "error" }
  | { kind: "unconfigured" };

/**
 * Events emitted by the orchestrator so the UI can react.
 */
export type OrchestratorEvent =
  | { type: "loading" }
  | { type: "result"; result: CommentaryResult }
  | { type: "skipped"; reason: string };

/**
 * Signature for the actual API-fetching function the
 * orchestrator calls.
 */
export type FetchCommentaryFn = (
  item: CommentaryQueueItem,
) => Promise<CommentaryResult>;
