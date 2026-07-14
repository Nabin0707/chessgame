/**
 * ──────────────────────────────────────────────────────────
 * AI Type Definitions  —  lib/ai/types/index.ts
 *
 * Core types for the AI commentary system.  These are
 * pure type definitions with NO implementations — they
 * describe the shape of data that flows through the
 * AI pipeline.
 * ──────────────────────────────────────────────────────────
 */

import type { GameStatus } from "@/types/chess";
import type { EvalScore } from "@/types/engine";

/* ─── String Union Types ─────────────────────────────── */

/** Supported commentary/analysis experience levels. */
export type CommentaryLevel = "beginner" | "intermediate" | "advanced";

/** Which side the human is playing. */
export type PlayerColor = "w" | "b";

/** Phase of the game determined by move count and material. */
export type GamePhase = "opening" | "midgame" | "endgame";

/** Categories of engine-based move quality assessment. */
export type ReactionType =
  | "blunder"
  | "mistake"
  | "inaccuracy"
  | "good"
  | "excellent"
  | "brilliant"
  | "checkmate"
  | "victory"
  | "defeat"
  | "draw"
  | "opening"
  | "midgame"
  | "endgame"
  | "time_trouble"
  | "comeback"
  | "trade"
  | "novelty";

/** Roles in a conversational AI message. */
export type MessageRole = "system" | "user" | "assistant";

/** Stage identifiers in the AI pipeline. */
export type PipelineStage =
  | "move"
  | "chessjs"
  | "stockfish"
  | "context"
  | "memory"
  | "prompt"
  | "gemini"
  | "formatter"
  | "ui";

/** Expected response format from Gemini. */
export type ResponseFormat = "json" | "text" | "markdown";

/** Outcome of the output validation pass. */
export type ValidationResult =
  | { kind: "pass" }
  | { kind: "fail"; reason: string }
  | { kind: "warn"; reason: string };

/* ─── Move & Evaluation Types ────────────────────────── */

/** A single recorded move with contextual metadata. */
export interface MoveRecord {
  moveNumber: number;
  from: string;
  to: string;
  san: string;
  fen: string;
  piece: string;
  captured?: string;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  isPromotion: boolean;
  promotionPiece?: string;
  /** Time spent on this move in milliseconds. */
  timeSpent?: number;
  /** Clock remaining after this move in milliseconds. */
  clock?: number;
}

/** Engine evaluation snapshot for a position. */
export interface EngineEvaluation {
  score: EvalScore | null;
  depth: number;
  bestLine: string[];
  multiPv: Array<{
    score: EvalScore;
    line: string[];
    depth: number;
  }>;
  isThinking: boolean;
  isReady: boolean;
}

/** Move quality assessment derived from engine evaluation delta. */
export interface MoveQuality {
  type: ReactionType;
  label: string;
  centipawnLoss: number;
  previousEval: number;
  currentEval: number;
  phase: GamePhase;
}

/* ─── Context Types ──────────────────────────────────── */

/** Full game state snapshot passed to the AI pipeline. */
export interface GameContext {
  fen: string;
  pgn: string;
  moveHistory: MoveRecord[];
  gameStatus: GameStatus;
  turn: "w" | "b";
  moveNumber: number;
  playerColor: PlayerColor;
  /** Number of half-moves since last capture or pawn advance (fifty-move rule). */
  halfMoveClock: number;
  /** Full-move counter (starts at 1, increments after Black's move). */
  fullMoveNumber: number;
}

/** Context specific to the last-played move. */
export interface MoveContext {
  lastMove: MoveRecord;
  positionBefore: string;
  positionAfter: string;
  isPlayerMove: boolean;
  moveQuality: MoveQuality | null;
}

/** Player profile used to personalise AI responses. */
export interface PlayerContext {
  color: PlayerColor;
  /** Optional Elo rating (estimated or user-provided). */
  rating?: number;
  experience: CommentaryLevel;
  /** Number of games played (for learning player patterns). */
  gamesPlayed?: number;
}

/** Aggregated context passed to the prompt builder. */
export interface CommentaryContext {
  game: GameContext;
  move: MoveContext;
  player: PlayerContext;
  evaluation: EngineEvaluation;
  personalityId: string;
  memory: ConversationTranscript;
  timestamp: number;
}

/* ─── Message Types ──────────────────────────────────── */

/** A single message in an AI conversation. */
export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  /** Arbitrary metadata attached to the message (token counts, model, etc.). */
  metadata?: Record<string, unknown>;
}

/** A conversation transcript exchanged with the AI. */
export interface ConversationTranscript {
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
}

/* ─── Request / Response Types ───────────────────────── */

/** Complete request payload for generating commentary on a move. */
export interface CommentRequest {
  type: ReactionType;
  gameContext: GameContext;
  moveContext: MoveContext;
  evaluation: EngineEvaluation;
  personalityId: string;
  conversationHistory: ConversationTranscript;
  playerContext: PlayerContext;
  settings: CommentarySettings;
}

/** Structured response from the commentary pipeline. */
export interface CommentResponse {
  id: string;
  commentary: string;
  /** Emoji reactions to display alongside the commentary. */
  reactions: string[];
  grade?: {
    type: ReactionType;
    label: string;
    emoji: string;
  };
  /** Brief strategic tip derived from the position. */
  tip?: string;
  /** Suggested follow-up questions the player can ask. */
  followUpQuestions: string[];
  metadata: {
    personalityId: string;
    timestamp: number;
    /** Round-trip latency for the Gemini call in milliseconds. */
    latency: number;
    /** Gemini model identifier (e.g. "gemini-2.0-flash"). */
    model?: string;
  };
}

/** A request sent to the chat endpoint for free-form conversation. */
export interface ChatRequest {
  message: string;
  gameContext: GameContext;
  evaluation: EngineEvaluation;
  personalityId: string;
  conversationHistory: ConversationTranscript;
  settings: CommentarySettings;
}

/** Response from the chat endpoint. */
export interface ChatResponse {
  id: string;
  reply: string;
  followUpQuestions: string[];
  metadata: {
    personalityId: string;
    timestamp: number;
    latency: number;
    model?: string;
  };
}

/** Settings that control commentary behaviour. */
export interface CommentarySettings {
  enabled: boolean;
  level: CommentaryLevel;
  personalityId: string;
  reactToBlunders: boolean;
  reactToBrilliant: boolean;
  analyzeInRealTime: boolean;
  /** Minimum interval between AI API calls in milliseconds. */
  rateLimitMs: number;
  /** Maximum number of recent messages to include in context. */
  maxContextLength: number;
}

/* ─── Pipeline Types ─────────────────────────────────── */

/** A single stage execution record in the pipeline. */
export interface PipelineStageRecord {
  stage: PipelineStage;
  startedAt: number;
  completedAt: number;
  durationMs: number;
  success: boolean;
  error?: string;
}

/** Context object passed through the entire AI pipeline. */
export interface PipelineContext {
  requestId: string;
  currentStage: PipelineStage;
  startedAt: number;
  stages: PipelineStageRecord[];
  game: GameContext;
  move: MoveContext;
  player: PlayerContext;
  evaluation: EngineEvaluation;
  personalityId: string;
  memory: ConversationTranscript;
  /** The rendered prompt string sent to Gemini. */
  prompt?: string;
  /** The raw response string received from Gemini. */
  rawResponse?: string;
  /** The validated/parsed response. */
  response?: CommentResponse | ChatResponse;
  /** Validation outcome. */
  validation?: ValidationResult;
  /** Any error that occurred during pipeline execution. */
  error?: string;
}

/* ─── Statistical Types ──────────────────────────────── */

/** Aggregated player statistics maintained across games. */
export interface PlayerStats {
  totalGames: number;
  totalMoves: number;
  /** Average accuracy percentage. */
  accuracy: number;
  /** Recurring strengths detected by the AI. */
  strengths: string[];
  /** Recurring weaknesses detected by the AI. */
  weaknesses: string[];
  /** Favourite openings (ECO codes or names). */
  favoriteOpenings: string[];
}

/** A recorded commentary event for display or later review. */
export interface CommentRecord {
  moveNumber: number;
  reactionType: ReactionType;
  content: string;
  personalityId: string;
  timestamp: number;
}
