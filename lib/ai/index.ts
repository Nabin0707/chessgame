/**
 * ──────────────────────────────────────────────────────────
 * AI Module  —  lib/ai/index.ts
 *
 * Re-exports all public types from the AI subsystem's eight
 * submodules.  This is the single entry point for consuming
 * AI types across the codebase.
 *
 * # Submodules
 *
 *   types/          — Core AI types (unions, contexts, messages, responses)
 *   personalities/  — Commentary personality definitions and registry
 *   prompts/        — Prompt templates, categories, and config
 *   memory/         — Game, conversation, and player memory interfaces
 *   context/        — Context assemblers for building CommentaryContext
 *   formatter/      — Output formatting, parsing, and validation interfaces
 *   validation/     — Response schema validation, injection detection, sanitization
 *   pipeline/       — Response processing pipeline orchestrator
 * ──────────────────────────────────────────────────────────
 */

/* ─── Core Types ─────────────────────────────────────── */

export type {
  CommentaryLevel,
  PlayerColor,
  GamePhase,
  ReactionType,
  MessageRole,
  PipelineStage,
  ResponseFormat,
  ValidationResult,
  MoveRecord,
  EngineEvaluation,
  MoveQuality,
  GameContext,
  MoveContext,
  PlayerContext,
  CommentaryContext,
  AIMessage,
  ConversationTranscript,
  CommentRequest,
  CommentResponse,
  ChatRequest,
  ChatResponse,
  CommentarySettings,
  PipelineStageRecord,
  PipelineContext,
  PlayerStats,
  CommentRecord,
} from "@/lib/ai/types";

/* ─── Personalities ──────────────────────────────────── */

export type {
  Tone,
  HumorLevel,
  AggressionLevel,
  EmojiStyle,
  ReactionTemplates,
  Personality,
  PersonalityRegistry,
} from "@/lib/ai/personalities/types";

export {
  BUILT_IN_PERSONALITIES,
  DEFAULT_PERSONALITY,
  PERSONALITY_MAP,
} from "@/lib/ai/personalities/personalities";

/* ─── Prompts ────────────────────────────────────────── */

export type {
  PromptVariable,
  PromptCategory,
  PromptTemplate,
  BuiltPrompt,
  PromptConfig,
} from "@/lib/ai/prompts/types";

export {
  SYSTEM_PROMPT_SHELL,
  PROMPT_TEMPLATES,
  PROMPT_TEMPLATES_BY_CATEGORY,
} from "@/lib/ai/prompts/templates";

/* ─── Memory ─────────────────────────────────────────── */

export type {
  ConversationMemory,
  ConversationMemoryConfig,
  GameMemory,
  MemorySlice,
  PlayerMemory,
} from "@/lib/ai/memory/types";

/* ─── Context ────────────────────────────────────────── */

export type {
  ContextAssembler,
  ContextConfig,
  AssembleContextParams,
  GameContextBuilder,
  BuildGameContextParams,
  MoveContextBuilder,
  BuildMoveContextParams,
  PlayerContextBuilder,
  BuildPlayerContextParams,
} from "@/lib/ai/context/types";

/* ─── Formatter ──────────────────────────────────────── */

export type {
  CommentaryFormatter,
  ChatFormatter,
  EmojiApplier,
  ResponseParser,
  GradeExtractor,
  FormatCommentaryParams,
  FormatChatParams,
  FormatterConfig,
  GradeResult,
  ParsedTextResponse,
} from "@/lib/ai/formatter/types";

/* ─── Validation ─────────────────────────────────────── */

export type {
  DetectionCategory,
  DetectionPattern,
  DetectionResult,
  DetectorConfig,
  FallbackConfig,
  SanitizerConfig,
  ValidationIssue,
  ValidationOutput,
  ValidationReport,
  ValidationSeverity,
  ValidatorConfig,
} from "@/lib/ai/validation/types";

export type { ResponseSchemaCategory } from "@/lib/ai/validation/schemas";

export {
  detectAlgebraicMoves,
  detectAll,
  detectFEN,
  detectMoveSuggestions,
  detectPartialMoves,
  detectPGN,
  detectUCI,
  generateReport,
  scanResponse,
} from "@/lib/ai/validation/detector";

export {
  lightSanitize,
  normalizeWhitespace,
  sanitize,
  stripAlgebraicMoves,
  stripFEN,
  stripMoveSuggestions,
  stripPGN,
  stripUCI,
  truncate,
} from "@/lib/ai/validation/sanitizer";

export {
  CommentResponseSchema,
  ChatResponseSchema,
  PostGameSummarySchema,
  GradeSchema,
  safeParseJSON,
  validateAgainstSchema,
} from "@/lib/ai/validation/schemas";

export {
  DEFAULT_VALIDATOR_CONFIG,
  validateJSONResponse,
  validateTextResponse,
  getFallbackCommentary,
  getFallbackChatResponse,
  getRateLimitMessage,
  getApiErrorMessage,
} from "@/lib/ai/validation/validator";

/* ─── Pipeline ───────────────────────────────────────── */

export type {
  PipelineConfig,
  PipelineError,
  ProcessContext,
  ProcessResult,
  StageHandler,
  StageId,
  StageResult,
  ErrorCategory,
  ErrorSeverity,
} from "@/lib/ai/pipeline/types";

export { DEFAULT_PIPELINE_CONFIG } from "@/lib/ai/pipeline/types";

export {
  classifyError,
  formatErrorLog,
  generateChatFallback,
  generateFallbackMessage,
  isFatal,
  isRecoverable,
  isWarning,
} from "@/lib/ai/pipeline/error";

/* ─── Orchestrator ───────────────────────────────────── */

export type {
  OrchestratorConfig,
  CommentaryQueueItem,
  CommentaryResult,
  OrchestratorEvent,
  FetchCommentaryFn,
} from "@/lib/ai/orchestrator/types";

export { DEFAULT_ORCHESTRATOR_CONFIG } from "@/lib/ai/orchestrator/types";
export { CommentaryOrchestrator } from "@/lib/ai/orchestrator/orchestrator";

export {
  runPipeline,
  processCommentary,
  processChat,
  processPostGameSummary,
} from "@/lib/ai/pipeline/pipeline";
