"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ChessInfoPanelProps {
  className?: string;
}

export function ChessInfoPanel({ className }: ChessInfoPanelProps) {
  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game information"
    >
      <AICommentaryCard />
      <EvaluationCard />
      <GameStatusCard />
    </aside>
  );
}

function AICommentaryCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">AI Commentary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          AI-powered commentary will appear here during the game.
        </p>
      </CardContent>
    </Card>
  );
}

function EvaluationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Engine evaluation will appear here once Stockfish is connected.
        </p>
      </CardContent>
    </Card>
  );
}

function GameStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Status</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Waiting for game to start.
        </p>
      </CardContent>
    </Card>
  );
}
