"use client";

import { ChessHeader } from "@/components/chess/chess-header";
import { ChessSidebar } from "@/components/chess/chess-sidebar";
import { ChessBoardContainer } from "@/components/chess/chess-board-container";
import { ChessInfoPanel } from "@/components/chess/chess-info-panel";
import { ChessFooter } from "@/components/chess/chess-footer";

export function ChessWorkspace() {
  return (
    <div className="flex min-h-screen flex-col">
      <ChessHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 lg:p-6">
        <ChessSidebar className="hidden lg:flex" />

        <ChessBoardContainer />

        <ChessInfoPanel className="hidden lg:flex" />
      </div>

      <ChessFooter />
    </div>
  );
}
