/**
 * ──────────────────────────────────────────────────────────
 * Sanitizer Tests  —  lib/ai/validation/__tests__/
 *                      sanitizer.test.ts
 *
 * Tests for the response sanitization system.
 * Verifies that prohibited patterns are stripped and text
 * is properly normalised.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";
import {
  stripAlgebraicMoves,
  stripUCI,
  stripFEN,
  stripPGN,
  stripMoveSuggestions,
  normalizeWhitespace,
  truncate,
  sanitize,
  lightSanitize,
} from "../sanitizer";

/* ─── Strip Algebraic Moves ───────────────────────────── */

describe("stripAlgebraicMoves", () => {
  it("removes standard algebraic moves", () => {
    const result = stripAlgebraicMoves("White plays e4 to open.");
    expect(result).toBe("White plays  to open.");
  });

  it("removes piece moves with captures", () => {
    const result = stripAlgebraicMoves("Qxd8+ wins the queen.");
    expect(result).toBe(" wins the queen.");
  });

  it("removes castling notation", () => {
    const result = stripAlgebraicMoves("He castled O-O kingside.");
    expect(result).toBe("He castled  kingside.");
  });

  it("removes disambiguated moves", () => {
    const result = stripAlgebraicMoves("Nbd2 develops the knight.");
    expect(result).toBe(" develops the knight.");
  });

  it("preserves text without moves", () => {
    const text = "The position is dynamically balanced.";
    const result = stripAlgebraicMoves(text);
    expect(result).toBe(text);
  });

  it("uses custom replacement text", () => {
    const result = stripAlgebraicMoves("Play e4!", " [move] ");
    expect(result).toBe("Play [move] !");
  });
});

/* ─── Strip UCI ───────────────────────────────────────── */

describe("stripUCI", () => {
  it("removes UCI notation", () => {
    const result = stripUCI("The engine suggests e2e4.");
    expect(result).toBe("The engine suggests .");
  });

  it("removes UCI with promotion", () => {
    const result = stripUCI("The pawn promotes e7e8q.");
    expect(result).toBe("The pawn promotes .");
  });

  it("preserves normal text", () => {
    const text = "The engine analysis shows an advantage.";
    const result = stripUCI(text);
    expect(result).toBe(text);
  });
});

/* ─── Strip FEN ───────────────────────────────────────── */

describe("stripFEN", () => {
  it("removes full FEN strings", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const result = stripFEN(`fen: ${fen} end`);
    expect(result).toBe("fen:  end");
  });

  it("removes partial FEN (board only)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    const result = stripFEN(`board: ${fen}`);
    expect(result).toBe("board: ");
  });

  it("preserves normal text", () => {
    const text = "The pawn structure is closed.";
    const result = stripFEN(text);
    expect(result).toBe(text);
  });
});

/* ─── Strip PGN ───────────────────────────────────────── */

describe("stripPGN", () => {
  it("removes PGN header tags", () => {
    const result = stripPGN('[Event "Casual Game"]\n[Date "2024.01.15"]');
    expect(result.trim()).toBe("");
  });

  it("removes PGN move sequences", () => {
    const result = stripPGN("1. e4 e5 2. Nf3 Nc6");
    expect(result.trim()).toBe("");
  });

  it("preserves normal bracketed text", () => {
    const text = "The position [diagram] shows a typical structure.";
    const result = stripPGN(text);
    expect(result).toBe(text);
  });
});

/* ─── Strip Move Suggestions ──────────────────────────── */

describe("stripMoveSuggestions", () => {
  it("removes 'you should play'", () => {
    const result = stripMoveSuggestions("You should play Nf3.");
    expect(result).toBe(" Nf3.");
  });

  it("removes 'I recommend'", () => {
    const result = stripMoveSuggestions("I recommend d4.");
    expect(result).toBe(" d4.");
  });

  it("removes 'the best move is'", () => {
    const result = stripMoveSuggestions("The best move is e4.");
    expect(result).toBe(" e4.");
  });

  it("preserves strategic language", () => {
    const text = "Consider controlling the centre with your pawns.";
    const result = stripMoveSuggestions(text);
    expect(result).toBe(text);
  });
});

/* ─── Whitespace Normalisation ────────────────────────── */

describe("normalizeWhitespace", () => {
  it("trims leading and trailing whitespace", () => {
    expect(normalizeWhitespace("  hello world  ")).toBe("hello world");
  });

  it("collapses multiple spaces", () => {
    expect(normalizeWhitespace("hello    world")).toBe("hello world");
  });

  it("removes trailing spaces on lines", () => {
    expect(normalizeWhitespace("hello   \nworld  ")).toBe("hello\nworld");
  });

  it("collapses excessive newlines", () => {
    expect(normalizeWhitespace("hello\n\n\n\nworld")).toBe("hello\n\nworld");
  });

  it("normalises CRLF to LF", () => {
    expect(normalizeWhitespace("hello\r\nworld")).toBe("hello\nworld");
  });
});

/* ─── Truncate ────────────────────────────────────────── */

describe("truncate", () => {
  it("returns text unchanged if under max length", () => {
    const text = "Short text.";
    expect(truncate(text, 100)).toBe(text);
  });

  it("truncates at exact length if no sentence boundary", () => {
    const text = "a".repeat(100);
    const result = truncate(text, 50);
    expect(result.length).toBe(51); // 50 chars + ellipsis
    expect(result.endsWith("…")).toBe(true);
  });

  it("breaks at sentence boundary when possible", () => {
    const text = "This is a long sentence. And another one. And a third.";
    const result = truncate(text, 35);
    expect(result).toBe("This is a long sentence.");
  });

  it("breaks at word boundary when possible", () => {
    const text = "This is a very long text that needs truncation at a good spot.";
    const result = truncate(text, 40);
    expect(result.endsWith("…")).toBe(true);
    expect(result.length).toBeLessThanOrEqual(42);
  });
});

/* ─── Unified Sanitize ────────────────────────────────── */

describe("sanitize", () => {
  it("strips moves and normalises text", () => {
    const result = sanitize("  White plays e4.   Then Nf3.  ");
    expect(result).not.toContain("e4");
    expect(result).not.toContain("Nf3");
    expect(result).not.toMatch(/\s{2,}/);
  });

  it("strips FEN", () => {
    const result = sanitize(
      "Position: rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(result).not.toContain("rnbqkbnr");
  });

  it("strips move suggestions", () => {
    const result = sanitize("You should play e4.");
    expect(result).not.toContain("You should play");
  });

  it("truncates long text", () => {
    const long = "A good move. ".repeat(200);
    const result = sanitize(long, {
      stripAlgebraicMoves: false,
      stripUCI: false,
      stripFEN: false,
      stripPGN: false,
      normalizeWhitespace: true,
      maxLength: 100,
      replacementText: "",
    });
    expect(result.length).toBeLessThanOrEqual(102);
  });

  it("applies custom replacement text", () => {
    const result = sanitize("Play e4!", {
      stripAlgebraicMoves: true,
      stripUCI: false,
      stripFEN: false,
      stripPGN: false,
      normalizeWhitespace: true,
      maxLength: 2000,
      replacementText: " [notation] ",
    });
    expect(result).toContain("[notation]");
  });
});

/* ─── Light Sanitize ──────────────────────────────────── */

describe("lightSanitize", () => {
  it("normalises and truncates without stripping content", () => {
    const text = "  e4 is   a good   move.  ";
    const result = lightSanitize(text);
    expect(result).toBe("e4 is a good move.");
  });

  it("truncates at custom max length", () => {
    const text = "A good move. ".repeat(50);
    const result = lightSanitize(text, 50);
    expect(result.length).toBeLessThanOrEqual(52);
  });
});

/* ─── Edge Cases ──────────────────────────────────────── */

describe("sanitizer edge cases", () => {
  it("handles empty string", () => {
    expect(sanitize("")).toBe("");
  });

  it("handles only whitespace", () => {
    expect(sanitize("   \n  \t  ")).toBe("");
  });

  it("handles strings with chess symbols", () => {
    const text = "Checkmate! ♔ ♕ ♖ ♗ ♘ ♙";
    const result = sanitize(text, {
      stripAlgebraicMoves: false,
      stripUCI: false,
      stripFEN: false,
      stripPGN: false,
      normalizeWhitespace: true,
      maxLength: 2000,
      replacementText: "",
    });
    expect(result).toContain("♔");
    expect(result).toContain("♕");
  });

  it("handles repeated stripping gracefully", () => {
    const text = "e4 e5 Nf3 Nc6 Bb5 a6";
    const once = stripAlgebraicMoves(text);
    const twice = stripAlgebraicMoves(once);
    expect(twice).toBe(once); // Already stripped, should be stable
  });
});
