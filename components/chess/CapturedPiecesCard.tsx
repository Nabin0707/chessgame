/**
 * ──────────────────────────────────────────────────────────
 * CapturedPiecesCard  —  components/chess/CapturedPiecesCard.tsx
 *
 * Displays captured pieces grouped by type with material
 * balance.  Animated appearance via Framer Motion.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Swords } from "lucide-react";

import type { GameInstance } from "@/lib/chess/game";
import {
  getCapturedPieces,
  getMaterialBalance,
  PIECE_SYMBOLS,
  PIECE_SORT_ORDER,
} from "@/lib/chess/captured-pieces";

/* ─── Props ──────────────────────────────────────────────── */

interface CapturedPiecesCardProps {
  className?: string;
  gameRef: React.RefObject<GameInstance | null>;
  /** Revision counter so we re-render when game changes */
  revision: number;
}

/* ─── Component ──────────────────────────────────────────── */

export function CapturedPiecesCard({
  className,
  gameRef,
  revision,
}: CapturedPiecesCardProps) {
  const captured = useMemo(() => {
    const game = gameRef.current;
    if (!game) return { white: [], black: [], balance: 0 };
    const pieces = getCapturedPieces(game);
    const balance = getMaterialBalance(pieces.white, pieces.black);
    return { ...pieces, balance };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, gameRef.current]);

  const hasAny = captured.white.length > 0 || captured.black.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Swords className="size-4 text-primary" aria-hidden="true" />
            Captured Pieces
            {captured.balance !== 0 && (
              <span
                className={cn(
                  "ml-auto text-xs font-semibold tabular-nums",
                  captured.balance > 0
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400",
                )}
              >
                {captured.balance > 0 ? "+" : ""}
                {captured.balance}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAny ? (
            <p className="text-sm text-muted-foreground">
              No pieces captured yet.
            </p>
          ) : (
            <div className="space-y-2">
              {/* Black's captures — shows white piece symbols */}
              <PieceRow
                label="Black"
                pieces={captured.black}
                color="white"
              />
              {/* White's captures — shows black piece symbols */}
              <PieceRow
                label="White"
                pieces={captured.white}
                color="black"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function PieceRow({
  label,
  pieces,
  color,
}: {
  label: string;
  pieces: string[];
  color: "white" | "black";
}) {
  // Count per type, sorted by value
  const grouped = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of pieces) {
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return PIECE_SORT_ORDER.filter((t) => counts[t]).map((t) => ({
      type: t,
      count: counts[t],
    }));
  }, [pieces]);

  if (grouped.length === 0) return null;

  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="w-10 text-xs text-muted-foreground">{label}:</span>
      <div className="flex flex-wrap gap-1">
        {grouped.map(({ type, count }, i) => (
          <motion.span
            key={type}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05, type: "spring", stiffness: 300 }}
            className="flex items-center gap-0.5"
            title={`${count}× ${type}`}
          >
            <span className="text-base leading-none">
              {PIECE_SYMBOLS[`${color === "white" ? "w" : "b"}${type}`] ?? "?"}
            </span>
            {count > 1 && (
              <span className="text-xs tabular-nums text-muted-foreground">
                ×{count}
              </span>
            )}
          </motion.span>
        ))}
      </div>
    </div>
  );
}
