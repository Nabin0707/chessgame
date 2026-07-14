/**
 * ──────────────────────────────────────────────────────────
 * Formatter Types  —  lib/ai/formatter/types.ts
 *
 * Interfaces for the output formatting system.  The
 * formatter sits between Gemini and the UI — it parses
 * raw text/JSON responses, extracts structured fields,
 * applies personality styling, and passes the result
 * to the output validator.
 *
 * # Pipeline Position
 *
 *   Gemini raw response
 *        ↓
 *   Response Parser (parse raw text → structured data)
 *        ↓
 *   Emoji Applier (inject personality emojis)
 *        ↓
 *   Output Validator (check for prohibited content)  ← ADR-006
 *        ↓
 *   Grade Extractor (parse move quality if present)
 *        ↓
 *   Formatted CommentResponse / ChatResponse
 *        ↓
 *   UI renders
 * ──────────────────────────────────────────────────────────
 */

import type {
  ChatResponse,
  CommentResponse,
  ReactionType,
  ValidationResult,
} from "@/lib/ai/types";
import type { EmojiStyle, Personality } from "@/lib/ai/personalities/types";

/* ─── Formatter ──────────────────────────────────────── */

/** Interface for the commentary response formatter. */
export interface CommentaryFormatter {
  /**
   * Format a raw Gemini response into a structured
   * CommentResponse.
   */
  formatCommentary(params: FormatCommentaryParams): CommentResponse;
}

/** Parameters for CommentaryFormatter.formatCommentary(). */
export interface FormatCommentaryParams {
  /** Raw text/JSON response from Gemini. */
  rawResponse: string;
  /** The personality used for this commentary. */
  personality: Personality;
  /** The event type that triggered commentary. */
  eventType: ReactionType;
  /** Validation result from the output validator. */
  validation: ValidationResult;
}

/* ─── Chat Formatter ─────────────────────────────────── */

/** Interface for the chat response formatter. */
export interface ChatFormatter {
  /**
   * Format a raw Gemini response into a structured
   * ChatResponse.
   */
  formatChat(params: FormatChatParams): ChatResponse;
}

/** Parameters for ChatFormatter.formatChat(). */
export interface FormatChatParams {
  /** Raw text response from Gemini. */
  rawResponse: string;
  /** The personality used for this chat response. */
  personality: Personality;
  /** Validation result from the output validator. */
  validation: ValidationResult;
}

/* ─── Emoji Applier ──────────────────────────────────── */

/** Interface for the emoji application system. */
export interface EmojiApplier {
  /**
   * Select an emoji from the personality's emoji style
   * for the given event type.
   */
  selectEmoji(emojiStyle: EmojiStyle, eventType: ReactionType): string;

  /**
   * Apply emoji decorations to a commentary string.
   * Adds relevant emojis at the beginning and/or end
   * based on the event type.
   */
  applyEmojis(
    text: string,
    emojiStyle: EmojiStyle,
    eventType: ReactionType,
  ): string;
}

/* ─── Response Parser ────────────────────────────────── */

/** Interface for parsing raw Gemini responses. */
export interface ResponseParser {
  /**
   * Parse a raw JSON Gemini response into structured data.
   */
  parseJson<T>(raw: string): T;

  /**
   * Parse a raw text Gemini response, extracting any
   * embedded structured fields.
   */
  parseText(raw: string): ParsedTextResponse;
}

/** Result of parsing a text-format Gemini response. */
export interface ParsedTextResponse {
  /** The main commentary body. */
  commentary: string;
  /** An optional tip or learning takeaway. */
  tip?: string;
  /** Optional follow-up questions extracted from the end. */
  followUpQuestions: string[];
  /** Any raw structured data embedded in the response. */
  rawData?: Record<string, string>;
}

/* ─── Grade Extractor ────────────────────────────────── */

/** Interface for extracting move grades from responses. */
export interface GradeExtractor {
  /**
   * Extract or compute a move grade from the commentary
   * response and engine evaluation data.
   */
  extractGrade(
    response: string,
    evaluation: unknown,
  ): GradeResult | null;
}

/** A move grade extracted from AI commentary. */
export interface GradeResult {
  type: ReactionType;
  label: string;
  emoji: string;
}

/* ─── Formatter Config ───────────────────────────────── */

/** Configuration for the formatter module. */
export interface FormatterConfig {
  /** Whether to apply emojis to formatted output. */
  enableEmojis: boolean;
  /** Whether to extract follow-up questions. */
  extractFollowUpQuestions: boolean;
  /** Maximum length of formatted commentary (characters). */
  maxCommentaryLength: number;
  /** Fallback commentary when the response fails validation. */
  fallbackCommentary: string;
  /** Fallback chat response when the response fails validation. */
  fallbackChatResponse: string;
}
