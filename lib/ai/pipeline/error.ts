/**
 * ──────────────────────────────────────────────────────────
 * Pipeline Error Handling  —  lib/ai/pipeline/error.ts
 *
 * Error classification, fallback generation, and recovery
 * strategies for the response processing pipeline.
 *
 * Errors are classified as:
 *   - **fatal** — pipeline cannot continue, use fallback
 *   - **recoverable** — stage failed but pipeline can continue
 *   - **warning** — non-critical issue, logged but ignored
 * ──────────────────────────────────────────────────────────
 */

import type {
  ErrorCategory,
  ErrorSeverity,
  PipelineError,
  ProcessContext,
  StageId,
} from "./types";

/* ─── Error Classifier ────────────────────────────────── */

/**
 * Classify an error by category and severity based on its
 * characteristics.
 */
export function classifyError(
  error: unknown,
  stage?: StageId,
): PipelineError {
  const message = extractMessage(error);

  // Zod schema validation errors
  if (message.includes("ZodError") || message.includes("schema validation")) {
    return {
      category: "validation",
      severity: "fatal",
      message: "Response failed schema validation",
      cause: error,
      stage,
    };
  }

  // JSON parse errors
  if (
    message.includes("JSON") ||
    message.includes("parse") ||
    message.includes("Unexpected token")
  ) {
    return {
      category: "formatting",
      severity: "fatal",
      message: "Failed to parse response as JSON",
      cause: error,
      stage,
    };
  }

  // Injection detection — prohibited content found
  if (
    message.includes("injection") ||
    message.includes("prohibited") ||
    message.includes("ALGEBRAIC_MOVE") ||
    message.includes("UCI_MOVE")
  ) {
    return {
      category: "validation",
      severity: "fatal",
      message: "Prohibited content detected in response",
      cause: error,
      stage,
    };
  }

  // Sanitization errors
  if (message.includes("sanitize") || message.includes("strip")) {
    return {
      category: "sanitization",
      severity: "recoverable",
      message: "Sanitization encountered an issue",
      cause: error,
      stage,
    };
  }

  // Timeout
  if (message.includes("timeout") || message.includes("timed out")) {
    return {
      category: "timeout",
      severity: "fatal",
      message: "Pipeline execution timed out",
      cause: error,
      stage,
    };
  }

  // Default: unknown error, treat as recoverable internal error
  return {
    category: "internal",
    severity: "recoverable",
    message: `Unexpected pipeline error: ${message}`,
    cause: error,
    stage,
  };
}

/**
 * Extract a human-readable message from any error type.
 */
function extractMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const msg = (error as Record<string, unknown>).message;
    if (typeof msg === "string") return msg;
  }
  return "Unknown error";
}

/* ─── Severity Checks ─────────────────────────────────── */

/** Check if an error is fatal (pipeline should stop). */
export function isFatal(error: PipelineError): boolean {
  return error.severity === "fatal";
}

/** Check if an error is recoverable (pipeline can continue). */
export function isRecoverable(error: PipelineError): boolean {
  return error.severity === "recoverable";
}

/** Check if an error is a warning (log and continue). */
export function isWarning(error: PipelineError): boolean {
  return error.severity === "warning";
}

/* ─── Fallback Generator ──────────────────────────────── */

/**
 * Generate a context-appropriate fallback message based on
 * the pipeline error.
 */
export function generateFallbackMessage(
  context: ProcessContext,
  error?: PipelineError,
): string {
  // If there's an error, try to give relevant feedback
  if (error) {
    switch (error.category) {
      case "validation":
        return "I need to reconsider that position. Let's focus on the board.";
      case "formatting":
        return "An interesting moment in the game!";
      case "timeout":
        return "The analysis took too long. Let's keep playing!";
      default:
        break;
    }
  }

  // Fall back to personality-based or default messages
  const eventType = context.eventType;

  switch (eventType) {
    case "blunder":
    case "mistake":
    case "inaccuracy":
      return "Every move is a learning opportunity.";
    case "brilliant":
    case "excellent":
      return "A strong move! You're playing well.";
    case "checkmate":
    case "victory":
      return "Game over! Well played.";
    case "defeat":
      return "Game over. Good effort!";
    case "draw":
      return "The game ended in a draw.";
    default:
      return "An interesting position. Take your time and consider your options.";
  }
}

/**
 * Generate a fallback for chat responses.
 */
export function generateChatFallback(
  context: ProcessContext,
  error?: PipelineError,
): string {
  if (error?.category === "validation") {
    return "I'd love to help, but I need to focus on the position rather than specific moves. What strategic concept would you like to discuss?";
  }
  return "Interesting question! Let's look at the broader position instead.";
}

/* ─── Error Logging ───────────────────────────────────── */

/**
 * Format a pipeline error for logging.
 */
export function formatErrorLog(error: PipelineError): string {
  return [
    `[Pipeline] ${error.severity.toUpperCase()} [${error.category}]`,
    error.stage ? `@${error.stage}` : "",
    error.message,
    error.cause ? `\n  Cause: ${extractMessage(error.cause)}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}
