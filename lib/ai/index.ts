/**
 * ──────────────────────────────────────────────────────────
 * AI Module  —  lib/ai/index.ts
 *
 * Re-exports all public types from the AI subsystem's six
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
