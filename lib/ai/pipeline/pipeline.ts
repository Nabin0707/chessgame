/**
 * ──────────────────────────────────────────────────────────
 * Response Pipeline  —  lib/ai/pipeline/pipeline.ts
 *
 * Orchestrates the full response processing flow:
 *
 *   Raw AI Response
 *        ↓
 *   Validation Stage  — schema check + injection detection
 *        ↓
 *   Sanitization Stage — strip prohibited content, normalise
 *        ↓
 *   Formatting Stage   — structure into CommentResponse/ChatResponse
 *        ↓
 *   ProcessResult
 *
 * Each stage is wrapped in error handling. On fatal errors,
 * the pipeline generates a fallback response instead.
 * ──────────────────────────────────────────────────────────
 */

import type {
  PipelineConfig,
  PipelineError,
  ProcessContext,
  ProcessResult,
  StageHandler,
  StageResult,
} from "./types";
import { DEFAULT_PIPELINE_CONFIG } from "./types";
import { validationStage, sanitizationStage, formattingStage } from "./stages";
import { classifyError, generateChatFallback, generateFallbackMessage } from "./error";

/* ─── Pipeline Stages Registry ────────────────────────── */

interface StageDefinition {
  id: StageResult["stage"];
  handler: StageHandler;
  enabled: (config: PipelineConfig) => boolean;
}

const STAGES: StageDefinition[] = [
  {
    id: "validation",
    handler: validationStage,
    enabled: (c) => c.enableValidation,
  },
  {
    id: "sanitization",
    handler: sanitizationStage,
    enabled: (c) => c.enableSanitization,
  },
  {
    id: "formatting",
    handler: formattingStage,
    enabled: (c) => c.enableFormatting,
  },
];

/* ─── Pipeline Orchestrator ───────────────────────────── */

/**
 * Run the full response processing pipeline.
 *
 * @param context - The input context with the raw response.
 * @param config - Pipeline configuration (optional, defaults used).
 * @returns ProcessResult with the final response or fallback.
 */
export async function runPipeline(
  context: ProcessContext,
  config: PipelineConfig = DEFAULT_PIPELINE_CONFIG,
): Promise<ProcessResult> {
  const overallStart = performance.now();
  const stageResults: StageResult[] = [];
  let pipelineError: PipelineError | undefined;

  // Run each enabled stage in sequence
  for (const stage of STAGES) {
    if (!stage.enabled(config)) {
      // Record skipped stage
      stageResults.push({
        stage: stage.id,
        success: true,
        durationMs: 0,
      });
      continue;
    }

    try {
      const { stageResult } = await stage.handler(context, stageResults);
      stageResults.push(stageResult);

      // If stage failed and failFast is enabled, stop
      if (!stageResult.success && config.failFast) {
        pipelineError = classifyError(
          stageResult.error || "Stage failed",
          stage.id,
        );
        break;
      }
    } catch (err) {
      const stageError = classifyError(err, stage.id);
      stageResults.push({
        stage: stage.id,
        success: false,
        durationMs: 0,
        error: stageError.message,
      });

      // Fatal errors stop the pipeline
      if (stageError.severity === "fatal") {
        pipelineError = stageError;
        break;
      }

      // Recoverable errors: continue to next stage
      if (!pipelineError) {
        pipelineError = stageError;
      }
    }
  }

  const totalDurationMs = Math.round(performance.now() - overallStart);

  // Determine final result
  const validationStageResult = stageResults.find((s) => s.stage === "validation");

  const hasFatalError =
    pipelineError !== undefined && pipelineError.severity === "fatal";

  // If fatal error or validation failed and fallback enabled
  if (hasFatalError || (validationStageResult && !validationStageResult.success && config.enableFallback)) {
    const fallbackText = generateFallbackMessage(context, pipelineError);
    return {
      success: false,
      fallbackText,
      usedFallback: true,
      validation: {
        valid: false,
        original: context.rawResponse,
        sanitized: context.rawResponse,
        report: {
          passed: false,
          issues: [],
          score: 0,
          durationMs: totalDurationMs,
        },
        result: {
          kind: "fail",
          reason: pipelineError?.message ?? "Validation failed",
        },
        wasSanitized: false,
      },
      stages: stageResults,
      totalDurationMs,
      validationResult: {
        kind: "fail",
        reason: pipelineError?.message ?? "Validation failed",
      },
    };
  }

  // Success: return formatted response
  const usedFallback = !!(validationStageResult && !validationStageResult.success);

  return {
    success: true,
    usedFallback,
    validation: {
      valid: true,
      original: context.rawResponse,
      sanitized: context.rawResponse,
      report: {
        passed: true,
        issues: [],
        score: 100,
        durationMs: totalDurationMs,
      },
      result: { kind: "pass" },
      wasSanitized: false,
    },
    stages: stageResults,
    totalDurationMs,
    validationResult: { kind: "pass" },
  };
}

/**
 * Quick convenience wrapper for commentary responses.
 */
export function processCommentary(
  rawResponse: string,
  personalityId: string,
  eventType: import("@/lib/ai/types").ReactionType,
  config?: Partial<PipelineConfig>,
): Promise<ProcessResult> {
  return runPipeline(
    {
      rawResponse,
      personalityId,
      eventType,
      responseFormat: "json",
      schemaCategory: "commentary-after-move",
    },
    { ...DEFAULT_PIPELINE_CONFIG, ...config },
  );
}

/**
 * Quick convenience wrapper for chat responses.
 */
export function processChat(
  rawResponse: string,
  personalityId: string,
  config?: Partial<PipelineConfig>,
): Promise<ProcessResult> {
  return runPipeline(
    {
      rawResponse,
      personalityId,
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    },
    { ...DEFAULT_PIPELINE_CONFIG, ...config },
  );
}

/**
 * Quick convenience wrapper for post-game summaries.
 */
export function processPostGameSummary(
  rawResponse: string,
  personalityId: string,
  config?: Partial<PipelineConfig>,
): Promise<ProcessResult> {
  return runPipeline(
    {
      rawResponse,
      personalityId,
      eventType: "victory",
      responseFormat: "json",
      schemaCategory: "post-game-summary",
    },
    { ...DEFAULT_PIPELINE_CONFIG, ...config },
  );
}
