/**
 * ──────────────────────────────────────────────────────────
 * Pipeline Tests  —  lib/ai/pipeline/__tests__/
 *                     pipeline.test.ts
 *
 * Tests for the response pipeline orchestrator.
 * Verifies stage sequencing, error handling, and
 * convenience wrappers.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect, vi } from "vitest";
import {
  runPipeline,
  processCommentary,
  processChat,
  processPostGameSummary,
} from "../pipeline";
import { DEFAULT_PIPELINE_CONFIG } from "../types";

/* ─── Run Pipeline ────────────────────────────────────── */

describe("runPipeline", () => {
  it("processes a valid text response successfully", async () => {
    const result = await runPipeline({
      rawResponse: "An interesting position with dynamic possibilities.",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.success).toBe(true);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
    expect(result.stages.length).toBe(3);
    expect(result.stages[0].stage).toBe("validation");
    expect(result.stages[1].stage).toBe("sanitization");
    expect(result.stages[2].stage).toBe("formatting");
  });

  it("processes a valid JSON response successfully", async () => {
    const result = await runPipeline({
      rawResponse: JSON.stringify({ commentary: "A strong central advance." }),
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "json",
      schemaCategory: "commentary-after-move",
    });

    expect(result.success).toBe(true);
  });

  it("uses fallback for response with algebraic moves", async () => {
    const result = await runPipeline({
      rawResponse: "You should play e4 to open the centre.",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    // Validation fails → fallback
    expect(result.usedFallback).toBe(true);
    expect(result.fallbackText).toBeTruthy();
  });

  it("uses fallback for invalid JSON", async () => {
    const result = await runPipeline({
      rawResponse: "{invalid json}",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "json",
      schemaCategory: "commentary-after-move",
    });

    expect(result.usedFallback).toBe(true);
    expect(result.fallbackText).toBeTruthy();
  });

  it("skips disabled stages", async () => {
    const result = await runPipeline(
      {
        rawResponse: "A solid move.",
        personalityId: "the-coach",
        eventType: "good",
        responseFormat: "text",
        schemaCategory: "chat-message",
      },
      {
        ...DEFAULT_PIPELINE_CONFIG,
        enableValidation: false,
        enableSanitization: false,
        enableFormatting: false,
      },
    );

    expect(result.success).toBe(true);
    expect(result.stages.length).toBe(3);
    // All should report success with 0 duration (skipped)
    expect(result.stages.every((s) => s.success && s.durationMs === 0)).toBe(true);
  });

  it("reports stage results for each stage", async () => {
    const result = await runPipeline({
      rawResponse: "Good position. Consider your options.",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.stages).toHaveLength(3);
    result.stages.forEach((stage) => {
      expect(stage.stage).toBeDefined();
      expect(typeof stage.success).toBe("boolean");
      expect(typeof stage.durationMs).toBe("number");
    });
  });

  it("handles empty response gracefully", async () => {
    const result = await runPipeline({
      rawResponse: "",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.success).toBe(true);
  });
});

/* ─── Process Commentary ──────────────────────────────── */

describe("processCommentary", () => {
  it("processes clean commentary text", async () => {
    const result = await processCommentary(
      "An interesting position with good piece activity.",
      "the-coach",
      "good",
    );

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("handles commentary with moves", async () => {
    const result = await processCommentary(
      "You should play e4 to open the centre.",
      "the-coach",
      "good",
    );

    expect(result.usedFallback).toBe(true);
  });

  it("accepts custom config", async () => {
    const result = await processCommentary(
      "A solid position.",
      "the-coach",
      "good",
      { enableValidation: false, enableSanitization: false },
    );

    expect(result.success).toBe(true);
  });
});

/* ─── Process Chat ────────────────────────────────────── */

describe("processChat", () => {
  it("processes clean chat text", async () => {
    const result = await processChat(
      "Great question! The centre is key in this position.",
      "the-coach",
    );

    expect(result).toBeDefined();
    expect(typeof result.success).toBe("boolean");
  });

  it("handles chat with prohibited content", async () => {
    const result = await processChat(
      "The best move is to advance the king's pawn.",
      "the-coach",
    );

    expect(result.usedFallback).toBe(true);
  });

  it("accepts custom config", async () => {
    const result = await processChat(
      "Hello!",
      "the-coach",
      { enableValidation: false },
    );

    expect(result.success).toBe(true);
  });
});

/* ─── Process Post-Game Summary ───────────────────────── */

describe("processPostGameSummary", () => {
  it("processes valid post-game summary", async () => {
    const result = await processPostGameSummary(
      JSON.stringify({
        summary: "A decisive victory through better piece coordination.",
        closingMessage: "Well played!",
      }),
      "the-coach",
    );

    expect(result).toBeDefined();
  });

  it("handles invalid summary JSON", async () => {
    const result = await processPostGameSummary(
      "{invalid}",
      "the-coach",
    );

    expect(result.usedFallback).toBe(true);
  });
});

/* ─── Edge Cases ──────────────────────────────────────── */

describe("pipeline edge cases", () => {
  it("handles whitespace-only input", async () => {
    const result = await runPipeline({
      rawResponse: "   \n  \t  ",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.success).toBe(true);
  });

  it("handles very long input without crashing", async () => {
    const longResponse = "A good position. ".repeat(500);
    const result = await runPipeline({
      rawResponse: longResponse,
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.success).toBe(true);
    expect(result.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("handles special characters", async () => {
    const result = await runPipeline({
      rawResponse: "Checkmate! ♔ ♕ ♖ ♗ ♘ ♙",
      personalityId: "the-coach",
      eventType: "good",
      responseFormat: "text",
      schemaCategory: "chat-message",
    });

    expect(result.success).toBe(true);
  });
});
