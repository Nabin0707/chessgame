/**
 * ──────────────────────────────────────────────────────────
 * Validation Types  —  lib/ai/validation/types.ts
 *
 * Types for the response validation system (ADR-006 Layer 2).
 * Defines the shape of validation reports, detection results,
 * sanitization configs, and the main validator configuration.
 * ──────────────────────────────────────────────────────────
 */

import type { ReactionType, ValidationResult } from "@/lib/ai/types";

/* ─── Validation Issues ───────────────────────────────── */

/** Severity level of a single validation finding. */
export type ValidationSeverity = "error" | "warning" | "info";

/** A single issue discovered during validation. */
export interface ValidationIssue {
  /** Unique error code for this issue type (e.g. "ALGEBRAIC_MOVE"). */
  code: string;
  /** How severe this issue is. */
  severity: ValidationSeverity;
  /** Human-readable description of the issue. */
  message: string;
  /** Path within the response where the issue was found (e.g. "commentary", "tip"). */
  location?: string;
  /** Optional suggestion for how to fix or handle this issue. */
  suggestion?: string;
}

/** Aggregate report from a full validation pass. */
export interface ValidationReport {
  /** Whether the response passed all error-severity checks. */
  passed: boolean;
  /** All issues found, ordered by severity (errors first). */
  issues: ValidationIssue[];
  /**
   * Confidence score 0–100.
   * 100 = perfectly clean, 0 = completely prohibited.
   * Scores < 70 with no errors suggest suspicious content.
   */
  score: number;
  /** Time taken for validation in milliseconds. */
  durationMs: number;
}

/* ─── Detection ───────────────────────────────────────── */

/** Configuration for a single detection pattern. */
export interface DetectionPattern {
  /** Regex to match against response text. */
  pattern: RegExp;
  /** Human-readable label for this pattern. */
  label: string;
  /** Unique error code for this pattern. */
  code: string;
  /** Severity if detected. */
  severity: ValidationSeverity;
  /** Optional suggestion for remediation. */
  suggestion?: string;
  /** Category of detection (e.g. "move", "fen", "pgn", "suggestion"). */
  category: DetectionCategory;
}

/** Category of prohibited content. */
export type DetectionCategory =
  | "algebraic_move"
  | "uci_move"
  | "fen"
  | "pgn"
  | "move_suggestion"
  | "partial_match"
  | "prohibited_term";

/** Result from running a single detector. */
export interface DetectionResult {
  /** Whether any matches were found. */
  detected: boolean;
  /** Category of detection. */
  category: DetectionCategory;
  /** The actual matched strings. */
  matches: string[];
  /** Number of matches found. */
  count: number;
  /** Highest severity among matches. */
  severity: ValidationSeverity;
}

/** Configuration for which detectors are enabled. */
export interface DetectorConfig {
  /** Detect algebraic chess notation (e4, Nf3, O-O). */
  detectAlgebraicMoves: boolean;
  /** Detect UCI notation (e2e4, g1f3). */
  detectUCI: boolean;
  /** Detect FEN strings. */
  detectFEN: boolean;
  /** Detect PGN tags and headers. */
  detectPGN: boolean;
  /** Detect move suggestion language ("you should play"). */
  detectMoveSuggestions: boolean;
  /** Detect partial or ambiguous move patterns. */
  detectPartialMoves: boolean;
}

/* ─── Sanitizer ───────────────────────────────────────── */

/** Configuration for response sanitization. */
export interface SanitizerConfig {
  /** Whether to strip algebraic move notation from text. */
  stripAlgebraicMoves: boolean;
  /** Whether to strip UCI notation. */
  stripUCI: boolean;
  /** Whether to strip FEN strings. */
  stripFEN: boolean;
  /** Whether to strip PGN. */
  stripPGN: boolean;
  /** Whether to strip move suggestion language (e.g. "you should play"). */
  stripMoveSuggestions: boolean;
  /** Whether to normalise whitespace (trim, collapse). */
  normalizeWhitespace: boolean;
  /** Maximum length of the response in characters. */
  maxLength: number;
  /** Replacement text for removed patterns (default: ""). */
  replacementText: string;
}

/* ─── Validator ───────────────────────────────────────── */

/** Configuration for the main validator. */
export interface ValidatorConfig {
  /** Whether schema validation is enabled. */
  enableSchemaValidation: boolean;
  /** Whether injection detection is enabled. */
  enableInjectionDetection: boolean;
  /** Whether sanitization is enabled. */
  enableSanitization: boolean;
  /** Whether to auto-fix minor issues when possible. */
  autoFix: boolean;
  /** Threshold score below which a response is flagged (0–100). */
  scoreThreshold: number;
  /** Detector sub-config. */
  detector: DetectorConfig;
  /** Sanitizer sub-config. */
  sanitizer: SanitizerConfig;
}

/** Result of the full validation + sanitization pipeline. */
export interface ValidationOutput {
  /** Whether the response passed all checks. */
  valid: boolean;
  /** The original raw response text. */
  original: string;
  /** The sanitized response text (if sanitization was applied). */
  sanitized: string;
  /** Validation report with all issues. */
  report: ValidationReport;
  /** Final validation result for the pipeline. */
  result: ValidationResult;
  /** Whether sanitization was applied. */
  wasSanitized: boolean;
}

/* ─── Fallback ────────────────────────────────────────── */

/** Configuration for fallback response generation. */
export interface FallbackConfig {
  /** Whether to use personality-based fallback templates. */
  usePersonalityFallback: boolean;
  /** Fallback text when no personality is available. */
  defaultCommentary: string;
  /** Fallback chat response. */
  defaultChatResponse: string;
  /** Rate-limit fallback message. */
  rateLimitedMessage: string;
  /** API error fallback message. */
  apiErrorMessage: string;
}
