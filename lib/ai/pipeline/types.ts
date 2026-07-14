/**
 * ──────────────────────────────────────────────────────────
 * Pipeline Types  —  lib/ai/pipeline/types.ts
 *
 * Types for the response processing pipeline. The pipeline
 * sits between Gemini and the UI, orchestrating validation,
 * sanitization, and formatting.
 *
 * # Stage Flow
 *
 *   ProcessContext (raw response + metadata)
 *        ↓
 *   ValidationStage  →  ValidationOutput
 *        ↓
 *   SanitizationStage →  Sanitized text
 *        ↓
 *   FormattingStage   →  CommentResponse | ChatResponse
 *        ↓
 *   ProcessResult
 * ──────────────────────────────────────────────────────────
 */

import type {
  ChatResponse,
  CommentResponse,
  CommentarySettings,
  GameContext,
  MoveContext,
  PlayerContext,
  ReactionType,
  ValidationResult,
} from "@/lib/ai/types";
import type { EngineEvaluation } from "@/lib/ai/types";
import type { ValidationOutput } from "@/lib/ai/validation/types";

/* ─── Pipeline Stages ─────────────────────────────────── */

/** Identifiers for each stage in the pipeline. */
export type StageId =
  | "validation"
  | "sanitization"
  | "formatting"
  | "fallback";

/** Execution status of a single stage. */
export interface StageResult {
  /** The stage identifier. */
  stage: StageId;
  /** Whether the stage completed successfully. */
  success: boolean;
  /** Time taken in milliseconds. */
  durationMs: number;
  /** Error message if the stage failed. */
  error?: string;
}

/* ─── Process Context ─────────────────────────────────── */

/** Input context passed to every stage of the pipeline. */
export interface ProcessContext {
  /** The raw text response from Gemini. */
  rawResponse: string;
  /** The personality ID used for this response. */
  personalityId: string;
  /** The event type that triggered the response. */
  eventType: ReactionType;
  /** Expected response format (json or text). */
  responseFormat: "json" | "text";
  /** Category for schema selection. */
  schemaCategory: string;
  /** Game context for fallback generation. */
  gameContext?: GameContext;
  /** Move context for fallback generation. */
  moveContext?: MoveContext;
  /** Player context for personalisation. */
  playerContext?: PlayerContext;
  /** Engine evaluation for context. */
  evaluation?: EngineEvaluation;
  /** Commentary settings. */
  settings?: CommentarySettings;
}

/* ─── Process Result ──────────────────────────────────── */

/** Final result from the pipeline after all stages. */
export interface ProcessResult {
  /** Whether the overall process succeeded. */
  success: boolean;
  /** The structured response (if formatting succeeded). */
  response?: CommentResponse | ChatResponse;
  /** Fallback commentary text (if validation/formatting failed). */
  fallbackText?: string;
  /** Whether a fallback was used instead of the original response. */
  usedFallback: boolean;
  /** Validation output from the validation stage. */
  validation: ValidationOutput;
  /** Results from each pipeline stage. */
  stages: StageResult[];
  /** Total pipeline execution time in milliseconds. */
  totalDurationMs: number;
  /** Final validation result. */
  validationResult: ValidationResult;
}

/* ─── Stage Handlers ──────────────────────────────────── */

/**
 * A pipeline stage handler.
 * Receives the current context and accumulated stage results,
 * returns updated context and the stage's result.
 */
export type StageHandler = (
  context: ProcessContext,
  previousStages: StageResult[],
) => Promise<{
  context: ProcessContext;
  stageResult: StageResult;
}>;

/* ─── Pipeline Configuration ──────────────────────────── */

/** Configuration for the response pipeline. */
export interface PipelineConfig {
  /** Whether the validation stage is enabled. */
  enableValidation: boolean;
  /** Whether the sanitization stage is enabled. */
  enableSanitization: boolean;
  /** Whether the formatting stage is enabled. */
  enableFormatting: boolean;
  /** Whether to use fallback responses on failure. */
  enableFallback: boolean;
  /** Whether to stop on first stage failure. */
  failFast: boolean;
  /** Maximum total pipeline execution time in milliseconds. */
  timeoutMs: number;
}

export const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  enableValidation: true,
  enableSanitization: true,
  enableFormatting: true,
  enableFallback: true,
  failFast: false,
  timeoutMs: 5000,
};

/* ─── Error Types ─────────────────────────────────────── */

/** Categories of pipeline errors for classification. */
export type ErrorCategory =
  | "validation"
  | "sanitization"
  | "formatting"
  | "timeout"
  | "internal";

/** Severity of a pipeline error. */
export type ErrorSeverity = "fatal" | "recoverable" | "warning";

/** Typed pipeline error with category and severity. */
export interface PipelineError {
  /** Error category for routing. */
  category: ErrorCategory;
  /** Severity — determines whether the pipeline continues. */
  severity: ErrorSeverity;
  /** Human-readable message. */
  message: string;
  /** Original error if this wraps another error. */
  cause?: unknown;
  /** The stage where the error occurred. */
  stage?: StageId;
}
