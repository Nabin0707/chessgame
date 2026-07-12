/**
 * Evaluation score from Stockfish.
 *
 * - `cp`: centipawn evaluation (e.g. +0.45 means White is ahead by 0.45 pawns)
 * - `mate`: forced mate (positive = White is delivering mate, negative = Black is)
 */
export interface EvalScore {
  type: "cp" | "mate";
  value: number;
}

/** Human-readable string for an evaluation score. */
export function formatEval(score: EvalScore): string {
  if (score.type === "mate") {
    const abs = Math.abs(score.value);
    return `Mate in ${abs}`;
  }
  const centipawns = score.value / 100;
  const sign = centipawns > 0 ? "+" : "";
  return `${sign}${centipawns.toFixed(2)}`;
}

/** Current state of the engine connection. */
export interface EngineState {
  isReady: boolean;
  isThinking: boolean;
  evaluation: EvalScore | null;
  bestMove: string | null;
}

/** Options that control how Stockfish searches. */
export interface SearchOptions {
  depth?: number;
  movetime?: number;
}

/**
 * Callbacks passed to evaluate() / getBestMove().
 * At least one callback must be provided to receive engine output.
 */
export interface EngineCallbacks {
  /** Fired whenever a new evaluation score is available (search in progress). */
  onEval?: (score: EvalScore) => void;
  /** Fired when the engine finishes its search and returns a best move. */
  onBestMove?: (move: string) => void;
  /** Fired after the engine sends "readyok". */
  onReady?: () => void;
  /** Fired on engine errors. */
  onError?: (error: string) => void;
}
