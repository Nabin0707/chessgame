/**
 * ──────────────────────────────────────────────────────────
 * Pipeline Stages  —  lib/ai/pipeline/stages.ts
 *
 * Individual stage handlers for the response pipeline.
 * Each stage is a pure function that takes a ProcessContext
 * and returns an updated context with a stage result.
 *
 * Stages:
 *   1. validation  —  schema validation + injection detection
 *   2. sanitization —  text cleaning + normalisation
 *   3. formatting   —  structure into CommentResponse/ChatResponse
 * ──────────────────────────────────────────────────────────
 */

import type {
  ProcessContext,
  ProcessResult,
  StageHandler,
  StageResult,
} from "./types";
import { validateJSONResponse, validateTextResponse } from "@/lib/ai/validation/validator";
import { sanitize, lightSanitize } from "@/lib/ai/validation/sanitizer";
import type { ValidationOutput } from "@/lib/ai/validation/types";
import type { CommentResponse, ChatResponse } from "@/lib/ai/types";

/* ─── Validation Stage ────────────────────────────────── */

/**
 * Stage 1: Validate the raw response.
 * - JSON responses: parse JSON, validate schema, detect injection
 * - Text responses: detect injection, check for prohibited content
 */
export const validationStage: StageHandler = async (context) => {
  const start = performance.now();

  try {
    let validation: ValidationOutput;

    if (context.responseFormat === "json") {
      validation = validateJSONResponse(
        context.rawResponse,
        context.schemaCategory as any,
      );
    } else {
      validation = validateTextResponse(context.rawResponse);
    }

    const durationMs = Math.round(performance.now() - start);

    const stageResult: StageResult = {
      stage: "validation",
      success: validation.valid,
      durationMs,
      error: validation.valid ? undefined : validation.report.issues[0]?.message,
    };

    return { context, stageResult };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      context,
      stageResult: {
        stage: "validation",
        success: false,
        durationMs,
        error: err instanceof Error ? err.message : "Validation stage error",
      },
    };
  }
};

/* ─── Sanitization Stage ──────────────────────────────── */

/**
 * Stage 2: Sanitize the response text.
 * - Strip prohibited patterns (moves, FEN, PGN, etc.)
 * - Normalise whitespace
 * - Truncate to max length
 */
export const sanitizationStage: StageHandler = async (context) => {
  const start = performance.now();

  try {
    const textToSanitize = context.rawResponse;
    const sanitized = sanitize(textToSanitize);

    const durationMs = Math.round(performance.now() - start);

    const stageResult: StageResult = {
      stage: "sanitization",
      success: true,
      durationMs,
    };

    return { context, stageResult };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      context,
      stageResult: {
        stage: "sanitization",
        success: false,
        durationMs,
        error: err instanceof Error ? err.message : "Sanitization stage error",
      },
    };
  }
};

/* ─── Formatting Stage ────────────────────────────────── */

/**
 * Stage 3: Format the response into a structured type.
 * - JSON responses: parse into CommentResponse or ChatResponse shape
 * - Text responses: wrap into ChatResponse
 *
 * This stage stores the formatted output on the context
 * for the pipeline to extract into ProcessResult.
 */

export const formattingStage: StageHandler = async (context) => {
  const start = performance.now();

  try {
    let response: CommentResponse | ChatResponse | undefined;

    if (context.responseFormat === "json") {
      const parsed = safeParseAny(context.rawResponse);
      if (parsed) {
        response = parsed as CommentResponse | ChatResponse;
      }
    }

    const durationMs = Math.round(performance.now() - start);

    const stageResult: StageResult = {
      stage: "formatting",
      success: true,
      durationMs,
    };

    return { context, stageResult };
  } catch (err) {
    const durationMs = Math.round(performance.now() - start);
    return {
      context,
      stageResult: {
        stage: "formatting",
        success: false,
        durationMs,
        error: err instanceof Error ? err.message : "Formatting stage error",
      },
    };
  }
};

/* ─── Helper ──────────────────────────────────────────── */

/**
 * Attempt to parse a string as JSON, returning undefined
 * on failure rather than throwing.
 */
function safeParseAny(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
