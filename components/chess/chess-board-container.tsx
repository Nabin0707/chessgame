"use client";

import dynamic from "next/dynamic";
import { useCallback } from "react";

import { cn } from "@/lib/utils";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false },
);

interface ChessBoardContainerProps {
  className?: string;
  fen: string;
  onMove: (from: string, to: string) => boolean;
}

export function ChessBoardContainer({
  className,
  fen,
  onMove,
}: ChessBoardContainerProps) {
  const handlePieceDrop = useCallback(
    (args: { sourceSquare: string; targetSquare: string | null }) => {
      if (!args.targetSquare) return false;
      return onMove(args.sourceSquare, args.targetSquare);
    },
    [onMove],
  );

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
            allowDragging: true,
            showNotation: true,
            onPieceDrop: handlePieceDrop,
          }}
        />
      </div>
    </section>
  );
}
