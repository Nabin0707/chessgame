"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatEval } from "@/types/engine";

import {
  MessageSquareText,
  Lightbulb,
  RefreshCw,
  BarChart3,
  Search,
  Flag,
  Swords,
} from "lucide-react";

import { PersonalitySelector } from "@/components/ai/PersonalitySelector";
import { PlayerStatsCard } from "@/components/ai/PlayerStatsCard";

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
      <PlayerStatsCard />
    </aside>
  );
}

interface AICommentaryCardProps {
  state: CommentaryState;
  onRetry?: () => void;
}

function AICommentaryCard({ state, onRetry }: AICommentaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            AI Commentary
            <span className="ml-auto">
              <PersonalitySelector />
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {state.kind === "idle" && (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Make a move to see AI commentary.
              </motion.p>
            )}

            {state.kind === "loading" && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <motion.span
                  className="inline-block size-3 rounded-full bg-primary"
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [1, 0.6, 1],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.p
                  className="text-sm text-muted-foreground"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  Analysing your move…
                </motion.p>
              </motion.div>
            )}

            {state.kind === "success" && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2"
              >
                {state.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {state.reactions.map((emoji, i) => (
                      <motion.span
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                        className="text-lg"
                        role="img"
                        aria-label="reaction"
                      >
                        {emoji}
                      </motion.span>
                    ))}
                  </div>
                )}
                <p className="text-sm leading-relaxed">{state.text}</p>
                {state.tip && (
                  <p className="flex items-start gap-1.5 text-xs text-muted-foreground italic">
                    <Lightbulb className="mt-px size-3.5 shrink-0 text-amber-500" aria-hidden="true" />
                    {state.tip}
                  </p>
                )}
              </motion.div>
            )}

            {state.kind === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-sm text-destructive">
                  Could not generate commentary.
                </p>
                {onRetry && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onRetry}
                    className="gap-1.5"
                  >
                    <RefreshCw className="size-3.5" aria-hidden="true" />
                    Try again
                  </Button>
                )}
              </motion.div>
            )}

            {state.kind === "unconfigured" && (
              <motion.p
                key="unconfigured"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                AI commentary requires a Gemini API key to be set on the server.
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            Evaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {status === "loading" && (
              <motion.p
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Loading Stockfish engine…
              </motion.p>
            )}

            {status === "error" && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                <p className="text-sm text-destructive">
                  {errorMessage ?? "Engine failed to load"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {errorMessage?.includes("Worker did not respond") || errorMessage?.includes("failed to load")
                    ? "If using Brave, try turning Shields off for this site (click the lion icon in the URL bar)."
                    : "Try refreshing the page."}
                </p>
              </motion.div>
            )}

            {status === "ready" && !score && !isThinking && (
              <motion.p
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Waiting for position…
              </motion.p>
            )}

            {status === "ready" && isThinking && !score && (
              <motion.p
                key="thinking-no-score"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Search className="size-3.5 animate-pulse" aria-hidden="true" />
                Analysing…
              </motion.p>
            )}

            {status === "ready" && score && (
              <motion.div
                key="score"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums tracking-tight">
                    {formatEval(score)}
                  </span>
                  {isThinking && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Search className="size-3 animate-pulse" aria-hidden="true" />
                      searching
                    </span>
                  )}
                </div>
              </motion.div>
            )}

            {status === "idle" && (
              <motion.p
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Engine not available
              </motion.p>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Flag className="size-4 text-primary" aria-hidden="true" />
            Game Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <p className="flex items-center gap-2 text-sm font-medium">
              {status.kind === "check" && <Swords className="size-4 text-destructive" aria-hidden="true" />}
              {label}
            </p>
            {details && (
              <p className="text-sm text-muted-foreground">{details}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
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

