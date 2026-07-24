"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

import { ChessSidebar } from "@/components/chess/chess-sidebar";
import { ChessBoardContainer } from "@/components/chess/chess-board-container";
import { ChessInfoPanel } from "@/components/chess/chess-info-panel";

import { CommentaryOrchestrator } from "@/lib/ai/orchestrator/orchestrator";
import type { CommentaryResult } from "@/lib/ai/orchestrator/types";
import { getPersonalitySetting } from "@/lib/ai/personalities/settings";

import type { CommentaryState } from "@/components/chess/chess-info-panel";

import {
  createGame,
  resetGame,
  makeMove,
  undoMove,
  getFen,
  getMoveHistory,
  getGameStatus,
} from "@/lib/chess/game";

import { createEngine } from "@/lib/engine/stockfish";

import type { GameInstance } from "@/lib/chess/game";
import type { Engine } from "@/lib/engine/stockfish";
import type { EvalScore } from "@/types/engine";

export function ChessWorkspace() {
  /* ── Game state ──────────────────────────────────────────────────── */

  const gameRef = useRef<GameInstance>(createGame());
  const [revision, setRevision] = useState(0);

  const fen = useMemo(() => getFen(gameRef.current), [revision]);
  const moveHistory = useMemo(
    () => getMoveHistory(gameRef.current),
    [revision],
  );
  const gameStatus = useMemo(
    () => getGameStatus(gameRef.current),
    [revision],
  );

  /* ── Derive UI state from game status ────────────────────────────── */

  const isGameOver =
    gameStatus.kind === "checkmate" ||
    gameStatus.kind === "stalemate" ||
    gameStatus.kind === "draw";

  /* ── Engine state (display evaluation) ───────────────────────────── */

  const engineRef = useRef<Engine | null>(null);
  const [engineStatus, setEngineStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);
  const [evalIsThinking, setEvalIsThinking] = useState(false);
  const [engineErrorMessage, setEngineErrorMessage] = useState<
    string | null
  >(null);

  /* ── Opponent engine state ───────────────────────────────────────── */

  const [isAwaitingEngineMove, setIsAwaitingEngineMove] = useState(false);
  const pendingEngineMoveRef = useRef(false);

  /* ── Commentary orchestrator ─────────────────────────────────────── */

  const orchestratorRef = useRef<CommentaryOrchestrator | null>(null);
  const [commentaryState, setCommentaryState] = useState<CommentaryState>({
    kind: "idle",
  });

  /* ── Derive game phase from move count ───────────────────────────── */

  function deriveGamePhase(moveCount: number): string {
    if (moveCount <= 10) return "opening";
    if (moveCount <= 40) return "midgame";
    return "endgame";
  }

  /* ── Initialize orchestrator once ────────────────────────────────── */

  useEffect(() => {
    const fetchFn = async (
      item: import("@/lib/ai/orchestrator/types").CommentaryQueueItem,
    ): Promise<CommentaryResult> => {
      console.log("[ORCHESTRATOR] fetching commentary for move:", item.lastMove);

      try {
        const res = await fetch("/api/ai/commentary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        const data = await res.json();

        if (data.success) {
          return {
            kind: "success",
            text: data.commentary,
            reactions: data.reactions ?? [],
            tip: data.tip,
          };
        }

        if (
          data.fallback ===
          "AI commentary is not configured. Keep playing!"
        ) {
          return { kind: "unconfigured" };
        }

        return { kind: "error" };
      } catch {
        return { kind: "error" };
      }
    };

    const orchestrator = new CommentaryOrchestrator(
      { cooldownMs: 2_000 },
      fetchFn,
    );

    const unsub = orchestrator.onEvent((event) => {
      switch (event.type) {
        case "loading":
          setCommentaryState({ kind: "loading" });
          break;
        case "result": {
          const r = event.result;
          if (r.kind === "success") {
            setCommentaryState({
              kind: "success",
              text: r.text,
              reactions: r.reactions,
              tip: r.tip,
            });
          } else if (r.kind === "unconfigured") {
            setCommentaryState({ kind: "unconfigured" });
          } else {
            setCommentaryState({ kind: "error" });
          }
          break;
        }
        case "skipped":
          // Silently discard — position moved on.
          break;
      }
    });

    orchestratorRef.current = orchestrator;

    return () => {
      unsub();
      orchestrator.destroy();
      orchestratorRef.current = null;
    };
  }, []);

  const boardDisabled = isAwaitingEngineMove || isGameOver;

  /* ── Initialize engine once on mount ─────────────────────────────── */

  useEffect(() => {
    const engine = createEngine();
    engineRef.current = engine;

    setEngineStatus("loading");

    engine
      .initialize()
      .then(() => {
        setEngineStatus("ready");
      })
      .catch((err: Error) => {
        setEngineStatus("error");
        setEngineErrorMessage(err.message);
      });

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  /* ── Trigger opponent move ───────────────────────────────────────── */

  const triggerEngineMove = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || engineStatus !== "ready") {
      pendingEngineMoveRef.current = false;
      setIsAwaitingEngineMove(false);
      return;
    }

    const currentFen = getFen(gameRef.current);
    console.log(
      "[OPPONENT] requesting best move for:",
      currentFen.slice(0, 50) + "…",
    );

    engine.getBestMove(currentFen, {
      onBestMove: (move: string) => {
        const statusBefore = getGameStatus(gameRef.current);
        console.log(
          "[OPPONENT onBestMove] received move:", move,
          "game turn:", "turn" in statusBefore ? statusBefore.turn : "unknown",
        );

        if (move === "(none)") {
          console.log("[OPPONENT] move is (none), clearing flags");
          pendingEngineMoveRef.current = false;
          setIsAwaitingEngineMove(false);
          return;
        }

        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const promotion = move.length > 4 ? move.slice(4, 5) : undefined;

        console.log("[OPPONENT] trying makeMove:", from, "→", to, "promotion:", promotion);

        const result = makeMove(gameRef.current, from, to, promotion);
        console.log("[OPPONENT] makeMove result:", result.success ? "SUCCESS" : "FAILED", result.error || "");

        if (result.success) {
          setRevision((r) => r + 1);

          pendingEngineMoveRef.current = false;
          setIsAwaitingEngineMove(false);
          console.log("[OPPONENT] move applied, flags cleared");
        } else {
          console.log("[OPPONENT] move FAILED, keeping flags set — waiting for real bestmove");
        }
      },
      onError: (error: string) => {
        console.warn("Engine opponent move failed:", error);
        pendingEngineMoveRef.current = false;
        setIsAwaitingEngineMove(false);
      },
    }, { depth: 10 });
  }, [engineStatus]);

  /* ── After engine initializes, trigger opponent if needed ──────────── */

  useEffect(() => {
    if (engineStatus !== "ready") return;

    const status = getGameStatus(gameRef.current);
    if (status.turn === "b" && (status.kind === "playing" || status.kind === "check")) {
      console.log("[ENGINE_READY] engine became ready — triggering opponent move (user moved early)");
      pendingEngineMoveRef.current = true;
      triggerEngineMove();
    } else {
      console.log("[ENGINE_READY] engine ready, turn is:", status.turn);
    }
  }, [engineStatus, triggerEngineMove]);

  /* ── Handle user moves ───────────────────────────────────────────── */

  const handleMove = useCallback(
    (from: string, to: string): boolean => {
      console.log("[HANDLE MOVE] called:", from, "→", to, "engineStatus:", engineStatus, "pending:", pendingEngineMoveRef.current);
      if (pendingEngineMoveRef.current) return false;

      const result = makeMove(gameRef.current, from, to);
      if (!result.success) return false;

      pendingEngineMoveRef.current = true;
      setRevision((r) => r + 1);

      const status = getGameStatus(gameRef.current);
      const isActive =
        status.kind === "playing" || status.kind === "check";

      if (isActive) {
        setIsAwaitingEngineMove(true);
        triggerEngineMove();
      } else {
        pendingEngineMoveRef.current = false;
      }

      /* ── Enqueue commentary via orchestrator ─────────── */

      const orchestrator = orchestratorRef.current;
      const currentFen = getFen(gameRef.current);
      const currentHistory = getMoveHistory(gameRef.current);
      const lastRecord = currentHistory[currentHistory.length - 1];
      const inCheck =
        status.kind === "check" ||
        ("inCheck" in status && status.inCheck);
      const isGameOver =
        status.kind === "checkmate" ||
        status.kind === "stalemate" ||
        status.kind === "draw";
      const isCapture = !!lastRecord?.captured;
      const isCheckmate = status.kind === "checkmate";

      // Update orchestrator so it can discard stale responses.
      orchestrator?.updateCurrentFen(currentFen);

      // Enqueue the request (orchestrator handles cooldown, merging, etc.)
      orchestrator?.enqueue({
        fen: currentFen,
        lastMove: lastRecord?.san ?? "",
        moveNumber: Math.ceil(currentHistory.length / 2),
        playerColor: status.turn === "w" ? "b" : "w",
        moveHistory: currentHistory,
        evalScore: null,
        evalDepth: 18,
        gamePhase: deriveGamePhase(currentHistory.length),
        inCheck,
        isGameOver,
        isCapture,
        isCheckmate,
        personalityId: getPersonalitySetting(),
        timestamp: Date.now(),
      });

      return true;
    },
    [triggerEngineMove, engineStatus],
  );

  /* ── Legal move helper for board highlighting ─────────────────────── */

  const getLegalMovesForSquare = useCallback((square: string): string[] => {
    try {
      const moves = gameRef.current.moves({ square: square as any, verbose: true });
      return moves.map((m) => m.to);
    } catch {
      return [];
    }
  }, []);

  /* ── Handle new game ─────────────────────────────────────────────── */

  const handleNewGame = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    engineRef.current?.stop();
    engineRef.current?.stop();

    pendingEngineMoveRef.current = false;
    setIsAwaitingEngineMove(false);
    setEvalScore(null);
    setEvalIsThinking(false);

    gameRef.current = resetGame();
    setRevision((r) => r + 1);

    // Reset orchestrator and clear commentary.
    orchestratorRef.current?.reset();
    orchestratorRef.current?.updateCurrentFen(getFen(gameRef.current));
    setCommentaryState({ kind: "idle" });
  }, []);

  /* ── Handle undo ─────────────────────────────────────────────────── */

  const handleUndo = useCallback(() => {
    if (isAwaitingEngineMove) return;

    if (undoMove(gameRef.current)) {
      setRevision((r) => r + 1);

      const status = getGameStatus(gameRef.current);
      if (
        (status.kind === "playing" || status.kind === "check") &&
        status.turn === "b"
      ) {
        pendingEngineMoveRef.current = true;
        setIsAwaitingEngineMove(true);
        triggerEngineMove();
      }

      // Clear commentary after undo since position changed.
      setCommentaryState({ kind: "idle" });
    }
  }, [isAwaitingEngineMove, triggerEngineMove]);

  /* ── Display evaluation (debounced) ──────────────────────────────── */

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pendingEngineMoveRef.current) return;

    const engine = engineRef.current;
    if (!engine || engineStatus !== "ready") return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    engine.stop();

    debounceRef.current = setTimeout(() => {
      setEvalScore(null);
      setEvalIsThinking(true);

      engine.evaluate(fen, {
        onEval: (score: EvalScore) => {
          setEvalScore(score);
          setEvalIsThinking(false);
        },
        onBestMove: () => {
          setEvalIsThinking(false);
        },
      });
    }, 400);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      if (!pendingEngineMoveRef.current) {
        engine.stop();
      }
      setEvalIsThinking(false);
    };
  }, [fen, engineStatus]);

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 lg:p-6"
    >
      <ChessSidebar
        className="hidden lg:flex"
        moveHistory={moveHistory}
        gameStatus={gameStatus}
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        isAwaitingEngineMove={isAwaitingEngineMove}
      />

      <ChessBoardContainer
        fen={fen}
        onMove={handleMove}
        disabled={boardDisabled}
        getLegalMovesForSquare={getLegalMovesForSquare}
      />

      <ChessInfoPanel
        className="hidden lg:flex"
        gameStatus={gameStatus}
        evalScore={evalScore}
        evalIsThinking={evalIsThinking}
        engineStatus={engineStatus}
        engineErrorMessage={engineErrorMessage}
        isAwaitingEngineMove={isAwaitingEngineMove}
        commentaryState={commentaryState}
        onRetryCommentary={() => {
          /* Orchestrator handles retry via next enqueue */
        }}
      />
    </motion.div>
  );
}
