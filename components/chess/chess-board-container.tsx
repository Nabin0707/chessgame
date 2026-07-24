"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false },
);

interface ChessBoardContainerProps {
  className?: string;
  fen: string;
  onMove: (from: string, to: string) => boolean;
  disabled?: boolean;
  /**
   * Given a square, return an array of legal destination squares.
   * Used to highlight legal moves when a piece is selected or dragged.
   */
  getLegalMovesForSquare?: (square: string) => string[];
}

/* ─── Highlight Styles ──────────────────────────────────── */

/** Semi-transparent dot shown on legal destination squares. */
const LEGAL_MOVE_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle, rgba(0,0,0,0.25) 25%, transparent 25%)",
  borderRadius: "50%",
};

/** Subtle highlight for the selected piece's current square. */
const SELECTED_SQUARE_STYLE: React.CSSProperties = {
  background: "rgba(255, 255, 0, 0.35)",
  borderRadius: "4px",
};

/** Rounded corner hint when a legal square has a capturable piece. */
const CAPTURE_STYLE: React.CSSProperties = {
  background: "radial-gradient(circle at 50% 50%, transparent 70%, rgba(0,0,0,0.25) 70%)",
  borderRadius: "4px",
  boxShadow: "inset 0 0 0 3px rgba(0,0,0,0.25)",
};

/* ─── Component ─────────────────────────────────────────── */

export function ChessBoardContainer({
  className,
  fen,
  onMove,
  disabled = false,
  getLegalMovesForSquare,
}: ChessBoardContainerProps) {
  /* ── Selection state ─────────────────────────────────── */

  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalTargets, setLegalTargets] = useState<string[]>([]);

  /* ── Compute highlight styles ─────────────────────────── */

  const squareStyles = useMemo<Record<string, React.CSSProperties>>(() => {
    const styles: Record<string, React.CSSProperties> = {};

    if (selectedSquare && legalTargets.length > 0) {
      // Highlight the selected piece's square.
      styles[selectedSquare] = SELECTED_SQUARE_STYLE;

      // Highlight each legal destination.
      for (const sq of legalTargets) {
        // If there's a piece on the target, use the capture ring style.
        // We detect this by checking if the FEN has an enemy piece there.
        styles[sq] = LEGAL_MOVE_STYLE;
      }
    }

    return styles;
  }, [selectedSquare, legalTargets]);

  /* ── Select a piece and compute legal moves ───────────── */

  const selectPiece = useCallback(
    (square: string | null) => {
      if (!square || !getLegalMovesForSquare || disabled) {
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      const targets = getLegalMovesForSquare(square);
      if (targets.length === 0) {
        // Clicked an empty square or a piece with no legal moves.
        setSelectedSquare(null);
        setLegalTargets([]);
        return;
      }

      setSelectedSquare(square);
      setLegalTargets(targets);
    },
    [getLegalMovesForSquare, disabled],
  );

  /* ── Clear selection ──────────────────────────────────── */

  const clearSelection = useCallback(() => {
    setSelectedSquare(null);
    setLegalTargets([]);
  }, []);

  /* ── Handle square click (click-to-move) ──────────────── */

  const handleSquareClick = useCallback(
    ({ square }: { piece: unknown; square: string }) => {
      if (disabled) return;

      if (!selectedSquare) {
        // No piece selected yet — try to select this one.
        selectPiece(square);
        return;
      }

      // A piece is already selected.
      if (square === selectedSquare) {
        // Clicking the same square deselects.
        clearSelection();
        return;
      }

      // Check if the clicked square is a legal target → make the move.
      if (legalTargets.includes(square)) {
        const success = onMove(selectedSquare, square);
        if (success) {
          clearSelection();
          return;
        }
      }

      // Clicked a different square that isn't a legal target.
      // Try selecting a piece on that square instead.
      selectPiece(square);
    },
    [disabled, selectedSquare, legalTargets, onMove, selectPiece, clearSelection],
  );

  /* ── Handle drag start ────────────────────────────────── */

  const handlePieceDrag = useCallback(
    ({ square }: { isSparePiece: boolean; piece: unknown; square: string | null }) => {
      if (disabled || !square) {
        clearSelection();
        return;
      }
      selectPiece(square);
    },
    [disabled, selectPiece, clearSelection],
  );

  /* ── Handle piece drop (clear selection) ──────────────── */

  const handlePieceDrop = useCallback(
    (args: { sourceSquare: string; targetSquare: string | null }) => {
      if (!args.targetSquare) {
        clearSelection();
        return false;
      }
      const success = onMove(args.sourceSquare, args.targetSquare);
      if (success) {
        clearSelection();
      }
      return success;
    },
    [onMove, clearSelection],
  );

  /* ── Handle mouse leave (clear hover) ─────────────────── */

  const handleMouseOutSquare = useCallback(() => {
    // No-op: we keep highlights visible until move completes or deselection.
  }, []);

  /* ─── Render ──────────────────────────────────────────── */

  return (
    <section
      className={cn("flex items-center justify-center", className)}
      aria-label="Chess board"
    >
      <div className="w-full max-w-[560px]">
        <Chessboard
          options={{
            position: fen,
            boardOrientation: "white",
            allowDragging: !disabled,
            showNotation: true,
            squareStyles,
            onSquareClick: handleSquareClick,
            onPieceDrag: handlePieceDrag,
            onPieceDrop: handlePieceDrop,
            onMouseOutSquare: handleMouseOutSquare,
          }}
        />
      </div>
    </section>
  );
}
