/**
 * ──────────────────────────────────────────────────
 * Chess Intelligence Engine — Constants & Thresholds
 * lib/chess/analysis/constants.ts
 * ──────────────────────────────────────────────────
 */

import type { MoveQualityCategory, OpeningEntry, ImportanceWeights } from "./types";

/* ─── Move Quality Thresholds (centipawn loss) ─── */

/**
 * Thresholds define the *loss* from the best move that categorises a move's
 * quality. Positive values mean "how much worse than the engine best".
 */
export const QUALITY_THRESHOLDS: Record<MoveQualityCategory, number> = {
  brilliant: -Infinity, // special-case: sacrifice with huge eval gain
  great: 50,
  best: 100,
  good: 200,
  book: 0, // not used for centipawn comparison
  inaccuracy: 500,
  mistake: 1000,
  blunder: Infinity, // anything >= mistake thresholds
};

/**
 * Minimum eval *gain* from the mover's perspective for a move to qualify as
 * brilliant (must also be a capture or sacrifice).
 */
export const BRILLIANT_EVAL_GAIN = 200; // +2.00 pawns

/**
 * Minimum eval *gain* for a move to be "great" even if centipawn loss is low.
 */
export const GREAT_EVAL_GAIN = 100; // +1.00 pawns

/* ─── Material Values (centipawns) ──────────────── */

export const PIECE_VALUE_MAP: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 0,
};

/* ─── Piece Name Map ─────────────────────────────── */

export const PIECE_NAME_MAP: Record<string, string> = {
  p: "Pawn",
  n: "Knight",
  b: "Bishop",
  r: "Rook",
  q: "Queen",
  k: "King",
};

export const PIECE_NAME_MAP_ARTICLED: Record<string, string> = {
  p: "Pawn",
  n: "a Knight",
  b: "a Bishop",
  r: "a Rook",
  q: "a Queen",
  k: "the King",
};

/* ─── Phase Detection ────────────────────────────── */

/** Moves (half-moves) below this are considered opening. */
export const OPENING_MAX_MOVES = 20;

/** Moves (half-moves) below this after opening are midgame. */
export const MIDGAME_MAX_MOVES = 50;

/**
 * Total piece material on the board below which endgame is assumed.
 * Starting material = 2*(3*320 + 2*330 + 500 + 900) = 8060 centipawns.
 */
export const ENDGAME_MATERIAL_THRESHOLD = 4000; // 40 pawns equivalent

/* ─── Center Control Thresholds ──────────────────── */

export const CENTER_SQUARES = ["d4", "d5", "e4", "e5"] as const;
export const EXTENDED_CENTER = ["c3", "c4", "c5", "c6", "d3", "d6", "e3", "e6", "f3", "f4", "f5", "f6"] as const;

export const CENTER_PIECE_BONUS = 2; // multiplier for pieces directly on center
export const EXTENDED_CENTER_BONUS = 1; // multiplier for pieces on extended center

/* ─── Opening Patterns (ECO) ─────────────────────── */

/**
 * Each entry is a named opening with its ECO code and pattern of SAN moves.
 * Patterns are matched sequentially from the start of the game.
 * More specific (longer) patterns are checked first.
 */
export const OPENING_PATTERNS: OpeningEntry[] = [
  // ── Open Games (1.e4 e5) ───────────────────────
  { name: "Italian Game", eco: "C50", pattern: "e4 e5 Nf3 Nc6 Bc4" },
  { name: "Italian Game: Two Knights Defense", eco: "C55", pattern: "e4 e5 Nf3 Nc6 Bc4 Nf6" },
  { name: "Ruy Lopez", eco: "C60", pattern: "e4 e5 Nf3 Nc6 Bb5" },
  { name: "Ruy Lopez: Morphy Defense", eco: "C70", pattern: "e4 e5 Nf3 Nc6 Bb5 a6" },
  { name: "Scotch Game", eco: "C45", pattern: "e4 e5 Nf3 Nc6 d4" },
  { name: "King's Gambit", eco: "C30", pattern: "e4 e5 f4" },
  { name: "Vienna Game", eco: "C25", pattern: "e4 e5 Nc3" },
  { name: "Philidor Defense", eco: "C41", pattern: "e4 e5 Nf3 d6" },
  { name: "Petrov's Defense", eco: "C42", pattern: "e4 e5 Nf3 Nf6" },
  { name: "Giuoco Piano", eco: "C50", pattern: "e4 e5 Nf3 Nc6 Bc4 Bc5" },
  { name: "Evans Gambit", eco: "C51", pattern: "e4 e5 Nf3 Nc6 Bc4 Bc5 b4" },
  { name: "Four Knights Game", eco: "C47", pattern: "e4 e5 Nf3 Nc6 Nc3 Nf6" },
  { name: "Hungarian Defense", eco: "C50", pattern: "e4 e5 Nf3 Nc6 Bc4 Be7" },

  // ── Semi-Open Games (1.e4, not 1…e5) ────────────
  { name: "Sicilian Defense", eco: "B20", pattern: "e4 c5" },
  { name: "Sicilian Defense: Open", eco: "B56", pattern: "e4 c5 Nf3 d6 d4 cxd4 Nxd4" },
  { name: "Sicilian Defense: Najdorf", eco: "B90", pattern: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 a6" },
  { name: "Sicilian Defense: Dragon", eco: "B70", pattern: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 g6" },
  { name: "Sicilian Defense: Classical", eco: "B56", pattern: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 Nc6" },
  { name: "Sicilian Defense: Scheveningen", eco: "B80", pattern: "e4 c5 Nf3 d6 d4 cxd4 Nxd4 Nf6 Nc3 e6" },
  { name: "French Defense", eco: "C00", pattern: "e4 e6" },
  { name: "French Defense: Advance", eco: "C02", pattern: "e4 e6 d4 d5 e5" },
  { name: "French Defense: Winawer", eco: "C15", pattern: "e4 e6 d4 d5 Nc3 Bb4" },
  { name: "French Defense: Tarrasch", eco: "C03", pattern: "e4 e6 d4 d5 Nd2" },
  { name: "Caro-Kann Defense", eco: "B10", pattern: "e4 c6" },
  { name: "Caro-Kann Defense: Advance", eco: "B12", pattern: "e4 c6 d4 d5 e5" },
  { name: "Caro-Kann Defense: Classical", eco: "B18", pattern: "e4 c6 d4 d5 Nc3 dxe4 Nxe4 Bf5" },
  { name: "Pirc Defense", eco: "B07", pattern: "e4 d6" },
  { name: "Alekhine's Defense", eco: "B02", pattern: "e4 Nf6" },
  { name: "Scandinavian Defense", eco: "B01", pattern: "e4 d5" },
  { name: "Modern Defense", eco: "B06", pattern: "e4 g6" },

  // ── Closed Games (1.d4 d5) ──────────────────────
  { name: "Queen's Gambit", eco: "D06", pattern: "d4 d5 c4" },
  { name: "Queen's Gambit Accepted", eco: "D20", pattern: "d4 d5 c4 dxc4" },
  { name: "Queen's Gambit Declined", eco: "D30", pattern: "d4 d5 c4 e6" },
  { name: "Queen's Gambit Declined: Slav", eco: "D10", pattern: "d4 d5 c4 c6" },
  { name: "Queen's Gambit Declined: Semi-Slav", eco: "D43", pattern: "d4 d5 c4 c6 Nf3 Nf6 Nc3 e6" },
  { name: "Queen's Gambit Declined: Orthodox", eco: "D60", pattern: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7" },
  { name: "Queen's Gambit Declined: Lasker", eco: "D56", pattern: "d4 d5 c4 e6 Nc3 Nf6 Bg5 Be7 e3 O-O Nf3 h6 Bh4 Ne4" },

  // ── Indian Defenses (1.d4 Nf6) ──────────────────
  { name: "Indian Defense", eco: "A40", pattern: "d4 Nf6" },
  { name: "King's Indian Defense", eco: "E60", pattern: "d4 Nf6 c4 g6 Nc3 Bg7" },
  { name: "King's Indian Defense: Classical", eco: "E90", pattern: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 Nf3 O-O Be2" },
  { name: "King's Indian Defense: Saemisch", eco: "E80", pattern: "d4 Nf6 c4 g6 Nc3 Bg7 e4 d6 f3" },
  { name: "Nimzo-Indian Defense", eco: "E20", pattern: "d4 Nf6 c4 e6 Nc3 Bb4" },
  { name: "Queen's Indian Defense", eco: "E12", pattern: "d4 Nf6 c4 e6 Nf3 b6" },
  { name: "Grünfeld Defense", eco: "D80", pattern: "d4 Nf6 c4 g6 Nc3 d5" },
  { name: "Grünfeld Defense: Exchange", eco: "D85", pattern: "d4 Nf6 c4 g6 Nc3 d5 cxd5 Nxd5" },
  { name: "Benoni Defense", eco: "A56", pattern: "d4 Nf6 c4 c5" },
  { name: "Modern Benoni", eco: "A60", pattern: "d4 Nf6 c4 c5 d5 e6" },
  { name: "Budapest Defense", eco: "A51", pattern: "d4 Nf6 c4 e5" },
  { name: "Catalan Opening", eco: "E04", pattern: "d4 Nf6 c4 e6 g3" },
  { name: "Bogo-Indian Defense", eco: "E11", pattern: "d4 Nf6 c4 e6 Nf3 Bb4+" },

  // ── Flank Openings ───────────────────────────────
  { name: "English Opening", eco: "A10", pattern: "c4" },
  { name: "English Opening: Symmetrical", eco: "A30", pattern: "c4 c5" },
  { name: "English Opening: King's English", eco: "A20", pattern: "c4 e5" },
  { name: "Réti Opening", eco: "A04", pattern: "Nf3" },
  { name: "King's Indian Attack", eco: "A07", pattern: "Nf3 d5 g3" },
  { name: "Bird's Opening", eco: "A02", pattern: "f4" },
  { name: "Dutch Defense", eco: "A80", pattern: "d4 f5" },
  { name: "Dutch Defense: Stonewall", eco: "A85", pattern: "d4 f5 c4 Nf6 g3 e6 Bg2 Be7 Nf3 O-O O-O d5" },
  { name: "Benko Gambit", eco: "A57", pattern: "d4 Nf6 c4 c5 d5 b5" },
  { name: "London System", eco: "D02", pattern: "d4 d5 Nf3 Nf6 Bf4" },
  { name: "Colle System", eco: "D04", pattern: "d4 d5 Nf3 Nf6 e3" },
  { name: "Trompowsky Attack", eco: "A45", pattern: "d4 Nf6 Bg5" },
  { name: "Veresov Attack", eco: "D01", pattern: "d4 d5 Nc3" },
  { name: "Polish Opening", eco: "A00", pattern: "b4" },
  { name: "Grob's Attack", eco: "A00", pattern: "g4" },
  { name: "Sicilian Defense: Smith-Morra", eco: "B21", pattern: "e4 c5 d4 cxd4 c3" },
  { name: "Sicilian Defense: Alapin", eco: "B22", pattern: "e4 c5 c3" },
];

/**
 * Sort openings by pattern length (descending) so more specific patterns
 * are matched before generic ones.
 */
export const SORTED_OPENINGS: OpeningEntry[] = [...OPENING_PATTERNS].sort(
  (a, b) => b.pattern.split(" ").length - a.pattern.split(" ").length,
);

/* ─── Default Importance Weights ─────────────────── */

export const DEFAULT_IMPORTANCE_WEIGHTS: ImportanceWeights = {
  base: 15,
  isCheckmate: 85,
  isCheck: 15,
  isCapture: 10,
  isPromotion: 30,
  isCastle: 10,
  evalSwing: 25,
  queenLoss: 40,
  mateThreat: 50,
};

/**
 * Maximum importance score (clamped to this value).
 */
export const MAX_IMPORTANCE = 100;

/**
 * Minimum importance score.
 */
export const MIN_IMPORTANCE = 5;

/* ─── Centipawn Display ─────────────────────────── */

export const CP_DISPLAY_PRECISION = 1; // decimal places
