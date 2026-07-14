/**
 * Pipeline — lib/ai/pipeline/index.ts
 *
 * Response processing pipeline orchestrating validation,
 * sanitization, and formatting between Gemini and the UI.
 */
export type {
  ErrorCategory,
  ErrorSeverity,
  PipelineConfig,
  PipelineError,
  ProcessContext,
  ProcessResult,
  StageHandler,
  StageId,
  StageResult,
} from "./types";

export { DEFAULT_PIPELINE_CONFIG } from "./types";

export {
  classifyError,
  formatErrorLog,
  generateChatFallback,
  generateFallbackMessage,
  isFatal,
  isRecoverable,
  isWarning,
} from "./error";

export {
  formattingStage,
  sanitizationStage,
  validationStage,
} from "./stages";

export {
  processChat,
  processCommentary,
  processPostGameSummary,
  runPipeline,
} from "./pipeline";
