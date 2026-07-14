/**
 * Validation — lib/ai/validation/index.ts
 *
 * Response validation system for Gemini output.
 * Implements ADR-006 Layer 2: post-generation output validation.
 */
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
} from "./types";

export {
  DEFAULT_DETECTOR_CONFIG,
  detectAll,
  detectAlgebraicMoves,
  detectFEN,
  detectMoveSuggestions,
  detectPGN,
  detectPartialMoves,
  detectUCI,
  generateReport,
  scanResponse,
} from "./detector";

export {
  DEFAULT_SANITIZER_CONFIG,
  lightSanitize,
  normalizeWhitespace,
  sanitize,
  stripAlgebraicMoves,
  stripFEN,
  stripMoveSuggestions,
  stripPGN,
  stripUCI,
  truncate,
} from "./sanitizer";

export {
  CommentResponseSchema,
  ChatResponseSchema,
  GradeSchema,
  MetadataSchema,
  PostGameSummarySchema,
  RESPONSE_SCHEMAS,
  UnifiedResponseSchema,
  safeParseJSON,
  validateAgainstSchema,
} from "./schemas";

export {
  DEFAULT_FALLBACK_CONFIG,
  DEFAULT_VALIDATOR_CONFIG,
  getApiErrorMessage,
  getFallbackChatResponse,
  getFallbackCommentary,
  getRateLimitMessage,
  validateJSONResponse,
  validateTextResponse,
} from "./validator";
export type { ResponseSchemaCategory, CommentResponseSchemaType, ChatResponseSchemaType, PostGameSummarySchemaType } from "./schemas";
