"use client";

import { useRef, useState, useMemo, useCallback } from "react";

import { ChessHeader } from "@/components/chess/chess-header";
import { ChessSidebar } from "@/components/chess/chess-sidebar";
import { ChessBoardContainer } from "@/components/chess/chess-board-container";
import { ChessInfoPanel } from "@/components/chess/chess-info-panel";
import { ChessFooter } from "@/components/chess/chess-footer";

import {
  createGame,
  resetGame,
  makeMove,
  undoMove,
  getFen,
  getMoveHistory,
  getGameStatus,
} from "@/lib/chess/game";

import type { GameInstance } from "@/lib/chess/game";

export function ChessWorkspace() {
  const gameRef = useRef<GameInstance>(createGame());
  const [revision, setRevision] = useState(0);

  const fen = useMemo(() => getFen(gameRef.current), [revision]);
  const moveHistory = useMemo(() => getMoveHistory(gameRef.current), [revision]);
  const gameStatus = useMemo(() => getGameStatus(gameRef.current), [revision]);

  const handleMove = useCallback((from: string, to: string): boolean => {
    const result = makeMove(gameRef.current, from, to);
    if (result.success) {
      setRevision((r) => r + 1);
      return true;
    }
    return false;
  }, []);

  const handleNewGame = useCallback(() => {
    gameRef.current = resetGame();
    setRevision((r) => r + 1);
  }, []);

  const handleUndo = useCallback(() => {
    if (undoMove(gameRef.current)) {
      setRevision((r) => r + 1);
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <ChessHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 lg:p-6">
        <ChessSidebar
          className="hidden lg:flex"
          moveHistory={moveHistory}
          gameStatus={gameStatus}
          onNewGame={handleNewGame}
          onUndo={handleUndo}
        />

        <ChessBoardContainer fen={fen} onMove={handleMove} />

        <ChessInfoPanel className="hidden lg:flex" gameStatus={gameStatus} />
      </div>

      <ChessFooter />
    </div>
  );
}
