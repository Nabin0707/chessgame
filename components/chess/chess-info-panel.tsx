"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type { GameStatus } from "@/types/chess";

interface ChessInfoPanelProps {
  className?: string;
  gameStatus: GameStatus;
}

export function ChessInfoPanel({
  className,
  gameStatus,
}: ChessInfoPanelProps) {
  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game information"
    >
      <AICommentaryCard />
      <EvaluationCard />
      <GameStatusCard status={gameStatus} />
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
          AI commentary will be available in a future milestone.
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
          Stockfish evaluation will be available in a future milestone.
        </p>
      </CardContent>
    </Card>
  );
}

interface GameStatusCardProps {
  status: GameStatus;
}

const STATUS_LABELS: Record<string, string> = {
  playing: "Playing",
  check: "Check!",
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  draw: "Draw",
};

function GameStatusCard({ status }: GameStatusCardProps) {
  const label = STATUS_LABELS[status.kind] ?? status.kind;

  const details = formatStatusDetail(status);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Game Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium">{label}</p>
          {details && (
            <p className="text-sm text-muted-foreground">{details}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function formatStatusDetail(status: GameStatus): string {
  switch (status.kind) {
    case "playing":
      return status.turn === "w" ? "White to move" : "Black to move";
    case "check":
      return status.turn === "w" ? "White is in check" : "Black is in check";
    case "checkmate":
      return status.winner === "w"
        ? "White wins by checkmate!"
        : "Black wins by checkmate!";
    case "stalemate":
      return "The game is a stalemate.";
    case "draw": {
      const reasons: Record<string, string> = {
        "insufficient-material": "Insufficient material",
        "threefold-repetition": "Threefold repetition",
        "fifty-move-rule": "Fifty-move rule",
        agreement: "Draw by agreement",
      };
      return reasons[status.reason] ?? "Draw";
    }
  }
}
