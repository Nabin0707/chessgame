/**
 * ──────────────────────────────────────────────────
 * Chess Intelligence Engine — Barrel Exports
 * lib/chess/analysis/index.ts
 * ──────────────────────────────────────────────────
 */

// Types
export type {
  AnalysisResult,
  AnalysisInput,
  GamePhase,
  MoveQualityCategory,
  OpeningEntry,
  ImportanceWeights,
} from "./types";

// Constants
export {
  QUALITY_THRESHOLDS,
  BRILLIANT_EVAL_GAIN,
  GREAT_EVAL_GAIN,
  PIECE_VALUE_MAP,
  PIECE_NAME_MAP,
  OPENING_PATTERNS,
  SORTED_OPENINGS,
  DEFAULT_IMPORTANCE_WEIGHTS,
  MAX_IMPORTANCE,
  MIN_IMPORTANCE,
  CENTER_SQUARES,
  EXTENDED_CENTER,
  ENDGAME_MATERIAL_THRESHOLD,
  OPENING_MAX_MOVES,
  MIDGAME_MAX_MOVES,
} from "./constants";

// Helpers
export {
  calculateMaterialBalance,
  calculateMaterialBalanceCp,
  detectPhase,
  getPieceName,
  getCapturedPieceName,
  getPromotionPieceName,
  detectOpening,
  classifyMoveQuality,
  assessCenterControl,
  assessKingSafety,
  assessDevelopment,
  computeImportance,
  formatEvalDisplay,
  sanitiseFen,
} from "./helpers";

// Engine
export { analyzeMove, analyzeMoveHistory } from "./analysis-engine";
