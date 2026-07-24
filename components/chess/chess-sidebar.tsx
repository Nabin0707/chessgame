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
} from "lucide-react";

import type { MoveRecord, GameStatus } from "@/types/chess";

interface ChessSidebarProps {
  className?: string;
  moveHistory: MoveRecord[];
  gameStatus: GameStatus;
  onNewGame: () => void;
  onUndo: () => void;
  isAwaitingEngineMove?: boolean;
}

export function ChessSidebar({
  className,
  moveHistory,
  gameStatus,
  onNewGame,
  onUndo,
  isAwaitingEngineMove = false,
}: ChessSidebarProps) {
  const canUndo = moveHistory.length > 0 && !isAwaitingEngineMove;
  const isGameOver = gameStatus.kind !== "playing" && gameStatus.kind !== "check";

  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game controls"
    >
      <GameControlsCard
        onNewGame={onNewGame}
        onUndo={onUndo}
        canUndo={canUndo}
        isGameOver={isGameOver}
      />
      <MoveHistoryCard moveHistory={moveHistory} />
      <CapturedPiecesCard />
    </aside>
  );
}

interface GameControlsCardProps {
  onNewGame: () => void;
  onUndo: () => void;
  canUndo: boolean;
  isGameOver: boolean;
}

function GameControlsCard({
  onNewGame,
  onUndo,
  canUndo,
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
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button variant="default" size="sm" onClick={onNewGame} className="w-full gap-2">
              <Plus className="size-4" aria-hidden="true" />
              {isGameOver ? "New Game" : "New Game"}
            </Button>
          </motion.div>
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

function CapturedPiecesCard() {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Swords className="size-4 text-primary" aria-hidden="true" />
            Captured Pieces
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Coming soon.
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
