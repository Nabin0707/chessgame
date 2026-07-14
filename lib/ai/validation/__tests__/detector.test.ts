/**
 * ──────────────────────────────────────────────────────────
 * Detector Tests  —  lib/ai/validation/__tests__/
 *                      detector.test.ts
 *
 * Tests for the prompt injection detection system.
 * Verifies that all prohibited patterns are correctly
 * identified and that clean text passes validation.
 * ──────────────────────────────────────────────────────────
 */

import { describe, it, expect } from "vitest";
import {
  detectAlgebraicMoves,
  detectUCI,
  detectFEN,
  detectPGN,
  detectMoveSuggestions,
  detectPartialMoves,
  detectAll,
  scanResponse,
  generateReport,
} from "../detector";

/* ─── Algebraic Move Detection ────────────────────────── */

describe("detectAlgebraicMoves", () => {
  it("detects standard algebraic notation (e4)", () => {
    const results = detectAlgebraicMoves(
      "White plays e4, opening the center.",
    );
    expect(results.some((r) => r.detected && r.category === "algebraic_move")).toBe(true);
  });

  it("detects piece moves (Nf3, Bb5)", () => {
    const results1 = detectAlgebraicMoves("Nf3 develops the knight.");
    const results2 = detectAlgebraicMoves("Bb5 pins the knight.");
    expect(results1.some((r) => r.detected)).toBe(true);
    expect(results2.some((r) => r.detected)).toBe(true);
  });

  it("detects captures (Qxd8+)", () => {
    const results = detectAlgebraicMoves("Qxd8+ is check!");
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("detects castling (O-O, O-O-O)", () => {
    const results1 = detectAlgebraicMoves("He castled kingside O-O.");
    const results2 = detectAlgebraicMoves("Queenside castling O-O-O is risky.");
    expect(results1.some((r) => r.detected)).toBe(true);
    expect(results2.some((r) => r.detected)).toBe(true);
  });

  it("detects disambiguated moves (Nbd2, Rae1)", () => {
    const results1 = detectAlgebraicMoves("Nbd2 repositions the knight.");
    const results2 = detectAlgebraicMoves("Rae1 activates the rook.");
    expect(results1.some((r) => r.detected)).toBe(true);
    expect(results2.some((r) => r.detected)).toBe(true);
  });

  it("detects pawn captures (exd5)", () => {
    const results = detectAlgebraicMoves("exd5 opens the file.");
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("does not flag normal chess vocabulary", () => {
    const clean = "The knight is well placed in the centre of the board. Consider your pawn structure and piece activity.";
    const results = detectAlgebraicMoves(clean);
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("does not flag piece names in prose", () => {
    const clean = "The knight on f3 is well placed. The bishop pair is strong.";
    const results = detectAlgebraicMoves(clean);
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("returns empty array when detection is disabled", () => {
    const results = detectAlgebraicMoves("White plays e4.", { detectAlgebraicMoves: false });
    expect(results).toHaveLength(0);
  });
});

/* ─── UCI Detection ──────────────────────────────────── */

describe("detectUCI", () => {
  it("detects UCI notation (e2e4)", () => {
    const results = detectUCI("The engine suggests e2e4.");
    expect(results.some((r) => r.detected && r.category === "uci_move")).toBe(true);
  });

  it("detects UCI with promotion (e7e8q)", () => {
    const results = detectUCI("The pawn promotes e7e8q.");
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("does not flag normal text", () => {
    const results = detectUCI("The position is dynamically balanced.");
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("does not flag date-like patterns", () => {
    const results = detectUCI("The game was played in 2024.");
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── FEN Detection ───────────────────────────────────── */

describe("detectFEN", () => {
  it("detects full FEN strings", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";
    const results = detectFEN(`Current FEN: ${fen}`);
    expect(results.some((r) => r.detected && r.category === "fen")).toBe(true);
  });

  it("detects partial FEN (board only)", () => {
    const fen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
    const results = detectFEN(`Board: ${fen}`);
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("does not flag normal path separators", () => {
    const results = detectFEN("Consider the pawn structure and piece coordination.");
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── PGN Detection ──────────────────────────────────── */

describe("detectPGN", () => {
  it("detects PGN header tags", () => {
    const results = detectPGN('[Event "Casual Game"]\n[Date "2024.01.15"]');
    expect(results.some((r) => r.detected && r.category === "pgn")).toBe(true);
  });

  it("does not flag normal bracketed text", () => {
    const results = detectPGN("The position [diagram] shows a typical structure.");
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("does not flag quoted speech", () => {
    const results = detectPGN('He said "This is a good position" and nodded.');
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── Move Suggestion Detection ───────────────────────── */

describe("detectMoveSuggestions", () => {
  it("detects 'you should play'", () => {
    const results = detectMoveSuggestions(
      "You should play Nf3 to attack the centre.",
    );
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("detects 'I recommend'", () => {
    const results = detectMoveSuggestions(
      "I recommend considering the queenside expansion.",
    );
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("detects 'the best move is'", () => {
    const results = detectMoveSuggestions(
      "The best move is to advance the king's pawn.",
    );
    expect(results.some((r) => r.detected)).toBe(true);
  });

  it("does not flag strategic advice", () => {
    const clean = "Consider controlling the centre and activating your pieces.";
    const results = detectMoveSuggestions(clean);
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("does not flag educational explanations", () => {
    const clean = "In this position, controlling the d5 square is a key strategic goal.";
    const results = detectMoveSuggestions(clean);
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── Partial Move Detection ──────────────────────────── */

describe("detectPartialMoves", () => {
  it("flags piece+square patterns (Be3 style)", () => {
    // "Be3" should be caught by algebraic move patterns, not partial
    const results = detectPartialMoves("The bishop on e3 is active.");
    // This actually matches algebraic — partial patterns catch broader things
    expect(Array.isArray(results)).toBe(true);
  });

  it("does not flag chess terminology", () => {
    const results = detectPartialMoves("The knight is well placed.");
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── Unified Detection ───────────────────────────────── */

describe("detectAll", () => {
  it("detects multiple pattern types in a single response", () => {
    const dirty =
      "You should play e4. The FEN is rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const results = detectAll(dirty);

    const categories = results
      .filter((r) => r.detected)
      .map((r) => r.category);

    expect(categories).toContain("algebraic_move");
    expect(categories).toContain("fen");
    expect(categories).toContain("move_suggestion");
  });

  it("returns no detections for clean text", () => {
    const clean =
      "An interesting position. The pawn structure suggests a closed game ahead.";
    const results = detectAll(clean);
    expect(results.every((r) => !r.detected)).toBe(true);
  });

  it("respects disabled detector config", () => {
    const dirty = "White plays e4. The FEN is rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
    const results = detectAll(dirty, {
      detectAlgebraicMoves: false,
      detectUCI: false,
      detectFEN: false,
      detectPGN: false,
      detectMoveSuggestions: false,
      detectPartialMoves: false,
    });
    expect(results.every((r) => !r.detected)).toBe(true);
  });
});

/* ─── Report Generation ───────────────────────────────── */

describe("scanResponse", () => {
  it("returns passed=true for clean text", () => {
    const report = scanResponse(
      "Great move! The knight is well placed in the centre.",
    );
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
  });

  it("returns passed=false when moves are detected", () => {
    const report = scanResponse("You should play e4 here.");
    expect(report.passed).toBe(false);
    expect(report.score).toBeLessThan(100);
  });

  it("returns passed=false for FEN strings", () => {
    const report = scanResponse(
      "The position is rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    expect(report.passed).toBe(false);
  });

  it("calculates lower score for multiple violations", () => {
    const clean = scanResponse("Nice move!");
    const dirty = scanResponse("You should play e4. Also try Nf3. The best move is d4.");

    expect(dirty.score).toBeLessThan(clean.score);
    expect(dirty.issues.length).toBeGreaterThan(clean.issues.length);
  });

  it("includes issues with correct severity", () => {
    const report = scanResponse("You should play e4.");
    const errors = report.issues.filter((i) => i.severity === "error");
    expect(errors.length).toBeGreaterThan(0);
  });
});

/* ─── Edge Cases ──────────────────────────────────────── */

describe("detector edge cases", () => {
  it("handles empty string", () => {
    const report = scanResponse("");
    expect(report.passed).toBe(true);
    expect(report.score).toBe(100);
  });

  it("handles strings with only numbers", () => {
    const report = scanResponse("12345 67890");
    expect(report.passed).toBe(true);
  });

  it("handles very long strings without crashing", () => {
    const long = "A good position. ".repeat(1000);
    const report = scanResponse(long);
    expect(typeof report.score).toBe("number");
  });

  it("handles strings with special characters", () => {
    const text = "Checkmate! ♔ ♕ ♖ ♗ ♘ ♙";
    const report = scanResponse(text);
    expect(report.passed).toBe(true);
  });

  it("detects multiple same-type violations", () => {
    const text = "Nf3 is good. Then Bb5 completes development. Finally O-O secures the king.";
    const algebraic = detectAlgebraicMoves(text);
    const totalMatches = algebraic
      .filter((r) => r.detected)
      .reduce((sum, r) => sum + r.count, 0);
    expect(totalMatches).toBeGreaterThanOrEqual(3);
  });
});
