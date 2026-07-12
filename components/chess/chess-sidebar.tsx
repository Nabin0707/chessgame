"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ChessSidebarProps {
  className?: string;
}

export function ChessSidebar({ className }: ChessSidebarProps) {
  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game controls"
    >
      <GameControlsCard />
      <MoveHistoryCard />
      <CapturedPiecesCard />
    </aside>
  );
}

function GameControlsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Controls</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <Button variant="default" size="sm" disabled>
          New Game
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1" disabled>
            Resign
          </Button>
          <Button variant="outline" size="sm" className="flex-1" disabled>
            Draw
          </Button>
        </div>
        <Button variant="ghost" size="sm" disabled>
          Undo Move
        </Button>
      </CardContent>
    </Card>
  );
}

function MoveHistoryCard() {
  return (
    <Card className="flex-1">
      <CardHeader>
        <CardTitle className="text-sm">Move History</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40">
          <p className="text-sm text-muted-foreground">
            No moves yet. Start a game to see the move history.
          </p>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function CapturedPiecesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Captured Pieces</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          No captures yet.
        </p>
      </CardContent>
    </Card>
  );
}
