/**
 * ──────────────────────────────────────────────────────────
 * Response Sanitizer  —  lib/ai/validation/sanitizer.ts
 *
 * Cleans Gemini responses by stripping or replacing
 * prohibited patterns before they reach the UI.
 *
 * Sanitization is applied AFTER validation — if validation
 * fails, the response should use a fallback instead of
 * attempting sanitization. Sanitization is the last-resort
 * safety net for responses that pass validation but may
 * still contain minor issues.
 *
 * # Pipeline
 *
 *   Raw text
 *        ↓
 *   stripAlgebraicMoves()  — removes e4, Nf3, O-O, etc.
 *   stripUCI()             — removes e2e4, g1f3, etc.
 *   stripFEN()             — removes FEN strings
 *   stripPGN()             — removes PGN tags/sequences
 *   stripMoveSuggestions() — rewrites suggestion language
 *   normalizeWhitespace()  — trims + collapses whitespace
 *   truncate()             — enforces max length
 *        ↓
 *   Clean text
 * ──────────────────────────────────────────────────────────
 */

import type { SanitizerConfig } from "./types";

/* ─── Default Config ──────────────────────────────────── */

export const DEFAULT_SANITIZER_CONFIG: SanitizerConfig = {
  stripAlgebraicMoves: true,
  stripUCI: true,
  stripFEN: true,
  stripPGN: true,
  normalizeWhitespace: true,
  maxLength: 2000,
  replacementText: "",
};

/* ─── Individual Sanitizers ───────────────────────────── */

/**
 * Strip algebraic chess notation from text.
 * Removes patterns like e4, Nf3, Qxd8+, O-O, etc.
 */
export function stripAlgebraicMoves(
  text: string,
  replacement = "",
): string {
  // Castling
  let result = text.replace(/\bO-O(?:-O)?\b/g, replacement);
  // Disambiguated + standard moves
  result = result.replace(
    /\b[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?\b/g,
    replacement,
  );
  // Pawn captures
  result = result.replace(
    /\b[a-h]x[a-h][1-8](?:=[QRBN])?[+#]?\b/g,
    replacement,
  );
  return result;
}

/**
 * Strip UCI notation from text.
 * Removes patterns like e2e4, g1f3, e7e8q.
 */
export function stripUCI(text: string, replacement = ""): string {
  return text.replace(/\b[a-h][1-8][a-h][1-8](?:[qrbn])?\b/g, replacement);
}

/**
 * Strip FEN strings from text.
 * Removes full and partial FEN patterns.
 */
export function stripFEN(text: string, replacement = ""): string {
  // Full FEN with all fields
  let result = text.replace(
    /\b([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\s[wb]\s[-KQkq]+\s[-a-h1-8]+\s\d+\s\d+\b/g,
    replacement,
  );
  // Partial FEN (board only)
  result = result.replace(
    /\b([rnbqkpRNBQKP1-8]+\/){7}[rnbqkpRNBQKP1-8]+\b/g,
    replacement,
  );
  return result;
}

/**
 * Strip PGN tags and sequences from text.
 */
export function stripPGN(text: string, replacement = ""): string {
  // PGN header tags
  let result = text.replace(
    /\[(?:Event|Site|Date|Round|White|Black|Result)\s+"[^"]*"\]/g,
    replacement,
  );
  // PGN move sequences (numbered: 1. e4 2. Nf3)
  result = result.replace(
    /\b\d+\s*\.\s*(?:\.\.\.\s+)?(?:[KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?\s*)+/g,
    replacement,
  );
  return result;
}

/**
 * Strip or rewrite move suggestion language.
 * Removes phrases like "you should play", "I recommend", etc.
 */
export function stripMoveSuggestions(
  text: string,
  replacement = "",
): string {
  // Direct suggestions
  let result = text.replace(
    /\byou should (?:play|move|consider|try)\b/gi,
    replacement,
  );
  // Indirect suggestions
  result = result.replace(
    /\bI (?:recommend|suggest|would play|would move)\b/gi,
    replacement,
  );
  // Imperative suggestions
  result = result.replace(
    /\b(?:try moving|move your|play\s+(?:the\s+)?(?:knight|bishop|rook|queen|pawn))\b/gi,
    replacement,
  );
  // Authoritative claims
  result = result.replace(
    /\b(?:the best move|the correct move|the right move)\s+is\b/gi,
    replacement,
  );
  return result;
}

/**
 * Normalise whitespace: trim, collapse multiple spaces,
 * remove trailing spaces on lines.
 */
export function normalizeWhitespace(text: string): string {
  return text
    .trim()
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^\s+|\s+$/gm, "")
    .trim();
}

/**
 * Truncate text to maxLength, preferring to break at a
 * sentence boundary if possible.
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to break at a sentence boundary
  const truncated = text.slice(0, maxLength);
  const sentenceEnd = truncated.lastIndexOf(".");
  const spaceEnd = truncated.lastIndexOf(" ");

  if (sentenceEnd > maxLength * 0.8) {
    return text.slice(0, sentenceEnd + 1);
  }
  if (spaceEnd > maxLength * 0.8) {
    return text.slice(0, spaceEnd) + "…";
  }
  return truncated + "…";
}

/* ─── Unified Sanitizer ───────────────────────────────── */

/**
 * Run all enabled sanitization steps against text.
 */
export function sanitize(
  text: string,
  config: SanitizerConfig = DEFAULT_SANITIZER_CONFIG,
): string {
  let result = text;

  if (config.stripAlgebraicMoves) {
    result = stripAlgebraicMoves(result, config.replacementText);
  }
  if (config.stripUCI) {
    result = stripUCI(result, config.replacementText);
  }
  if (config.stripFEN) {
    result = stripFEN(result, config.replacementText);
  }
  if (config.stripPGN) {
    result = stripPGN(result, config.replacementText);
  }
  if (config.normalizeWhitespace) {
    result = normalizeWhitespace(result);
  }

  result = truncate(result, config.maxLength);

  return result;
}

/**
 * Lightweight sanitize that only normalises whitespace and
 * truncates — no content stripping. Used for responses that
 * passed validation but need formatting.
 */
export function lightSanitize(
  text: string,
  maxLength = 2000,
): string {
  return truncate(normalizeWhitespace(text), maxLength);
}
