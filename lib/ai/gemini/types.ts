/**
 * ──────────────────────────────────────────────────────────
 * Gemini Types  —  lib/ai/gemini/types.ts
 *
 * Types for the Gemini AI commentary client and service.
 *
 * These types define the request payload sent from the
 * server API route to the Gemini SDK and the response
 * returned to the client.
 *
 * The client (browser) NEVER talks to Gemini directly.
 * It communicates via the Next.js Route Handler at
 * app/api/ai/commentary/route.ts.
 * ──────────────────────────────────────────────────────────
 */

import type { MoveRecord } from "@/types/chess";
import type { EvalScore } from "@/types/engine";

/* ─── API Route Request ───────────────────────────────── */

/**
 * Payload sent from the browser to the /api/ai/commentary
 * route handler.
 */
export interface CommentaryRequest {
  /** FEN of the current position AFTER the move. */
  fen: string;
  /** SAN notation of the last move played. */
  lastMove: string;
  /** Current move number. */
  moveNumber: number;
  /** Player's color ("w" | "b"). */
  playerColor: "w" | "b";
  /** Move history in SAN format. */
  moveHistory: MoveRecord[];
  /** Stockfish evaluation score (or null if unavailable). */
  evalScore?: EvalScore | null;
  /** Engine search depth. */
  evalDepth: number;
  /** Current game phase. */
  gamePhase: string;
  /** Whether the player is in check. */
  inCheck: boolean;
  /** Whether the game ended after this move. */
  isGameOver: boolean;
}

/* ─── API Route Response ──────────────────────────────── */

/**
 * Successful commentary response from the API route.
 */
export interface CommentarySuccessResponse {
  success: true;
  commentary: string;
  reactions: string[];
  tip?: string;
  followUpQuestions: string[];
  latencyMs: number;
}

/**
 * Fallback / error response from the API route.
 */
export interface CommentaryErrorResponse {
  success: false;
  fallback: string;
  error?: string;
  /** Debug info — raw Gemini response text (only in dev/error mode). */
  debug?: string;
}

export type CommentaryApiResponse =
  | CommentarySuccessResponse
  | CommentaryErrorResponse;

/* ─── Gemini Service Types ────────────────────────────── */

/**
 * Result returned by the Gemini service to the API route.
 */
export interface GeminiResult {
  /** The raw text response from Gemini. */
  raw: string;
  /** Latency of the Gemini API call in milliseconds. */
  latencyMs: number;
}

/** Configuration passed to the Gemini client. */
export interface GeminiClientConfig {
  /** Google Gen AI API key (server-side only). */
  apiKey: string;
  /** Gemini model name (e.g. "gemini-2.0-flash"). */
  model?: string;
  /** Temperature for response generation. */
  temperature?: number;
  /** Maximum output tokens. */
  maxOutputTokens?: number;
  /** Request timeout in milliseconds. */
  timeoutMs?: number;
  /** Maximum number of retry attempts. */
  maxRetries?: number;
}
