/**
 * ──────────────────────────────────────────────────
 * Chess Intelligence Engine — Type Definitions
 * lib/chess/analysis/types.ts
 * ──────────────────────────────────────────────────
 */

import type { MoveRecord } from "@/types/chess";

/* ─── Game Phase ────────────────────────────────── */

export type GamePhase = "opening" | "midgame" | "endgame";

/* ─── Move Quality ───────────────────────────────── */

export type MoveQualityCategory =
  | "brilliant"
  | "great"
  | "best"
  | "good"
  | "book"
  | "inaccuracy"
  | "mistake"
  | "blunder";

/* ─── Analysis Result ────────────────────────────── */

export interface AnalysisResult {
  /** Game phase derived from move count + material. */
  phase: GamePhase;
  /** Quality category of the last played move. */
  moveQuality: MoveQualityCategory;
  /** Centipawn evaluation BEFORE the move (positive = White advantage). */
  evaluationBefore: number | null;
  /** Centipawn evaluation AFTER the move. */
  evaluationAfter: number | null;
  /** evaluationAfter - evaluationBefore (positive = better for the mover). */
  evaluationChange: number | null;
  /** Human-readable material balance string, e.g. "+3", "-1", "0". */
  materialBalance: string;
  /** ECO opening name, or null if not identified. */
  opening: string | null;
  isCapture: boolean;
  /** Human-readable name of the captured piece, e.g. "Knight". */
  capturedPiece: string | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isPromotion: boolean;
  isCastle: boolean;
  isDraw: boolean;
  isStalemate: boolean;
  promotionPiece: string | null;
  centerControl: "Strong" | "Equal" | "Lost";
  kingSafety: "Safe" | "Weak" | "Critical";
  development: "Ahead" | "Equal" | "Behind";
  /** 0–100; higher = more noteworthy. */
  importance: number;
}

/* ─── Engine Input ───────────────────────────────── */

export interface AnalysisInput {
  /** chess.js MoveRecord for the last move played. */
  lastMove: MoveRecord;
  /** All moves played so far. */
  moveHistory: MoveRecord[];
  /** FEN after the last move. */
  fen: string;
  /** Evaluation centipawns BEFORE the move (from the movers perspective). */
  evalBefore: number | null;
  /** Evaluation centipawns AFTER the move (from the movers perspective). */
  evalAfter: number | null;
  /** The colour that just moved. */
  moverColor: "w" | "b";
  /** Current game phase (auto-detected if omitted). */
  phase?: GamePhase;
  /** Move number (half-move count). */
  moveNumber: number;
  /** Whether the last move put the opponent in check. */
  isCheck?: boolean;
  /** Whether the last move was checkmate. */
  isCheckmate?: boolean;
  /** Whether the game ended in a draw. */
  isDraw?: boolean;
  /** Whether the game ended in stalemate. */
  isStalemate?: boolean;
}

/* ─── Opening Entry ──────────────────────────────── */

export interface OpeningEntry {
  name: string;
  eco?: string;
  /** Moves in SAN (space-separated) for matching. */
  pattern: string;
}

/* ─── Importance Weights ─────────────────────────── */

export interface ImportanceWeights {
  base: number;
  isCheckmate: number;
  isCheck: number;
  isCapture: number;
  isPromotion: number;
  isCastle: number;
  evalSwing: number;
  queenLoss: number;
  mateThreat: number;
}
