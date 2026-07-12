"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatEval } from "@/types/engine";

import type { GameStatus } from "@/types/chess";
import type { EvalScore } from "@/types/engine";

interface ChessInfoPanelProps {
  className?: string;
  gameStatus: GameStatus;
  evalScore: EvalScore | null;
  evalIsThinking: boolean;
  engineStatus: "idle" | "loading" | "ready" | "error";
  engineErrorMessage: string | null;
  isAwaitingEngineMove?: boolean;
}

export function ChessInfoPanel({
  className,
  gameStatus,
  evalScore,
  evalIsThinking,
  engineStatus,
  engineErrorMessage,
  isAwaitingEngineMove = false,
}: ChessInfoPanelProps) {
  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game information"
    >
      <AICommentaryCard />
      <EvaluationCard
        score={evalScore}
        isThinking={evalIsThinking}
        status={engineStatus}
        errorMessage={engineErrorMessage}
      />
      <GameStatusCard
        status={gameStatus}
        isAwaitingEngineMove={isAwaitingEngineMove}
      />
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

interface EvaluationCardProps {
  score: EvalScore | null;
  isThinking: boolean;
  status: "idle" | "loading" | "ready" | "error";
  errorMessage: string | null;
}

function EvaluationCard({
  score,
  isThinking,
  status,
  errorMessage,
}: EvaluationCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Evaluation</CardTitle>
      </CardHeader>
      <CardContent>
        {status === "loading" && (
          <p className="text-sm text-muted-foreground">
            Loading Stockfish engine…
          </p>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive">
            {errorMessage ?? "Engine failed to load"}
          </p>
        )}

        {status === "ready" && !score && !isThinking && (
          <p className="text-sm text-muted-foreground">
            Waiting for position…
          </p>
        )}

        {status === "ready" && isThinking && !score && (
          <p className="text-sm text-muted-foreground">
            Loading…
          </p>
        )}

        {status === "ready" && score && (
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tabular-nums">
              {formatEval(score)}
            </span>
            {isThinking && (
              <span className="text-xs text-muted-foreground animate-pulse">
                searching
              </span>
            )}
          </div>
        )}

        {status === "idle" && (
          <p className="text-sm text-muted-foreground">
            Engine not available
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface GameStatusCardProps {
  status: GameStatus;
  isAwaitingEngineMove?: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  playing: "Playing",
  check: "Check!",
  checkmate: "Checkmate",
  stalemate: "Stalemate",
  draw: "Draw",
};

function GameStatusCard({
  status,
  isAwaitingEngineMove = false,
}: GameStatusCardProps) {
  const label = STATUS_LABELS[status.kind] ?? status.kind;

  const details = formatStatusDetail(status, isAwaitingEngineMove);

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

function formatStatusDetail(
  status: GameStatus,
  isAwaitingEngineMove = false,
): string {
  switch (status.kind) {
    case "playing":
      if (isAwaitingEngineMove) return "Stockfish is thinking…";
      return status.turn === "w" ? "White to move" : "Black to move";
    case "check":
      if (isAwaitingEngineMove) return "Stockfish is thinking…";
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

