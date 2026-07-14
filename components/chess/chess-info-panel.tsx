"use client";

import { useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEval } from "@/types/engine";

import type { GameStatus } from "@/types/chess";
import type { EvalScore } from "@/types/engine";

export type CommentaryState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; text: string; reactions: string[]; tip?: string }
  | { kind: "error" }
  | { kind: "unconfigured" };

interface ChessInfoPanelProps {
  className?: string;
  gameStatus: GameStatus;
  evalScore: EvalScore | null;
  evalIsThinking: boolean;
  engineStatus: "idle" | "loading" | "ready" | "error";
  engineErrorMessage: string | null;
  isAwaitingEngineMove?: boolean;
  commentaryState: CommentaryState;
  onRetryCommentary?: () => void;
}

export function ChessInfoPanel({
  className,
  gameStatus,
  evalScore,
  evalIsThinking,
  engineStatus,
  engineErrorMessage,
  isAwaitingEngineMove = false,
  commentaryState,
  onRetryCommentary,
}: ChessInfoPanelProps) {
  return (
    <aside
      className={cn("flex flex-col gap-4", className)}
      aria-label="Game information"
    >
      <AICommentaryCard
        state={commentaryState}
        onRetry={onRetryCommentary}
      />
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

interface AICommentaryCardProps {
  state: CommentaryState;
  onRetry?: () => void;
}

function AICommentaryCard({ state, onRetry }: AICommentaryCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">AI Commentary</CardTitle>
      </CardHeader>
      <CardContent>
        {state.kind === "idle" && (
          <p className="text-sm text-muted-foreground">
            Make a move to see AI commentary.
          </p>
        )}

        {state.kind === "loading" && (
          <div className="flex items-center gap-2">
            <span className="inline-block size-3 animate-pulse rounded-full bg-primary" />
            <p className="text-sm text-muted-foreground">
              Analysing your move…
            </p>
          </div>
        )}

        {state.kind === "success" && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {state.reactions.map((emoji, i) => (
                <span key={i} className="text-lg" role="img" aria-label="reaction">
                  {emoji}
                </span>
              ))}
            </div>
            <p className="text-sm">{state.text}</p>
            {state.tip && (
              <p className="text-xs text-muted-foreground italic">
                💡 {state.tip}
              </p>
            )}
          </div>
        )}

        {state.kind === "error" && (
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              Could not generate commentary.
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
              >
                Try again
              </Button>
            )}
          </div>
        )}

        {state.kind === "unconfigured" && (
          <p className="text-sm text-muted-foreground">
            AI commentary requires a Gemini API key to be set on the server.
          </p>
        )}
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
          <div className="space-y-2">
            <p className="text-sm text-destructive">
              {errorMessage ?? "Engine failed to load"}
            </p>
            <p className="text-xs text-muted-foreground">
              {errorMessage?.includes("Worker did not respond") || errorMessage?.includes("failed to load")
                ? "If using Brave, try turning Shields off for this site (click the lion icon in the URL bar)."
                : "Try refreshing the page."}
            </p>
          </div>
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

