/**
 * ──────────────────────────────────────────────────────────
 * Pipeline Error Tests  —  lib/ai/pipeline/__tests__/
 *                           error.test.ts
 *
 * Tests for pipeline error classification and fallback
 * generation.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";
import {
  classifyError,
  formatErrorLog,
  generateChatFallback,
  generateFallbackMessage,
  isFatal,
  isRecoverable,
  isWarning,
} from "../error";
import type { ProcessContext } from "../types";

/* ─── Mock Context ────────────────────────────────────── */

const MOCK_CONTEXT: ProcessContext = {
  rawResponse: "test response",
  personalityId: "the-coach",
  eventType: "good",
  responseFormat: "text",
  schemaCategory: "chat-message",
};

/* ─── Classify Error ──────────────────────────────────── */

describe("classifyError", () => {
  it("classifies ZodError as fatal validation error", () => {
    const error = classifyError(new Error("ZodError: validation failed"));
    expect(error.category).toBe("validation");
    expect(error.severity).toBe("fatal");
  });

  it("classifies schema validation errors as fatal", () => {
    const error = classifyError("schema validation failed");
    expect(error.severity).toBe("fatal");
  });

  it("classifies JSON parse errors as fatal formatting errors", () => {
    const error = classifyError("Unexpected token in JSON");
    expect(error.category).toBe("formatting");
    expect(error.severity).toBe("fatal");
  });

  it("classifies parse errors as fatal", () => {
    const error = classifyError(new Error("Failed to parse response"));
    expect(error.severity).toBe("fatal");
  });

  it("classifies injection detection as fatal validation", () => {
    const error = classifyError("ALGEBRAIC_MOVE detected");
    expect(error.category).toBe("validation");
    expect(error.severity).toBe("fatal");
  });

  it("classifies prohibited content as fatal", () => {
    const error = classifyError("prohibited content found");
    expect(error.severity).toBe("fatal");
  });

  it("classifies sanitization errors as recoverable", () => {
    const error = classifyError("sanitize failed");
    expect(error.category).toBe("sanitization");
    expect(error.severity).toBe("recoverable");
  });

  it("classifies strip errors as recoverable", () => {
    const error = classifyError("strip failed");
    expect(error.severity).toBe("recoverable");
  });

  it("classifies timeout as fatal", () => {
    const error = classifyError("pipeline timed out");
    expect(error.category).toBe("timeout");
    expect(error.severity).toBe("fatal");
  });

  it("classifies unknown errors as recoverable internal", () => {
    const error = classifyError(new Error("Something weird happened"));
    expect(error.category).toBe("internal");
    expect(error.severity).toBe("recoverable");
  });

  it("includes the stage in the error", () => {
    const error = classifyError("JSON parse error", "formatting");
    expect(error.stage).toBe("formatting");
  });

  it("handles non-Error, non-string errors", () => {
    const error = classifyError({ code: 500 });
    expect(error.message).toContain("Unknown error");
  });

  it("handles object errors with message property", () => {
    const error = classifyError({ message: "timeout occurred" });
    expect(error.category).toBe("timeout");
  });

  it("handles null errors gracefully", () => {
    const error = classifyError(null);
    expect(error.category).toBe("internal");
  });
});

/* ─── Severity Checks ─────────────────────────────────── */

describe("isFatal", () => {
  it("returns true for fatal errors", () => {
    expect(isFatal({ category: "validation", severity: "fatal", message: "err" })).toBe(true);
  });

  it("returns false for recoverable errors", () => {
    expect(isFatal({ category: "internal", severity: "recoverable", message: "err" })).toBe(false);
  });
});

describe("isRecoverable", () => {
  it("returns true for recoverable errors", () => {
    expect(isRecoverable({ category: "sanitization", severity: "recoverable", message: "err" })).toBe(true);
  });

  it("returns false for fatal errors", () => {
    expect(isRecoverable({ category: "validation", severity: "fatal", message: "err" })).toBe(false);
  });
});

describe("isWarning", () => {
  it("returns true for warning errors", () => {
    expect(isWarning({ category: "internal", severity: "warning", message: "err" })).toBe(true);
  });

  it("returns false for fatal errors", () => {
    expect(isWarning({ category: "validation", severity: "fatal", message: "err" })).toBe(false);
  });
});

/* ─── Generate Fallback Message ───────────────────────── */

describe("generateFallbackMessage", () => {
  it("returns validation fallback for validation errors", () => {
    const result = generateFallbackMessage(MOCK_CONTEXT, {
      category: "validation",
      severity: "fatal",
      message: "Validation failed",
    });
    expect(result).toContain("Let's focus on the board");
  });

  it("returns formatting fallback for formatting errors", () => {
    const result = generateFallbackMessage(MOCK_CONTEXT, {
      category: "formatting",
      severity: "fatal",
      message: "Formatting failed",
    });
    expect(result).toContain("An interesting moment");
  });

  it("returns timeout fallback for timeout errors", () => {
    const result = generateFallbackMessage(MOCK_CONTEXT, {
      category: "timeout",
      severity: "fatal",
      message: "Timeout",
    });
    expect(result).toContain("analysis took too long");
  });

  it("returns event-type fallback for blunder events", () => {
    const result = generateFallbackMessage({
      ...MOCK_CONTEXT,
      eventType: "blunder",
    });
    expect(result).toContain("learning opportunity");
  });

  it("returns event-type fallback for brilliant events", () => {
    const result = generateFallbackMessage({
      ...MOCK_CONTEXT,
      eventType: "brilliant",
    });
    expect(result).toContain("A strong move!");
  });

  it("returns event-type fallback for checkmate", () => {
    const result = generateFallbackMessage({
      ...MOCK_CONTEXT,
      eventType: "checkmate",
    });
    expect(result).toContain("Game over");
  });

  it("returns event-type fallback for defeat", () => {
    const result = generateFallbackMessage({
      ...MOCK_CONTEXT,
      eventType: "defeat",
    });
    expect(result).toContain("Good effort");
  });

  it("returns event-type fallback for draw", () => {
    const result = generateFallbackMessage({
      ...MOCK_CONTEXT,
      eventType: "draw",
    });
    expect(result).toContain("ended in a draw");
  });

  it("returns default for unknown event types", () => {
    const result = generateFallbackMessage(MOCK_CONTEXT);
    expect(result).toContain("An interesting position");
  });
});

/* ─── Generate Chat Fallback ──────────────────────────── */

describe("generateChatFallback", () => {
  it("returns validation-specific chat fallback", () => {
    const result = generateChatFallback(MOCK_CONTEXT, {
      category: "validation",
      severity: "fatal",
      message: "Prohibited content",
    });
    expect(result).toContain("focus on the position");
  });

  it("returns default chat fallback for other errors", () => {
    const result = generateChatFallback(MOCK_CONTEXT, {
      category: "timeout",
      severity: "fatal",
      message: "Timeout",
    });
    expect(result).toContain("broader position");
  });

  it("returns default chat fallback when no error", () => {
    const result = generateChatFallback(MOCK_CONTEXT);
    expect(result).toContain("broader position");
  });
});

/* ─── Format Error Log ────────────────────────────────── */

describe("formatErrorLog", () => {
  it("formats a basic error log", () => {
    const log = formatErrorLog({
      category: "validation",
      severity: "fatal",
      message: "Schema validation failed",
    });
    expect(log).toContain("FATAL");
    expect(log).toContain("validation");
    expect(log).toContain("Schema validation failed");
  });

  it("includes stage when provided", () => {
    const log = formatErrorLog({
      category: "validation",
      severity: "fatal",
      message: "Failed",
      stage: "validation",
    });
    expect(log).toContain("@validation");
  });

  it("includes cause when provided", () => {
    const log = formatErrorLog({
      category: "internal",
      severity: "recoverable",
      message: "Error",
      cause: new Error("Root cause"),
    });
    expect(log).toContain("Root cause");
  });

  it("handles string causes", () => {
    const log = formatErrorLog({
      category: "internal",
      severity: "warning",
      message: "Warning",
      cause: "string cause",
    });
    expect(log).toContain("string cause");
  });
});
