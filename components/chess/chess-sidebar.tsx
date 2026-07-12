"use client";

import { useMemo } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import type { MoveRecord, GameStatus } from "@/types/chess";

interface ChessSidebarProps {
  className?: string;
  moveHistory: MoveRecord[];
  gameStatus: GameStatus;
  onNewGame: () => void;
  onUndo: () => void;
}

export function ChessSidebar({
  className,
  moveHistory,
  gameStatus,
  onNewGame,
  onUndo,
}: ChessSidebarProps) {
  const canUndo = moveHistory.length > 0;
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
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="default" size="sm" onClick={onNewGame}>
          {isGameOver ? "New Game" : "New Game"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onUndo}
          disabled={!canUndo}
        >
          Undo Move
        </Button>
      </CardContent>
    </Card>
  );
}

interface MoveHistoryCardProps {
  moveHistory: MoveRecord[];
}

function MoveHistoryCard({ moveHistory }: MoveHistoryCardProps) {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm">Move History</CardTitle>
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
        {paired.map(([number, white, black]) => (
          <tr key={number} className="border-b border-border/40 last:border-0">
            <td className="w-6 text-muted-foreground text-xs">{number}.</td>
            <td className="py-0.5 font-mono">{white.san}</td>
            <td className="py-0.5 font-mono text-muted-foreground">
              {black?.san ?? ""}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function CapturedPiecesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Captured Pieces</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coming soon.</p>
      </CardContent>
    </Card>
  );
}
