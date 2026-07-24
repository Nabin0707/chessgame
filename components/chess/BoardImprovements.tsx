/**
 * ──────────────────────────────────────────────────────────
 * BoardImprovements  —  components/chess/BoardImprovements.tsx
 *
 * Pure utility to compute square highlight styles for last
 * move, check, and legal-move indicators.  No state, no
 * side effects, no React hooks.
 * ──────────────────────────────────────────────────────────
 */

import type { CSSProperties } from "react";

/* ─── Types ──────────────────────────────────────────────── */

export interface BoardHighlightParams {
  /** Last move squares (from → to) */
  lastMove: { from: string; to: string } | null;
  /** King square when in check, or null */
  checkSquare: string | null;
  /** Currently selected piece square */
  selectedSquare: string | null;
  /** Legal destination squares for the selected piece */
  legalTargets: string[];
}

/* ─── Style Constants ────────────────────────────────────── */

const LAST_MOVE_FROM: CSSProperties = {
  background: "rgba(255, 200, 0, 0.35)",
  borderRadius: "4px",
};

const LAST_MOVE_TO: CSSProperties = {
  background: "rgba(255, 200, 0, 0.35)",
  borderRadius: "4px",
};

const CHECK_SQUARE: CSSProperties = {
  background: "radial-gradient(circle at center, rgba(255, 0, 0, 0.6) 0%, rgba(255, 0, 0, 0.15) 60%, transparent 100%)",
  borderRadius: "50%",
};

const SELECTED_SQUARE: CSSProperties = {
  background: "rgba(255, 255, 0, 0.4)",
  borderRadius: "4px",
};

const LEGAL_MOVE_DOT: CSSProperties = {
  background: "radial-gradient(circle, rgba(0, 0, 0, 0.25) 25%, transparent 25%)",
  borderRadius: "50%",
};

const CAPTURE_RING: CSSProperties = {
  background: "transparent",
  borderRadius: "4px",
  boxShadow: "inset 0 0 0 3px rgba(0, 0, 0, 0.25)",
};

/* ─── Main function ──────────────────────────────────────── */

/**
 * Compute square styles based on board state.
 */
export function getSquareStyles(
  params: BoardHighlightParams,
): Record<string, CSSProperties> {
  const styles: Record<string, CSSProperties> = {};
  const { lastMove, checkSquare, selectedSquare, legalTargets } = params;

  // Last move highlight
  if (lastMove) {
    styles[lastMove.from] = {
      ...LAST_MOVE_FROM,
      ...styles[lastMove.from],
    };
    styles[lastMove.to] = {
      ...LAST_MOVE_TO,
      ...styles[lastMove.to],
    };
  }

  // Check highlight (overrides last move if same square)
  if (checkSquare) {
    styles[checkSquare] = {
      ...CHECK_SQUARE,
      ...styles[checkSquare],
    };
  }

  // Selected square
  if (selectedSquare) {
    styles[selectedSquare] = {
      ...SELECTED_SQUARE,
      ...styles[selectedSquare],
    };
  }

  // Legal move indicators
  if (selectedSquare && legalTargets.length > 0) {
    for (const sq of legalTargets) {
      // Capture ring vs dot
      styles[sq] = {
        ...(sq === checkSquare ? CAPTURE_RING : LEGAL_MOVE_DOT),
        ...styles[sq],
      };
    }
  }

  return styles;
}
