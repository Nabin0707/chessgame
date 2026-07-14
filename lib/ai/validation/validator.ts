/**
 * ──────────────────────────────────────────────────────────
 * Main Validator  —  lib/ai/validation/validator.ts
 *
 * Orchestrates the full validation pipeline:
 *
 *   1. JSON parsing (if response format is JSON)
 *   2. Schema validation against Zod schemas
 *   3. Prompt injection / content detection
 *   4. Sanitization (auto-fix mode)
 *   5. Fallback generation on failure
 *
 * The validator is the gatekeeper between Gemini and the UI.
 * It implements ADR-006 Layer 2: post-generation validation.
 *
 * # Usage
 *
 *   const result = validateCommentary(rawText, {
 *     category: "commentary-after-move",
 *     personalityId: "the-coach",
 *   });
 *   if (!result.valid) {
 *     return generateFallback(result.report);
 *   }
 *   return result.sanitized;
 * ──────────────────────────────────────────────────────────
 */

import type { ReactionType, ValidationResult } from "@/lib/ai/types";
import type { Personality } from "@/lib/ai/personalities/types";

import {
  type DetectorConfig,
  type FallbackConfig,
  type SanitizerConfig,
  type ValidationOutput,
  type ValidationReport,
  type ValidatorConfig,
} from "./types";
import {
  DEFAULT_DETECTOR_CONFIG,
  scanResponse,
} from "./detector";
import { DEFAULT_SANITIZER_CONFIG, sanitize } from "./sanitizer";
import {
  type ResponseSchemaCategory,
  safeParseJSON,
  validateAgainstSchema,
} from "./schemas";

/* ─── Default Config ──────────────────────────────────── */

export const DEFAULT_VALIDATOR_CONFIG: ValidatorConfig = {
  enableSchemaValidation: true,
  enableInjectionDetection: true,
  enableSanitization: true,
  autoFix: true,
  scoreThreshold: 70,
  detector: DEFAULT_DETECTOR_CONFIG,
  sanitizer: DEFAULT_SANITIZER_CONFIG,
};

export const DEFAULT_FALLBACK_CONFIG: FallbackConfig = {
  usePersonalityFallback: true,
  defaultCommentary:
    "An interesting moment in the game. Consider the key pieces and their activity.",
  defaultChatResponse:
    "I'm not able to provide analysis right now, but feel free to ask again.",
  rateLimitedMessage:
    "You're asking a lot of questions! Give me a moment to catch up.",
  apiErrorMessage:
    "I couldn't reach my分析 engine. Let's keep playing!",
};

/* ─── Fallback Generator ──────────────────────────────── */

/**
 * Generate a fallback commentary string based on the
 * personality and event type.
 */
export function getFallbackCommentary(
  personalityId: string,
  eventType: ReactionType,
  personalities: Personality[],
  config: FallbackConfig = DEFAULT_FALLBACK_CONFIG,
): string {
  if (config.usePersonalityFallback) {
    const personality = personalities.find((p) => p.id === personalityId);
    if (personality) {
      const templates = personality.reactionTemplates[eventType];
      if (templates && templates.length > 0) {
        return templates[Math.floor(Math.random() * templates.length)];
      }
    }
  }
  return config.defaultCommentary;
}

/**
 * Generate a fallback chat response.
 */
export function getFallbackChatResponse(
  config: FallbackConfig = DEFAULT_FALLBACK_CONFIG,
): string {
  return config.defaultChatResponse;
}

/**
 * Generate a rate-limit fallback message.
 */
export function getRateLimitMessage(
  config: FallbackConfig = DEFAULT_FALLBACK_CONFIG,
): string {
  return config.rateLimitedMessage;
}

/**
 * Generate an API error fallback message.
 */
export function getApiErrorMessage(
  config: FallbackConfig = DEFAULT_FALLBACK_CONFIG,
): string {
  return config.apiErrorMessage;
}

/* ─── Validation ──────────────────────────────────────── */

/**
 * Validate a raw Gemini response for JSON commentary.
 * Attempts JSON parsing, schema validation, and injection detection.
 */
export function validateJSONResponse(
  raw: string,
  category: ResponseSchemaCategory,
  validatorConfig: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG,
): ValidationOutput {
  const start = performance.now();
  const issues: ValidationReport["issues"] = [];
  let sanitized = raw;
  let wasSanitized = false;

  // Step 1: Parse JSON
  const parsed = safeParseJSON(raw);
  if (!parsed.success) {
    const durationMs = Math.round(performance.now() - start);
    return {
      valid: false,
      original: raw,
      sanitized: raw,
      report: {
        passed: false,
        issues: [
          {
            code: "INVALID_JSON",
            severity: "error",
            message: `Response is not valid JSON: ${parsed.error}`,
            suggestion: "Ensure the response is valid JSON.",
          },
        ],
        score: 0,
        durationMs,
      },
      result: { kind: "fail", reason: `Invalid JSON: ${parsed.error}` },
      wasSanitized: false,
    };
  }

  // Step 2: Schema validation
  if (validatorConfig.enableSchemaValidation) {
    const schemaResult = validateAgainstSchema(parsed.data, category);
    if (!schemaResult.success) {
      issues.push({
        code: "SCHEMA_VALIDATION_FAILED",
        severity: "error",
        message: `Response failed schema validation: ${schemaResult.error}`,
        location: "response",
        suggestion: "Ensure the response matches the expected schema.",
      });
    }
  }

  // Step 3: Injection detection
  if (validatorConfig.enableInjectionDetection) {
    const injectionReport = scanResponse(
      typeof parsed.data === "string"
        ? parsed.data
        : JSON.stringify(parsed.data),
      validatorConfig.detector,
    );
    issues.push(...injectionReport.issues);
  }

  // Determine validity
  const errors = issues.filter((i) => i.severity === "error");
  const passed = errors.length === 0;

  // Step 4: Sanitization (only if auto-fix is enabled)
  if (
    validatorConfig.enableSanitization &&
    validatorConfig.autoFix &&
    passed
  ) {
    const cleaned = sanitize(
      typeof parsed.data === "string"
        ? parsed.data
        : JSON.stringify(parsed.data),
      validatorConfig.sanitizer,
    );
    if (cleaned !== raw) {
      sanitized = cleaned;
      wasSanitized = true;
    }
  }

  // Calculate score
  const score =
    issues.length === 0
      ? 100
      : Math.max(
          0,
          100 -
            errors.length * 25 -
            (issues.length - errors.length) * 10,
        );

  const durationMs = Math.round(performance.now() - start);

  return {
    valid: passed,
    original: raw,
    sanitized,
    report: {
      passed,
      issues,
      score,
      durationMs,
    },
    result: passed
      ? { kind: "pass" }
      : {
          kind: "fail",
          reason: issues
            .filter((i) => i.severity === "error")
            .map((i) => i.message)
            .join("; "),
        },
    wasSanitized,
  };
}

/**
 * Validate a raw text response (for chat-style responses).
 * Runs injection detection and sanitization.
 */
export function validateTextResponse(
  raw: string,
  validatorConfig: ValidatorConfig = DEFAULT_VALIDATOR_CONFIG,
): ValidationOutput {
  const start = performance.now();
  const issues: ValidationReport["issues"] = [];
  let sanitized = raw;
  let wasSanitized = false;

  // Step 1: Injection detection
  if (validatorConfig.enableInjectionDetection) {
    const injectionReport = scanResponse(raw, validatorConfig.detector);
    issues.push(...injectionReport.issues);
  }

  // Determine validity
  const errors = issues.filter((i) => i.severity === "error");
  const passed = errors.length === 0;

  // Step 2: Sanitization
  if (validatorConfig.enableSanitization) {
    const cleaned = validatorConfig.autoFix && passed
      ? sanitize(raw, validatorConfig.sanitizer)
      : sanitize(raw, { ...validatorConfig.sanitizer, stripAlgebraicMoves: false, stripUCI: false, stripFEN: false, stripPGN: false, stripMoveSuggestions: false });
    if (cleaned !== raw) {
      sanitized = cleaned;
      wasSanitized = true;
    }
  }

  const score =
    issues.length === 0
      ? 100
      : Math.max(
          0,
          100 -
            errors.length * 25 -
            (issues.length - errors.length) * 10,
        );

  const durationMs = Math.round(performance.now() - start);

  return {
    valid: passed,
    original: raw,
    sanitized,
    report: {
      passed,
      issues,
      score,
      durationMs,
    },
    result: passed
      ? { kind: "pass" }
      : {
          kind: "fail",
          reason: errors.map((e) => e.message).join("; "),
        },
    wasSanitized,
  };
}
