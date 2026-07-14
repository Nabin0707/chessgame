/**
 * ──────────────────────────────────────────────────────────
 * Prompt Injection Detector  —  lib/ai/validation/detector.ts
 *
 * Scans Gemini responses for prohibited content patterns:
 *   - Algebraic chess notation (e4, Nf3, O-O, Qxd8+)
 *   - UCI notation (e2e4, g1f3, e7e8q)
 *   - FEN strings (full or partial)
 *   - PGN tags and headers
 *   - Move suggestion language ("you should play", "I recommend")
 *   - Partial/ambiguous matches
 *
 * Each detector returns a DetectionResult that the aggregator
 * combines into a ValidationReport.
 * ──────────────────────────────────────────────────────────
 */

import type {
  DetectionCategory,
  DetectionPattern,
  DetectionResult,
  DetectorConfig,
  ValidationIssue,
  ValidationReport,
  ValidationSeverity,
} from "./types";

/* ─── Default Detector Config ─────────────────────────── */

export const DEFAULT_DETECTOR_CONFIG: DetectorConfig = {
  detectAlgebraicMoves: true,
  detectUCI: true,
  detectFEN: true,
  detectPGN: true,
  detectMoveSuggestions: true,
  detectPartialMoves: true,
};

/* ─── Pattern Definitions ─────────────────────────────── */

/**
 * Collection of detection pattern groups, organised by
 * category for independent enabling/disabling.
 */

/** Algebraic chess notation patterns. */
const ALGEBRAIC_MOVE_PATTERNS: DetectionPattern[] = [
  // Full algebraic: Nf3, Qxd8+, Rae1, O-O, O-O-O
  {
    pattern: /\b([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?(?:[+#])?(?!\w))/g,
    label: "Full algebraic move",
    code: "ALGEBRAIC_MOVE_FULL",
    severity: "error",
    category: "algebraic_move",
    suggestion: "Remove move notation from commentary; describe concepts instead.",
  },
  // Castling notation
  {
    pattern: /\b(O-O(?:-O)?)\b/g,
    label: "Castling notation",
    code: "ALGEBRAIC_MOVE_CASTLE",
    severity: "error",
    category: "algebraic_move",
    suggestion: "Describe castling conceptually rather than with notation.",
  },
  // Disambiguated moves: Nbd2, Qh4e7
  {
    pattern: /\b[KQRBN][a-h]?[1-8]?[a-h][1-8](?:=[QRBN])?(?:[+#])?(?!\w)/g,
    label: "Disambiguated move",
    code: "ALGEBRAIC_MOVE_DISAMBIG",
    severity: "error",
    category: "algebraic_move",
    suggestion: "Describe piece movement without notation.",
  },
  // Pawn moves with capture: exd5, cxb5
  {
    pattern: /\b[a-h]x[a-h][1-8](?:=[QRBN])?(?:[+#])?(?!\w)/g,
    label: "Pawn capture",
    code: "ALGEBRAIC_MOVE_PAWN_CAPTURE",
    severity: "error",
    category: "algebraic_move",
    suggestion: "Describe captures without notation.",
  },
];

/** UCI notation patterns. */
const UCI_MOVE_PATTERNS: DetectionPattern[] = [
  // Full UCI: e2e4, g1f3, e7e8q
  {
    pattern: /\b[a-h][1-8][a-h][1-8](?:[qrbn])?\b/g,
    label: "UCI move notation",
    code: "UCI_MOVE",
    severity: "error",
    category: "uci_move",
    suggestion: "Remove UCI notation from commentary.",
  },
];

/** FEN string patterns. */
const FEN_PATTERNS: DetectionPattern[] = [
  // Full FEN: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1
  {
    pattern:
      /\b([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[wb]\s[-KQkq]+\s[-a-h1-8]+\s\d+\s\d+\b/g,
    label: "Full FEN string",
    code: "FEN_FULL",
    severity: "error",
    category: "fen",
    suggestion: "Remove FEN from commentary; describe positions conceptually.",
  },
  // Partial FEN (position only, no active color/castling/en passant/move counters)
  {
    pattern:
      /\b([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\b/g,
    label: "Partial FEN (board only)",
    code: "FEN_PARTIAL",
    severity: "error",
    category: "fen",
    suggestion: "Remove board representation from commentary.",
  },
];

/** PGN tag patterns. */
const PGN_PATTERNS: DetectionPattern[] = [
  // PGN brackets: [Event "..."], [Date "...."]
  {
    pattern: /\[(?:Event|Site|Date|Round|White|Black|Result)\s+"[^"]*"\]/g,
    label: "PGN header tag",
    code: "PGN_HEADER",
    severity: "error",
    category: "pgn",
    suggestion: "Remove PGN headers from commentary.",
  },
  // PGN move text with move numbers: 1. e4 2. Nf3
  {
    pattern: /\b\d+\s*\.\s*\.\.\.\s|[.\s]\d+\.\s+(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8])/g,
    label: "PGN move sequence",
    code: "PGN_MOVE_SEQUENCE",
    severity: "error",
    category: "pgn",
    suggestion: "Remove PGN sequences from commentary.",
  },
];

/** Move suggestion language patterns. */
const MOVE_SUGGESTION_PATTERNS: DetectionPattern[] = [
  {
    pattern: /\byou should (?:play|move|consider|try)\b/i,
    label: "Direct move suggestion",
    code: "MOVE_SUGGESTION_DIRECT",
    severity: "error",
    category: "move_suggestion",
    suggestion:
      "Rephrase to discuss strategic concepts rather than suggesting specific moves.",
  },
  {
    pattern: /\bI (?:recommend|suggest|would play|would move)\b/i,
    label: "Indirect move suggestion",
    code: "MOVE_SUGGESTION_INDIRECT",
    severity: "error",
    category: "move_suggestion",
    suggestion: "Frame advice as strategic principles, not concrete moves.",
  },
  {
    pattern: /\b(?:try moving|move your|play\s+(?:the\s+)?(?:knight|bishop|rook|queen|pawn))\b/i,
    label: "Imperative move suggestion",
    code: "MOVE_SUGGESTION_IMPERATIVE",
    severity: "error",
    category: "move_suggestion",
    suggestion: "Rephrase as a descriptive analysis of the position.",
  },
  {
    pattern: /\b(?:the best move|the correct move|the right move)\s+is\b/i,
    label: "Authoritative move claim",
    code: "MOVE_SUGGESTION_AUTHORITY",
    severity: "error",
    category: "move_suggestion",
    suggestion: "Discuss candidate moves as options, not definitive choices.",
  },
  {
    pattern: /\b(?:consider\s+(?:playing|moving)\s+(?:the\s+)?(?:knight|bishop|rook|queen|pawn))\b/i,
    label: "Soft move suggestion",
    code: "MOVE_SUGGESTION_SOFT",
    severity: "warning",
    category: "move_suggestion",
    suggestion: "Frame consideration as strategic discussion, not action.",
  },
];

/** Partial or ambiguous notation matches. */
const PARTIAL_MOVE_PATTERNS: DetectionPattern[] = [
  // Single piece letter (K, Q, R, B, N) followed by a file-rank
  {
    pattern: /\b[KQRBN][a-h][1-8]\b(?!x)/g,
    label: "Partial piece+square notation",
    code: "PARTIAL_PIECE_SQUARE",
    severity: "warning",
    category: "partial_match",
    suggestion: "Describe piece positioning without notation.",
  },
  // Standalone file-rank coordinates (e4, d5) — less specific
  {
    pattern: /\b[a-h][1-8]\b/g,
    label: "Standalone square reference",
    code: "PARTIAL_SQUARE",
    severity: "warning",
    category: "partial_match",
    suggestion: "Reference squares descriptively rather than by coordinate.",
  },
];

/* ─── Merged pattern groups ──────────────────────────── */

const PATTERN_GROUPS: Record<string, DetectionPattern[]> = {
  algebraicMoves: ALGEBRAIC_MOVE_PATTERNS,
  uci: UCI_MOVE_PATTERNS,
  fen: FEN_PATTERNS,
  pgn: PGN_PATTERNS,
  moveSuggestions: MOVE_SUGGESTION_PATTERNS,
  partialMoves: PARTIAL_MOVE_PATTERNS,
};

const CONFIG_KEY_MAP: Record<string, keyof DetectorConfig> = {
  algebraicMoves: "detectAlgebraicMoves",
  uci: "detectUCI",
  fen: "detectFEN",
  pgn: "detectPGN",
  moveSuggestions: "detectMoveSuggestions",
  partialMoves: "detectPartialMoves",
};

/* ─── Pattern Compilation ─────────────────────────────── */

/**
 * Compile all enabled detection patterns into a flat array.
 * Patterns are compiled once and cached.
 */
let compiledPatterns: DetectionPattern[] | null = null;
let lastConfig: DetectorConfig | null = null;

function getPatterns(config: DetectorConfig): DetectionPattern[] {
  if (compiledPatterns && lastConfig === config) {
    return compiledPatterns;
  }

  const patterns: DetectionPattern[] = [];
  for (const [groupName, groupPatterns] of Object.entries(PATTERN_GROUPS)) {
    const configKey = CONFIG_KEY_MAP[groupName];
    if (configKey && config[configKey]) {
      patterns.push(...groupPatterns);
    }
  }

  compiledPatterns = patterns;
  lastConfig = config;
  return patterns;
}

/* ─── Individual Detectors ────────────────────────────── */

/**
 * Run a single detection pattern against text.
 */
function runPattern(
  text: string,
  pattern: DetectionPattern,
): DetectionResult {
  const matches: string[] = [];
  let match: RegExpExecArray | null;

  // Reset lastIndex for global regexes
  pattern.pattern.lastIndex = 0;
  const regex = new RegExp(pattern.pattern.source, pattern.pattern.flags);

  while ((match = regex.exec(text)) !== null) {
    matches.push(match[0]);
    // Prevent infinite loops on zero-length matches
    if (match.index === regex.lastIndex) regex.lastIndex++;
  }

  return {
    detected: matches.length > 0,
    category: pattern.category,
    matches,
    count: matches.length,
    severity: matches.length > 0 ? pattern.severity : "info",
  };
}

/**
 * Detect algebraic chess notation in text.
 */
export function detectAlgebraicMoves(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectAlgebraicMoves) return [];

  return ALGEBRAIC_MOVE_PATTERNS.map((p) => runPattern(text, p));
}

/**
 * Detect UCI notation in text.
 */
export function detectUCI(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectUCI) return [];

  return UCI_MOVE_PATTERNS.map((p) => runPattern(text, p));
}

/**
 * Detect FEN strings in text.
 */
export function detectFEN(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectFEN) return [];

  return FEN_PATTERNS.map((p) => runPattern(text, p));
}

/**
 * Detect PGN tags and sequences in text.
 */
export function detectPGN(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectPGN) return [];

  return PGN_PATTERNS.map((p) => runPattern(text, p));
}

/**
 * Detect move suggestion language in text.
 */
export function detectMoveSuggestions(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectMoveSuggestions) return [];

  return MOVE_SUGGESTION_PATTERNS.map((p) => runPattern(text, p));
}

/**
 * Detect partial or ambiguous move patterns.
 */
export function detectPartialMoves(
  text: string,
  config?: Partial<DetectorConfig>,
): DetectionResult[] {
  const cfg = { ...DEFAULT_DETECTOR_CONFIG, ...config };
  if (!cfg.detectPartialMoves) return [];

  return PARTIAL_MOVE_PATTERNS.map((p) => runPattern(text, p));
}

/* ─── Unified Detection ───────────────────────────────── */

/**
 * Run all enabled detectors against the text and return
 * individual results.
 */
export function detectAll(
  text: string,
  config: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
): DetectionResult[] {
  const results: DetectionResult[] = [];

  results.push(...detectAlgebraicMoves(text, config));
  results.push(...detectUCI(text, config));
  results.push(...detectFEN(text, config));
  results.push(...detectPGN(text, config));
  results.push(...detectMoveSuggestions(text, config));
  results.push(...detectPartialMoves(text, config));

  return results;
}

/* ─── Report Generation ───────────────────────────────── */

/**
 * Aggregate detection results into a ValidationReport.
 */
export function generateReport(
  results: DetectionResult[],
  durationMs: number,
): ValidationReport {
  const issues: ValidationIssue[] = [];
  let errorCount = 0;

  for (const result of results) {
    if (!result.detected) continue;

    const issue: ValidationIssue = {
      code: `${result.category.toUpperCase()}_DETECTED`,
      severity: result.severity,
      message: `Detected ${result.count} instance(s) of ${result.category}`,
      location: "response",
    };

    if (result.severity === "error") errorCount++;
    issues.push(issue);
  }

  // Calculate confidence score
  const maxScore = 100;
  const deductions = errorCount * 25 + (issues.length - errorCount) * 10;
  const score = Math.max(0, Math.min(maxScore, maxScore - deductions));

  return {
    passed: errorCount === 0,
    issues,
    score,
    durationMs,
  };
}

/**
 * Convenience function: run all detectors and generate
 * a full validation report.
 */
export function scanResponse(
  text: string,
  config: DetectorConfig = DEFAULT_DETECTOR_CONFIG,
): ValidationReport {
  const start = performance.now();
  const results = detectAll(text, config);
  const durationMs = Math.round(performance.now() - start);
  return generateReport(results, durationMs);
}
