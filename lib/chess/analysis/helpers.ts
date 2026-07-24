/**
 * ──────────────────────────────────────────────────
 * Chess Intelligence Engine — Helper Functions
 * lib/chess/analysis/helpers.ts
 * ──────────────────────────────────────────────────
 */

import type { MoveRecord } from "@/types/chess";
import type {
  AnalysisResult,
  GamePhase,
  MoveQualityCategory,
  ImportanceWeights,
} from "./types";
import {
  QUALITY_THRESHOLDS,
  BRILLIANT_EVAL_GAIN,
  GREAT_EVAL_GAIN,
  PIECE_VALUE_MAP,
  PIECE_NAME_MAP,
  PIECE_NAME_MAP_ARTICLED,
  OPENING_MAX_MOVES,
  MIDGAME_MAX_MOVES,
  CENTER_SQUARES,
  CENTER_PIECE_BONUS,
  EXTENDED_CENTER,
  EXTENDED_CENTER_BONUS,
  SORTED_OPENINGS,
  DEFAULT_IMPORTANCE_WEIGHTS,
  MAX_IMPORTANCE,
  MIN_IMPORTANCE,
  CP_DISPLAY_PRECISION,
} from "./constants";

/* ─── Material Balance ──────────────────────────── */

/**
 * Calculate the material balance string from a FEN position.
 * Positive = White leads, Negative = Black leads.
 * Returns a string like "+3", "-1", "0".
 */
export function calculateMaterialBalance(fen: string): string {
  const fenBoard = fen.split(" ")[0];
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (const char of fenBoard) {
    if (char === "/") continue;
    if (char >= "1" && char <= "8") continue;

    const value = PIECE_VALUE_MAP[char.toLowerCase()] ?? 0;
    if (char === char.toUpperCase()) {
      whiteMaterial += value; // uppercase = white
    } else {
      blackMaterial += value; // lowercase = black
    }
  }

  const diff = whiteMaterial - blackMaterial;
  if (diff > 0) return `+${diff / 100}`;
  if (diff < 0) return `${diff / 100}`;
  return "0";
}

/**
 * Get raw centipawn material balance (positive = White leads).
 */
export function calculateMaterialBalanceCp(fen: string): number {
  const fenBoard = fen.split(" ")[0];
  let whiteMaterial = 0;
  let blackMaterial = 0;

  for (const char of fenBoard) {
    if (char === "/") continue;
    if (char >= "1" && char <= "8") continue;

    const value = PIECE_VALUE_MAP[char.toLowerCase()] ?? 0;
    if (char === char.toUpperCase()) {
      whiteMaterial += value;
    } else {
      blackMaterial += value;
    }
  }

  return whiteMaterial - blackMaterial;
}

/* ─── Phase Detection ────────────────────────────── */

/**
 * Detect the game phase from the current FEN and move count.
 * Uses material thresholds and move count heuristics.
 */
export function detectPhase(fen: string, moveCount: number): GamePhase {
  // Use move count as primary signal
  if (moveCount <= OPENING_MAX_MOVES) {
    // Estimate pieces on board to detect early endgame transitions
    const fenBoard = fen.split(" ")[0];
    let totalPieces = 0;
    for (const char of fenBoard) {
      if (char === "/") continue;
      if (char >= "1" && char <= "8") continue;
      totalPieces++;
    }

    // Each side starts with 16 pieces; if most are gone → endgame
    if (totalPieces <= 8) return "endgame";
    return "opening";
  }

  if (moveCount <= MIDGAME_MAX_MOVES) {
    return "midgame";
  }

  return "endgame";
}

/* ─── Piece Name Resolution ──────────────────────── */

/**
 * Get the human-readable name of a chess piece.
 * @param piece - Piece type character (e.g. "p", "n", "b", "r", "q", "k")
 * @param article - If true, prepends article ("a Knight", "a Bishop")
 */
export function getPieceName(piece: string, article = false): string {
  const map = article ? PIECE_NAME_MAP_ARTICLED : PIECE_NAME_MAP;
  return map[piece.toLowerCase()] ?? "Unknown";
}

/**
 * Get the human-readable name of the captured piece from a move record.
 * Returns null if no capture occurred.
 */
export function getCapturedPieceName(move: MoveRecord): string | null {
  if (!move.captured) return null;
  return getPieceName(move.captured);
}

/**
 * Get the human-readable name of a promotion piece.
 * Returns null if no promotion.
 */
export function getPromotionPieceName(move: MoveRecord): string | null {
  if (!move.promotion) return null;
  return getPieceName(move.promotion);
}

/* ─── Opening Detection ───────────────────────────── */

/**
 * Match the current move history against known opening patterns.
 * Returns the opening name, or null if no match.
 */
export function detectOpening(moveHistory: MoveRecord[]): string | null {
  if (moveHistory.length === 0) return null;

  // Build a SAN string from the move history
  const sanString = moveHistory.map((m) => m.san).join(" ");

  // Check sorted openings (longest match first)
  for (const opening of SORTED_OPENINGS) {
    if (sanString.startsWith(opening.pattern)) {
      return opening.name;
    }
  }

  return null;
}

/* ─── Move Quality Classification ────────────────── */

/**
 * Classify move quality based on evaluation change and centipawn loss.
 *
 * @param evalBefore - Evaluation before the move (from mover's perspective)
 * @param evalAfter - Evaluation after the move (from mover's perspective)
 * @param isCapture - Whether the move is a capture
 * @param capturedPiece - The piece type captured, if any
 * @param moveHistory - Full move history (for book move detection)
 * @param moveNumber - Current move number
 */
export function classifyMoveQuality(
  evalBefore: number | null,
  evalAfter: number | null,
  isCapture: boolean,
  capturedPiece: string | null,
  moveHistory: MoveRecord[],
  moveNumber: number,
): MoveQualityCategory {
  // If no evaluation available, default to "good"
  if (evalBefore === null || evalAfter === null) return "good";

  const evalChange = evalAfter - evalBefore; // positive = better for mover
  const centipawnLoss = -evalChange; // positive = worse for mover

  // --- Brilliant: huge eval swing (covers checkmates, sacrifices) ---
  if (evalChange >= 300) return "brilliant";

  // --- Brilliant: sacrifice that gains significant advantage ---
  // Must be a capture (sacrifice) with large eval gain
  if (
    isCapture &&
    evalChange >= BRILLIANT_EVAL_GAIN &&
    capturedPiece &&
    PIECE_VALUE_MAP[capturedPiece.toLowerCase()] <= 100 // capturing a pawn or less = "sacrifice"
  ) {
    return "brilliant";
  }

  // --- Book move detection (first N moves of opening) ---
  if (moveNumber <= OPENING_MAX_MOVES && moveHistory.length >= 2) {
    const sanString = moveHistory.map((m) => m.san).join(" ");
    const isBookMove = SORTED_OPENINGS.some((opening) => {
      const patternParts = opening.pattern.split(" ");
      const historyParts = sanString.split(" ");
      // Check if the current sequence matches any opening up to current length
      if (patternParts.length < historyParts.length) return false;
      const truncatedPattern = patternParts.slice(0, historyParts.length).join(" ");
      return sanString === truncatedPattern;
    });
    if (isBookMove) return "book";
  }

  // --- Quality classification by centipawn loss ---
  if (centipawnLoss <= QUALITY_THRESHOLDS.great && evalChange >= GREAT_EVAL_GAIN) {
    return "great";
  }

  if (centipawnLoss <= QUALITY_THRESHOLDS.great) return "great";
  if (centipawnLoss <= QUALITY_THRESHOLDS.best) return "best";
  if (centipawnLoss <= QUALITY_THRESHOLDS.good) return "good";

  if (centipawnLoss <= QUALITY_THRESHOLDS.inaccuracy) return "inaccuracy";
  if (centipawnLoss <= QUALITY_THRESHOLDS.mistake) return "mistake";

  return "blunder";
}

/* ─── Positional Assessments ─────────────────────── */

/**
 * Assess center control based on the FEN position.
 * Uses piece presence on center squares and extended center.
 *
 * Returns "Strong", "Equal", or "Lost".
 *
 * NOTE: This is a heuristic; full center control requires move-by-move analysis.
 */
export function assessCenterControl(fen: string, moverColor: "w" | "b"): "Strong" | "Equal" | "Lost" {
  const fenBoard = fen.split(" ")[0];
  const rows = fenBoard.split("/");

  let moverCenterScore = 0;
  let opponentCenterScore = 0;
  const opponentColor = moverColor === "w" ? "b" : "w";

  for (let rank = 0; rank < 8; rank++) {
    let file = 0;
    for (const char of rows[rank]) {
      if (char >= "1" && char <= "8") {
        file += parseInt(char);
        continue;
      }

      const square = String.fromCharCode(97 + file) + (8 - rank);
      const isWhite = char === char.toUpperCase();
      const pieceColor = isWhite ? "w" : "b";
      const pieceValue = PIECE_VALUE_MAP[char.toLowerCase()] ?? 100;

      const isCenter = (CENTER_SQUARES as readonly string[]).includes(square);
      const isExtended = (EXTENDED_CENTER as readonly string[]).includes(square);

      let contribution = 0;
      if (isCenter) contribution = pieceValue * CENTER_PIECE_BONUS;
      else if (isExtended) contribution = Math.floor(pieceValue / EXTENDED_CENTER_BONUS);

      if (pieceColor === moverColor) {
        moverCenterScore += contribution;
      } else {
        opponentCenterScore += contribution;
      }

      file++;
    }
  }

  const diff = moverCenterScore - opponentCenterScore;
  if (diff > 100) return "Strong";
  if (diff < -100) return "Lost";
  return "Equal";
}

/**
 * Assess king safety based on the FEN position.
 *
 * Returns "Safe", "Weak", or "Critical".
 *
 * Heuristic: checks for castling rights, pawn shield, and king exposure.
 */
export function assessKingSafety(fen: string, moverColor: "w" | "b"): "Safe" | "Weak" | "Critical" {
  const parts = fen.split(" ");
  const castlingRights = parts[2] || "-";
  const fenBoard = parts[0];

  // Check for castling rights (indicates king hasn't moved)
  const hasCastlingRight =
    moverColor === "w"
      ? castlingRights.includes("K") || castlingRights.includes("Q")
      : castlingRights.includes("k") || castlingRights.includes("q");

  // Check pawn shield around king position
  const rows = fenBoard.split("/");
  const kingRow = moverColor === "w" ? 0 : 7; // approximate: white king on row 0, black on row 7
  const shieldRow = moverColor === "w" ? 1 : 6;

  let pawnShieldCount = 0;
  let kingExposed = false;

  // Count pawns in front of the king's general area
  const shieldRowStr = rows[shieldRow];
  for (const char of shieldRowStr) {
    if (char >= "1" && char <= "8") continue;
    if (char.toLowerCase() === "p") {
      const isWhite = char === "p";
      if (moverColor === "w" && !isWhite) continue;
      if (moverColor === "b" && isWhite) continue;
      pawnShieldCount++;
    }
  }

  // Simple heuristic
  if (!hasCastlingRight && pawnShieldCount < 2) return "Critical";
  if (pawnShieldCount < 3) return "Weak";
  return "Safe";
}

/**
 * Assess development status based on the FEN and move count.
 *
 * Returns "Ahead", "Equal", or "Behind".
 *
 * Heuristic: counts pieces that have moved from their starting positions.
 */
export function assessDevelopment(
  fen: string,
  moverColor: "w" | "b",
  moveNumber: number,
): "Ahead" | "Equal" | "Behind" {
  // Early game — check development by counting pieces off back rank
  const fenBoard = fen.split(" ")[0];
  const rows = fenBoard.split("/");

  const backRank = moverColor === "w" ? 0 : 7;
  const backRankStr = rows[backRank];

  // Count undeveloped pieces (still on back rank)
  let undeveloped = 0;
  for (const char of backRankStr) {
    if (char >= "1" && char <= "8") {
      undeveloped += parseInt(char); // Empty squares count as undeveloped space
    } else {
      undeveloped++;
    }
  }

  // Adjust for expected development based on move count
  // In opening, each side should develop ~1 piece per 2 moves
  const expectedDeveloped = Math.floor(moveNumber / 2);
  const actualDeveloped = 8 - undeveloped; // rough estimate

  const diff = actualDeveloped - expectedDeveloped;
  if (diff >= 2) return "Ahead";
  if (diff <= -2) return "Behind";
  return "Equal";
}

/* ─── Importance Scoring ─────────────────────────── */

/**
 * Compute an importance score (0–100) indicating how noteworthy a move is.
 * Higher values indicate more tactical, decisive, or interesting moves.
 */
export function computeImportance(
  result: Omit<AnalysisResult, "importance">,
  evalBefore: number | null,
  evalAfter: number | null,
  moveHistory: MoveRecord[],
  weights: ImportanceWeights = DEFAULT_IMPORTANCE_WEIGHTS,
): number {
  let score = weights.base;

  // Checkmate — highest importance
  if (result.isCheckmate) {
    score += weights.isCheckmate;
    return Math.min(score, MAX_IMPORTANCE);
  }

  // Big evaluation swing
  if (evalBefore !== null && evalAfter !== null) {
    const swing = Math.abs(evalAfter - evalBefore);
    score += Math.min(swing * (weights.evalSwing / 100), weights.evalSwing);
  }

  // Queen loss detection
  if (result.isCapture && result.capturedPiece?.toLowerCase() === "q") {
    score += weights.queenLoss;
  }

  // Promotion
  if (result.isPromotion) {
    score += weights.isPromotion;
  }

  // Check
  if (result.isCheck) {
    score += weights.isCheck;
  }

  // Capture
  if (result.isCapture) {
    score += weights.isCapture;
  }

  // Castle
  if (result.isCastle) {
    score += weights.isCastle;
  }

  // Mate threat — checkmate in evaluation
  if (evalAfter !== null && evalAfter >= 10000) {
    score += weights.mateThreat;
  }

  // Clamp to [MIN_IMPORTANCE, MAX_IMPORTANCE]
  return Math.min(Math.max(score, MIN_IMPORTANCE), MAX_IMPORTANCE);
}

/* ─── Evaluation Formatting ──────────────────────── */

/**
 * Format a centipawn evaluation for display.
 * Converts to pawn-based display and rounds to configured precision.
 */
export function formatEvalDisplay(cp: number | null): string {
  if (cp === null) return "—";
  // Round to nearest 5 centipawns for display
  const roundedCp = Math.round(cp / 5) * 5;
  const pawns = roundedCp / 100;
  if (pawns > 0) return `+${pawns.toFixed(CP_DISPLAY_PRECISION)}`;
  return pawns.toFixed(CP_DISPLAY_PRECISION);
}

/* ─── Sanitization ───────────────────────────────── */

/**
 * Sanitise a FEN string for analysis (ensures it has enough sections).
 */
export function sanitiseFen(fen: string): string {
  const parts = fen.split(" ");
  while (parts.length < 6) parts.push("-");
  return parts.join(" ");
}
