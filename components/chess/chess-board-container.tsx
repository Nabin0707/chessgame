"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

const Chessboard = dynamic(
  () => import("react-chessboard").then((mod) => mod.Chessboard),
  { ssr: false },
);

interface ChessBoardContainerProps {
  className?: string;
}

export function ChessBoardContainer({ className }: ChessBoardContainerProps) {
  return (
    <section
      className={cn(
        "flex items-center justify-center",
        className,
      )}
      aria-label="Chess board"
    >
      <div className="w-full max-w-[560px]">
        <Chessboard
          options={{
            position: "start",
            boardOrientation: "white",
            allowDragging: false,
            showNotation: true,
          }}
        />
      </div>
    </section>
  );
}
