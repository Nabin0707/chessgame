/**
 * ──────────────────────────────────────────────────────────
 * Schema Tests  —  lib/ai/validation/__tests__/
 *                   schemas.test.ts
 *
 * Tests for Zod response schema validation.
 * Verifies that valid responses pass and invalid ones
 * fail with descriptive errors.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";
import {
  safeParseJSON,
  GradeSchema,
  CommentResponseSchema,
  ChatResponseSchema,
  PostGameSummarySchema,
  RESPONSE_SCHEMAS,
  validateAgainstSchema,
} from "../schemas";

/* ─── Safe Parse JSON ─────────────────────────────────── */

describe("safeParseJSON", () => {
  it("parses valid JSON successfully", () => {
    const result = safeParseJSON<{ key: string }>('{"key":"value"}');
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.key).toBe("value");
    }
  });

  it("parses JSON arrays", () => {
    const result = safeParseJSON<string[]>("[1, 2, 3]");
    expect(result.success).toBe(true);
  });

  it("returns error for malformed JSON", () => {
    const result = safeParseJSON("{invalid}");
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
    }
  });

  it("returns error for empty string", () => {
    const result = safeParseJSON("");
    expect(result.success).toBe(false);
  });

  it("handles numeric values", () => {
    const result = safeParseJSON("42");
    expect(result.success).toBe(true);
  });

  it("handles null JSON", () => {
    const result = safeParseJSON("null");
    expect(result.success).toBe(true);
  });
});

/* ─── Grade Schema ────────────────────────────────────── */

describe("GradeSchema", () => {
  it("validates a correct grade object", () => {
    const result = GradeSchema.safeParse({
      type: "brilliant",
      label: "Brilliant move!",
      emoji: "👑",
    });
    expect(result.success).toBe(true);
  });

  it("rejects grade with invalid type", () => {
    const result = GradeSchema.safeParse({
      type: "superb",
      label: "Superb!",
      emoji: "⭐",
    });
    expect(result.success).toBe(false);
  });

  it("rejects grade with empty label", () => {
    const result = GradeSchema.safeParse({
      type: "good",
      label: "",
      emoji: "👍",
    });
    expect(result.success).toBe(false);
  });

  it("rejects grade with overly long emoji", () => {
    const result = GradeSchema.safeParse({
      type: "good",
      label: "Good",
      emoji: "a".repeat(11),
    });
    expect(result.success).toBe(false);
  });

  it("rejects grade missing required fields", () => {
    const result = GradeSchema.safeParse({
      type: "good",
    });
    expect(result.success).toBe(false);
  });
});

/* ─── Comment Response Schema ─────────────────────────── */

describe("CommentResponseSchema", () => {
  const validCommentary = {
    commentary: "A strong central advance. White now controls key squares.",
    reactions: ["👍", "♟️"],
    grade: { type: "good", label: "Solid", emoji: "👍" },
    tip: "Consider supporting the centre with your pawns.",
    followUpQuestions: ["What are the risks of this advance?"],
  };

  it("validates a complete commentary response", () => {
    const result = CommentResponseSchema.safeParse(validCommentary);
    expect(result.success).toBe(true);
  });

  it("validates commentary with only required field", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "A solid move.",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty commentary", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects commentary exceeding max length", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "x".repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many reactions", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "A move.",
      reactions: ["1", "2", "3", "4", "5", "6"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many follow-up questions", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "A move.",
      followUpQuestions: Array(6).fill("What next?"),
    });
    expect(result.success).toBe(false);
  });

  it("applies default values for optional arrays", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: "A move.",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.reactions).toEqual([]);
      expect(result.data.followUpQuestions).toEqual([]);
    }
  });

  it("rejects non-string commentary", () => {
    const result = CommentResponseSchema.safeParse({
      commentary: 123,
    });
    expect(result.success).toBe(false);
  });
});

/* ─── Chat Response Schema ────────────────────────────── */

describe("ChatResponseSchema", () => {
  it("validates a complete chat response", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "Great question! The centre is key in this position.",
      followUpQuestions: ["Should I develop my bishop first?"],
    });
    expect(result.success).toBe(true);
  });

  it("validates chat with only reply", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "Hello! How can I help with your game?",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty reply", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects reply exceeding max length", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "x".repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects too many follow-up questions", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "Sure!",
      followUpQuestions: Array(4).fill("What else?"),
    });
    expect(result.success).toBe(false);
  });

  it("applies default for follow-up questions", () => {
    const result = ChatResponseSchema.safeParse({
      reply: "Hello!",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.followUpQuestions).toEqual([]);
    }
  });
});

/* ─── Post-Game Summary Schema ────────────────────────── */

describe("PostGameSummarySchema", () => {
  it("validates a complete post-game summary", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "A hard-fought game decided by a pawn break in the endgame.",
      criticalMoment: "When white pushed e5, black failed to respond correctly.",
      strength: "Excellent tactical awareness in the middlegame.",
      improvement: "Endgame technique needs refinement.",
      closingMessage: "Great game! Keep practising those endgames.",
      overallGrade: "B+",
    });
    expect(result.success).toBe(true);
  });

  it("validates summary with only required fields", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "A decisive victory through better piece coordination.",
      closingMessage: "Well played!",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty summary", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "",
      closingMessage: "Good game.",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty closing message", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "A good game.",
      closingMessage: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects summary exceeding max length", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "x".repeat(501),
      closingMessage: "Good game.",
    });
    expect(result.success).toBe(false);
  });

  it("allows summary without optional fields", () => {
    const result = PostGameSummarySchema.safeParse({
      summary: "A good game.",
      closingMessage: "Well played!",
    });
    expect(result.success).toBe(true);
  });
});

/* ─── Schema Registry ─────────────────────────────────── */

describe("RESPONSE_SCHEMAS", () => {
  it("contains all required schema categories", () => {
    expect(RESPONSE_SCHEMAS).toHaveProperty("commentary-after-move");
    expect(RESPONSE_SCHEMAS).toHaveProperty("position-analysis");
    expect(RESPONSE_SCHEMAS).toHaveProperty("chat-message");
    expect(RESPONSE_SCHEMAS).toHaveProperty("post-game-summary");
  });

  it("maps commentary and analysis to the same schema", () => {
    expect(RESPONSE_SCHEMAS["commentary-after-move"]).toBe(
      RESPONSE_SCHEMAS["position-analysis"],
    );
  });
});

/* ─── Validate Against Schema ─────────────────────────── */

describe("validateAgainstSchema", () => {
  it("returns success for valid commentary data", () => {
    const result = validateAgainstSchema(
      { commentary: "A strong move." },
      "commentary-after-move",
    );
    expect(result.success).toBe(true);
  });

  it("returns failure for invalid data", () => {
    const result = validateAgainstSchema(
      { commentary: "" },
      "commentary-after-move",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("commentary");
    }
  });

  it("returns failure for unknown category", () => {
    const result = validateAgainstSchema(
      { commentary: "Test" },
      "unknown" as any,
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("Unknown schema category");
    }
  });

  it("returns success for valid chat data", () => {
    const result = validateAgainstSchema(
      { reply: "Hello!" },
      "chat-message",
    );
    expect(result.success).toBe(true);
  });

  it("returns detailed error messages on failure", () => {
    const result = validateAgainstSchema(
      { reply: 42 },
      "chat-message",
    );
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBeTruthy();
      expect(result.error.length).toBeGreaterThan(0);
    }
  });
});
