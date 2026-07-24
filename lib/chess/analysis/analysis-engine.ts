/**
 * ──────────────────────────────────────────────────
 * Chess Intelligence Engine — Main Analysis Engine
 * lib/chess/analysis/analysis-engine.ts
 * ──────────────────────────────────────────────────
 *
 * The central `analyzeMove()` function transforms raw chess data into
 * structured AnalysisResult by sequencing:
 *   1. Phase detection
 *   2. Move quality classification
 *   3. Material balance calculation
 *   4. Opening detection
 *   5. Positional assessments (center, king safety, development)
 *   6. Importance scoring
 */

import type { AnalysisResult, AnalysisInput, GamePhase } from "./types";
import {
  calculateMaterialBalance,
  detectPhase,
  getCapturedPieceName,
  getPromotionPieceName,
  detectOpening,
  classifyMoveQuality,
  assessCenterControl,
  assessKingSafety,
  assessDevelopment,
  computeImportance,
} from "./helpers";

/* ─── Public API ──────────────────────────────────── */

/**
 * Analyse a chess move and produce a structured AnalysisResult.
 *
 * @param input - AnalysisInput containing the move, evaluation, and context.
 * @returns A fully populated AnalysisResult.
 *
 * @example
 * const result = analyzeMove({
 *   lastMove: moveRecord,
 *   moveHistory: allMoves,
 *   fen: "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
 *   evalBefore: 20,
 *   evalAfter: 15,
 *   moverColor: "w",
 *   phase: "opening",
 *   moveNumber: 1,
 * });
 */
export function analyzeMove(input: AnalysisInput): AnalysisResult {
  const {
    lastMove,
    moveHistory,
    fen,
    evalBefore,
    evalAfter,
    moverColor,
    phase: inputPhase,
    moveNumber,
  } = input;

  /* ── 1. Phase ──────────────────────────────────── */
  const phase: GamePhase = inputPhase || detectPhase(fen, moveNumber);

  /* ── 2. Flags from the move record ─────────────── */
  // chess.js flags: "n"=normal, "b"=big-pawn, "e"=en-passant, "c"=capture,
  //                 "p"=promotion, "k"=kingside-castle, "q"=queenside-castle
  const isCapture = (lastMove.flags?.includes("c") || lastMove.flags?.includes("e")) ?? false;
  const isCastle = (lastMove.flags?.includes("k") || lastMove.flags?.includes("q")) ?? false;
  const isPromotion = lastMove.flags?.includes("p") ?? false;

  // Check/checkmate/draw/stalemate come from the game state, not move flags.
  // Use optional input fields — default to false when unknown.
  const isCheck = input.isCheck ?? false;
  const isCheckmate = input.isCheckmate ?? false;
  const isDraw = input.isDraw ?? false;
  const isStalemate = input.isStalemate ?? false;

  /* ── 3. Material & evaluation ──────────────────── */
  const materialBalance = calculateMaterialBalance(fen);

  const evaluationChange =
    evalBefore !== null && evalAfter !== null ? evalAfter - evalBefore : null;

  /* ── 4. Piece details ──────────────────────────── */
  const capturedPiece = getCapturedPieceName(lastMove);
  const promotionPiece = getPromotionPieceName(lastMove);

  /* ── 5. Opening ────────────────────────────────── */
  const opening = detectOpening(moveHistory);

  /* ── 6. Move quality ───────────────────────────── */
  // Convert evaluations to mover's perspective
  const moverEvalBefore =
    evalBefore !== null ? (moverColor === "b" ? -evalBefore : evalBefore) : null;
  const moverEvalAfter =
    evalAfter !== null ? (moverColor === "b" ? -evalAfter : evalAfter) : null;

  const moveQuality = classifyMoveQuality(
    moverEvalBefore,
    moverEvalAfter,
    isCapture,
    capturedPiece,
    moveHistory,
    moveNumber,
  );

  /* ── 7. Positional assessments ─────────────────── */
  const centerControl = assessCenterControl(fen, moverColor);
  const kingSafety = assessKingSafety(fen, moverColor);
  const development = assessDevelopment(fen, moverColor, moveNumber);

  /* ── 8. Assemble partial result for importance ─── */
  const partialResult: Omit<AnalysisResult, "importance"> = {
    phase,
    moveQuality,
    evaluationBefore: evalBefore,
    evaluationAfter: evalAfter,
    evaluationChange,
    materialBalance,
    opening,
    isCapture,
    capturedPiece,
    isCheck,
    isCheckmate,
    isPromotion,
    isCastle,
    isDraw,
    isStalemate,
    promotionPiece,
    centerControl,
    kingSafety,
    development,
  };

  /* ── 9. Importance score ───────────────────────── */
  const importance = computeImportance(
    partialResult,
    evalBefore,
    evalAfter,
    moveHistory,
  );

  return {
    ...partialResult,
    importance,
  };
}

/**
 * Analyse a sequence of moves (for reviewing past moves or replay).
 * Returns an array of AnalysisResults, one per move.
 */
export function analyzeMoveHistory(
  history: AnalysisInput[],
): AnalysisResult[] {
  return history.map(analyzeMove);
}
