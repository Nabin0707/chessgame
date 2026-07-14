/**
 * ──────────────────────────────────────────────────────────
 * Validator Tests  —  lib/ai/validation/__tests__/
 *                      validator.test.ts
 *
 * Tests for the main validation orchestrator.
 * Verifies JSON/text response validation, fallback
 * generation, and score calculation.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi } from "vitest";
import {
  validateJSONResponse,
  validateTextResponse,
  getFallbackCommentary,
  getFallbackChatResponse,
  getRateLimitMessage,
  getApiErrorMessage,
  DEFAULT_VALIDATOR_CONFIG,
  DEFAULT_FALLBACK_CONFIG,
} from "../validator";
import type { Personality } from "@/lib/ai/personalities/types";

const MOCK_PERSONALITIES: Personality[] = [
  {
    id: "the-coach",
    name: "The Coach",
    emojiStyle: "encouraging",
    humorLevel: "light",
    aggressionLevel: "gentle",
    tone: "encouraging",
    description: "A supportive coach persona.",
    systemPrompt: "You are The Coach.",
    reactionTemplates: {
      brilliant: ["What a brilliant move! You're a natural!"],
      blunder: ["That's a tough break. Let's learn from it."],
      mistake: ["A small misstep. Let's analyse it."],
      good: ["Solid move!"],
      excellent: ["Excellent! Great vision!"],
      victory: ["Congratulations on the win!"],
      defeat: ["Good effort! Every loss is a lesson."],
      draw: ["A fair result. Well played."],
      checkmate: ["Checkmate! Well done!"],
      opening: ["A strong start to the game."],
      midgame: ["The middlegame is where the battle heats up."],
      endgame: ["We're entering the endgame now."],
      time_trouble: ["Keep calm and use your time wisely."],
      comeback: ["What a comeback! Never give up!"],
      trade: ["A balanced trade of pieces."],
      novelty: ["An interesting new idea!"],
      inaccuracy: ["There might have been a stronger option."],
    },
  },
];

/* ─── Validate JSON Response ──────────────────────────── */

describe("validateJSONResponse", () => {
  it("passes valid commentary JSON", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "A strong central advance." }),
      "commentary-after-move",
    );
    expect(result.valid).toBe(true);
    expect(result.result.kind).toBe("pass");
  });

  it("fails on invalid JSON", () => {
    const result = validateJSONResponse(
      "{invalid}",
      "commentary-after-move",
    );
    expect(result.valid).toBe(false);
    expect(result.result.kind).toBe("fail");
    expect(result.report.score).toBe(0);
  });

  it("fails on schema validation error", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "" }),
      "commentary-after-move",
    );
    expect(result.valid).toBe(false);
    expect(result.report.issues.some((i) => i.code === "SCHEMA_VALIDATION_FAILED")).toBe(true);
  });

  it("detects algebraic moves in JSON response", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "You should play e4 to open the centre." }),
      "commentary-after-move",
    );
    expect(result.valid).toBe(false);
    expect(result.report.issues.length).toBeGreaterThan(0);
  });

  it("accepts clean commentary without move suggestions", () => {
    const result = validateJSONResponse(
      JSON.stringify({
        commentary: "An interesting position. Consider piece activity.",
      }),
      "commentary-after-move",
    );
    expect(result.valid).toBe(true);
  });

  it("sanitizes when auto-fix is enabled", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "Play  e4  to open." }),
      "commentary-after-move",
      {
        ...DEFAULT_VALIDATOR_CONFIG,
        autoFix: true,
        sanitizer: {
          stripAlgebraicMoves: true,
          stripUCI: true,
          stripFEN: true,
          stripPGN: true,
          normalizeWhitespace: true,
          maxLength: 2000,
          replacementText: "",
        },
      },
    );
    // Should detect the move
    expect(result.report.issues.length).toBeGreaterThan(0);
  });

  it("respects disabled validation features", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "Play e4." }),
      "commentary-after-move",
      {
        ...DEFAULT_VALIDATOR_CONFIG,
        enableSchemaValidation: false,
        enableInjectionDetection: false,
        enableSanitization: false,
      },
    );
    // With features disabled, it passes — only empty commentary fails schema
    expect(result.valid).toBe(true);
  });

  it("detects FEN strings in JSON responses", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const result = validateJSONResponse(
      JSON.stringify({ commentary: `The position is ${fen}` }),
      "commentary-after-move",
    );
    expect(result.valid).toBe(false);
  });

  it("calculates score correctly for clean responses", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "A solid positional move." }),
      "commentary-after-move",
    );
    expect(result.report.score).toBe(100);
  });

  it("calculates reduced score for responses with issues", () => {
    const result = validateJSONResponse(
      JSON.stringify({ commentary: "Play e4 and Nf3 to control the centre." }),
      "commentary-after-move",
    );
    // Each error drops score by 25
    expect(result.report.score).toBeLessThan(100);
  });
});

/* ─── Validate Text Response ──────────────────────────── */

describe("validateTextResponse", () => {
  it("passes clean text", () => {
    const result = validateTextResponse(
      "An interesting position with dynamic possibilities.",
    );
    expect(result.valid).toBe(true);
    expect(result.report.score).toBe(100);
  });

  it("detects algebraic moves in text", () => {
    const result = validateTextResponse(
      "You should play e4 to open the centre.",
    );
    expect(result.valid).toBe(false);
  });

  it("detects FEN strings in text", () => {
    const result = validateTextResponse(
      "Position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(result.valid).toBe(false);
  });

  it("detects move suggestions in text", () => {
    const result = validateTextResponse(
      "The best move is to advance the king's pawn.",
    );
    expect(result.valid).toBe(false);
  });

  it("sanitizes text responses", () => {
    const result = validateTextResponse(
      "  Play   e4  to   start.  ",
      {
        ...DEFAULT_VALIDATOR_CONFIG,
        sanitizer: {
          stripAlgebraicMoves: false,
          stripUCI: false,
          stripFEN: false,
          stripPGN: false,
          normalizeWhitespace: true,
          maxLength: 2000,
          replacementText: "",
        },
      },
    );
    // Injection detected → not valid, but whitespace is normalised
    expect(result.valid).toBe(false);
  });

  it("handles empty text", () => {
    const result = validateTextResponse("");
    expect(result.valid).toBe(true);
    expect(result.report.score).toBe(100);
  });

  it("preserves safe chess terminology", () => {
    const result = validateTextResponse(
      "The knight is well placed in the centre. Consider your pawn structure.",
    );
    expect(result.valid).toBe(true);
  });

  it("detects PGN content in text", () => {
    const result = validateTextResponse(
      '[Event "Casual Game"]\n1. e4 e5 2. Nf3',
    );
    expect(result.valid).toBe(false);
  });
});

/* ─── Fallback Commentary ─────────────────────────────── */

describe("getFallbackCommentary", () => {
  it("returns personality template when available", () => {
    const result = getFallbackCommentary(
      "the-coach",
      "brilliant",
      MOCK_PERSONALITIES,
    );
    expect(result).toBe("What a brilliant move! You're a natural!");
  });

  it("returns default when personality not found", () => {
    const result = getFallbackCommentary(
      "unknown-personality",
      "brilliant",
      MOCK_PERSONALITIES,
    );
    expect(result).toBe(DEFAULT_FALLBACK_CONFIG.defaultCommentary);
  });

  it("returns default when event type has no templates", () => {
    const result = getFallbackCommentary(
      "the-coach",
      "victory",
      MOCK_PERSONALITIES,
    );
    expect(result).toBe(DEFAULT_FALLBACK_CONFIG.defaultCommentary);
  });

  it("uses custom fallback config when provided", () => {
    const customConfig = {
      ...DEFAULT_FALLBACK_CONFIG,
      usePersonalityFallback: false,
      defaultCommentary: "Custom fallback message.",
    };
    const result = getFallbackCommentary(
      "the-coach",
      "brilliant",
      MOCK_PERSONALITIES,
      customConfig,
    );
    expect(result).toBe("Custom fallback message.");
  });

  it("returns default when usePersonalityFallback is disabled", () => {
    const result = getFallbackCommentary(
      "the-coach",
      "brilliant",
      MOCK_PERSONALITIES,
      { ...DEFAULT_FALLBACK_CONFIG, usePersonalityFallback: false },
    );
    expect(result).toBe(DEFAULT_FALLBACK_CONFIG.defaultCommentary);
  });
});

/* ─── Fallback Messages ───────────────────────────────── */

describe("fallback messages", () => {
  it("getFallbackChatResponse returns default message", () => {
    expect(getFallbackChatResponse()).toBe(
      DEFAULT_FALLBACK_CONFIG.defaultChatResponse,
    );
  });

  it("getRateLimitMessage returns rate-limit message", () => {
    expect(getRateLimitMessage()).toBe(
      DEFAULT_FALLBACK_CONFIG.rateLimitedMessage,
    );
  });

  it("getApiErrorMessage returns API error message", () => {
    expect(getApiErrorMessage()).toBe(
      DEFAULT_FALLBACK_CONFIG.apiErrorMessage,
    );
  });

  it("getFallbackChatResponse uses custom config", () => {
    const custom = { ...DEFAULT_FALLBACK_CONFIG, defaultChatResponse: "Custom chat reply." };
    expect(getFallbackChatResponse(custom)).toBe("Custom chat reply.");
  });

  it("getRateLimitMessage uses custom config", () => {
    const custom = { ...DEFAULT_FALLBACK_CONFIG, rateLimitedMessage: "Please wait." };
    expect(getRateLimitMessage(custom)).toBe("Please wait.");
  });
});
