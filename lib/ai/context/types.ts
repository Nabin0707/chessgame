/**
 * ──────────────────────────────────────────────────────────
 * Context Builder Types  —  lib/ai/context/types.ts
 *
 * Interfaces for the context builder system.  The context
 * builder is responsible for gathering raw data from:
 *   - lib/chess/game.ts    → game state, FEN, PGN
 *   - lib/engine/          → evaluation scores
 *   - lib/ai/memory/       → conversation + game memory
 *   - Store / preferences  → player profile, settings
 *
 * And assembling them into a `CommentaryContext` that the
 * prompt builder can consume.
 *
 * # Context Flow
 *
 *   Game Store ─→ GameContextBuilder ─→ GameContext
 *   Engine      ─→ MoveContextBuilder ─→ MoveContext
 *                ─→ EvalSnapshot     ─→ EngineEvaluation
 *   Settings    ─→ PlayerContextBuilder ─→ PlayerContext
 *   Memory      ─→ MemorySlice       ─→ ConversationMemory
 *                                           │
 *                        Context Assembler ←─┘
 *                               │
 *                        CommentaryContext
 *                               │
 *                        Prompt Builder
 * ──────────────────────────────────────────────────────────
 */

import type {
  CommentaryContext,
  CommentarySettings,
  GameContext,
  MoveContext,
  PlayerContext,
} from "@/lib/ai/types";

/* ─── Context Builders ───────────────────────────────── */

/** Interface for the game context builder. */
export interface GameContextBuilder {
  /**
   * Build a GameContext from raw game state.
   * Sources: chess.js instance, game store.
   */
  build(params: BuildGameContextParams): GameContext;
}

/** Parameters for GameContextBuilder.build(). */
export interface BuildGameContextParams {
  fen: string;
  pgn: string;
  moveHistory: unknown[];
  turn: "w" | "b";
  moveNumber: number;
  playerColor: "w" | "b";
  halfMoveClock: number;
  fullMoveNumber: number;
  status: unknown;
}

/** Interface for the move context builder. */
export interface MoveContextBuilder {
  /**
   * Build a MoveContext from the last move and engine data.
   * Sources: chess.js move result, engine evaluation store.
   */
  build(params: BuildMoveContextParams): MoveContext;
}

/** Parameters for MoveContextBuilder.build(). */
export interface BuildMoveContextParams {
  lastMove: unknown;
  positionBefore: string;
  positionAfter: string;
  isPlayerMove: boolean;
  engineEvalBefore: number;
  engineEvalAfter: number;
  engineDepth: number;
}

/** Interface for the player context builder. */
export interface PlayerContextBuilder {
  /**
   * Build a PlayerContext from user preferences and history.
   * Sources: settings store, player memory.
   */
  build(params: BuildPlayerContextParams): PlayerContext;
}

/** Parameters for PlayerContextBuilder.build(). */
export interface BuildPlayerContextParams {
  color: "w" | "b";
  rating?: number;
  experience: string;
  gamesPlayed?: number;
}

/* ─── Context Assembler ──────────────────────────────── */

/** Interface for the main context assembler. */
export interface ContextAssembler {
  /**
   * Build the full CommentaryContext by delegating to each
   * sub-builder and merging their outputs.
   */
  assemble(params: AssembleContextParams): CommentaryContext;
}

/** Parameters for ContextAssembler.assemble(). */
export interface AssembleContextParams {
  game: BuildGameContextParams;
  move: BuildMoveContextParams;
  player: BuildPlayerContextParams;
  personalityId: string;
  memory: unknown;
  settings: CommentarySettings;
}

/* ─── Configuration ──────────────────────────────────── */

/** Configuration for the context module. */
export interface ContextConfig {
  /** Whether to include full PGN in the context (may be truncated for long games). */
  includeFullPgn: boolean;
  /** Maximum move history length to include in context. */
  maxMoveHistory: number;
  /** Whether to include engine multi-PV lines. */
  includeMultiPv: boolean;
  /** Maximum number of multi-PV lines to include. */
  maxMultiPvLines: number;
}
