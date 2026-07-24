"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import {
  RotateCcw,
  Plus,
  History,
  Swords,
  FlipHorizontal,
  Flag,
  Handshake,
} from "lucide-react";

import { CapturedPiecesCard } from "@/components/chess/CapturedPiecesCard";
import { ChessClock } from "@/components/chess/ChessClock";
import { PgnTools } from "@/components/chess/PgnTools";

import type { MoveRecord, GameStatus } from "@/types/chess";
import type { GameInstance } from "@/lib/chess/game";
import type { TimeControl, TimerState } from "@/lib/chess/clock";

interface ChessSidebarProps {
  className?: string;
  moveHistory: MoveRecord[];
  gameStatus: GameStatus;
  onNewGame: () => void;
  onUndo: () => void;
  isAwaitingEngineMove?: boolean;

  /* Captured pieces */
  gameRef: React.RefObject<GameInstance | null>;
  revision: number;

  /* Flip board */
  boardFlipped: boolean;
  onFlipBoard: () => void;

  /* Resign / Draw */
  onResign: () => void;
  onOfferDraw: () => void;

  /* Clock */
  timerState: TimerState;
  onClockStart: () => void;
  onClockPause: () => void;
  onClockResume: () => void;
  clockIsPaused: boolean;
  onTimeControlChange: (tc: TimeControl) => void;
  gameOver: boolean;

  /* Import */
  onImport: (newGame: GameInstance) => void;

  /* Sidebar visibility */
  visible: boolean;
}

export function ChessSidebar({
  className,
  moveHistory,
  gameStatus,
  onNewGame,
  onUndo,
  isAwaitingEngineMove = false,
  gameRef,
  revision,
  boardFlipped,
  onFlipBoard,
  onResign,
  onOfferDraw,
  timerState,
  onClockStart,
  onClockPause,
  onClockResume,
  clockIsPaused,
  onTimeControlChange,
  gameOver,
  onImport,
  visible,
}: ChessSidebarProps) {
  const canUndo = moveHistory.length > 0 && !isAwaitingEngineMove && !gameOver;
  const isGameOver = gameStatus.kind !== "playing" && gameStatus.kind !== "check";
  const canResign = !isGameOver && moveHistory.length > 0;

  if (!visible) return null;

  return (
    <aside
      className={cn("flex flex-col gap-4 overflow-y-auto", className)}
      aria-label="Game controls"
    >
      <GameControlsCard
        onNewGame={onNewGame}
        onUndo={onUndo}
        onFlipBoard={onFlipBoard}
        onResign={onResign}
        onOfferDraw={onOfferDraw}
        canUndo={canUndo}
        boardFlipped={boardFlipped}
        canResign={canResign}
        isGameOver={isGameOver}
      />
      <ChessClock
        timerState={timerState}
        onStart={onClockStart}
        onPause={onClockPause}
        onResume={onClockResume}
        isPaused={clockIsPaused}
        onTimeControlChange={onTimeControlChange}
        gameOver={gameOver}
      />
      <PgnTools gameRef={gameRef} onImport={onImport} />
      <CapturedPiecesCard gameRef={gameRef} revision={revision} />
      <MoveHistoryCard moveHistory={moveHistory} />
    </aside>
  );
}

interface GameControlsCardProps {
  onNewGame: () => void;
  onUndo: () => void;
  onFlipBoard: () => void;
  onResign: () => void;
  onOfferDraw: () => void;
  canUndo: boolean;
  boardFlipped: boolean;
  canResign: boolean;
  isGameOver: boolean;
}

function GameControlsCard({
  onNewGame,
  onUndo,
  onFlipBoard,
  onResign,
  onOfferDraw,
  canUndo,
  boardFlipped,
  canResign,
  isGameOver,
}: GameControlsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Swords className="size-4 text-primary" aria-hidden="true" />
            Game Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {/* New Game */}
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button variant="default" size="sm" onClick={onNewGame} className="w-full gap-2">
              <Plus className="size-4" aria-hidden="true" />
              New Game
            </Button>
          </motion.div>

          {/* Undo */}
          <motion.div
            whileHover={canUndo ? { scale: 1.02 } : undefined}
            whileTap={canUndo ? { scale: 0.98 } : undefined}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={onUndo}
              disabled={!canUndo}
              className="w-full gap-2"
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Undo Move
            </Button>
          </motion.div>

          {/* Row: Flip, Resign, Draw */}
          <div className="grid grid-cols-3 gap-1">
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onFlipBoard}
                className="w-full gap-1 text-xs"
                title={boardFlipped ? "View from White" : "View from Black"}
              >
                <FlipHorizontal className="size-3.5" aria-hidden="true" />
                Flip
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onResign}
                disabled={!canResign}
                className="w-full gap-1 text-xs"
              >
                <Flag className="size-3.5" aria-hidden="true" />
                Resign
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                variant="outline"
                size="sm"
                onClick={onOfferDraw}
                disabled={isGameOver}
                className="w-full gap-1 text-xs"
              >
                <Handshake className="size-3.5" aria-hidden="true" />
                Draw
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MoveHistoryCardProps {
  moveHistory: MoveRecord[];
}

function MoveHistoryCard({ moveHistory }: MoveHistoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card className="flex-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="size-4 text-primary" aria-hidden="true" />
            Move History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-48">
            {moveHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No moves yet. Drag a piece to start.
              </p>
            ) : (
              <MovesTable moves={moveHistory} />
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface MovesTableProps {
  moves: MoveRecord[];
}

function MovesTable({ moves }: MovesTableProps) {
  const paired = useMemo(() => {
    const pairs: Array<[number, MoveRecord, MoveRecord | null]> = [];
    for (let i = 0; i < moves.length; i += 2) {
      const white = moves[i];
      const black = moves[i + 1] ?? null;
      pairs.push([Math.floor(i / 2) + 1, white, black]);
    }
    return pairs;
  }, [moves]);

  return (
    <table className="w-full text-sm">
      <thead className="sr-only">
        <tr>
          <th>#</th>
          <th>White</th>
          <th>Black</th>
        </tr>
      </thead>
      <tbody>
        {paired.map(([number, white, black], idx) => (
          <motion.tr
            key={number}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.03 }}
            className="border-b border-border/40 last:border-0"
          >
            <td className="w-6 text-muted-foreground text-xs">{number}.</td>
            <td className="py-0.5 font-mono">{white.san}</td>
            <td className="py-0.5 font-mono text-muted-foreground">
              {black?.san ?? ""}
            </td>
          </motion.tr>
        ))}
      </tbody>
    </table>
  );
}
