"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";

import { ChessHeader } from "@/components/chess/chess-header";
import { ChessSidebar } from "@/components/chess/chess-sidebar";
import { ChessBoardContainer } from "@/components/chess/chess-board-container";
import { ChessInfoPanel } from "@/components/chess/chess-info-panel";
import { ChessFooter } from "@/components/chess/chess-footer";

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
  const engineMoveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ── Commentary state ────────────────────────────────────────────── */

  const [commentaryState, setCommentaryState] = useState<CommentaryState>({
    kind: "idle",
  });

  /* ── Generate commentary via API ─────────────────────────────────── */

  const commentaryFenRef = useRef<string | null>(null);

  const generateCommentary = useCallback(async () => {
    const currentFen = getFen(gameRef.current);
    const currentHistory = getMoveHistory(gameRef.current);
    const currentStatus = getGameStatus(gameRef.current);
    const lastRecord = currentHistory[currentHistory.length - 1];

    if (!lastRecord) {
      console.log("[COMMENTARY] no last move, skipping");
      return;
    }

    const payload = {
      fen: currentFen,
      lastMove: lastRecord.san,
      moveNumber: Math.ceil(currentHistory.length / 2),
      playerColor: currentStatus.turn === "w" ? "b" : "w",
      moveHistory: currentHistory,
      evalScore: null,
      evalDepth: 18,
      gamePhase: deriveGamePhase(currentHistory.length),
      inCheck:
        currentStatus.kind === "check" ||
        ("inCheck" in currentStatus && currentStatus.inCheck),
      isGameOver:
        currentStatus.kind === "checkmate" ||
        currentStatus.kind === "stalemate" ||
        currentStatus.kind === "draw",
    };

    console.log("[COMMENTARY] sending request:", JSON.stringify(payload, null, 2));

    setCommentaryState({ kind: "loading" });
    commentaryFenRef.current = currentFen;

    try {
      const res = await fetch("/api/ai/commentary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log("[COMMENTARY] response status:", res.status, res.statusText);

      const data = await res.json();
      console.log("[COMMENTARY] response body:", JSON.stringify(data, null, 2));

      if (data.success) {
        console.log("[COMMENTARY] success:", data.commentary?.slice(0, 80));
        setCommentaryState({
          kind: "success",
          text: data.commentary,
          reactions: data.reactions ?? [],
          tip: data.tip,
        });
      } else if (
        data.fallback ===
        "AI commentary is not configured. Keep playing!"
      ) {
        console.log("[COMMENTARY] unconfigured — no API key set on server");
        setCommentaryState({ kind: "unconfigured" });
      } else {
        console.log("[COMMENTARY] fallback:", data.fallback, "error:", data.error);
        if (data.debug) console.log("[COMMENTARY] raw debug text:", data.debug);
        setCommentaryState({ kind: "error" });
      }
    } catch (err) {
      console.error("[COMMENTARY] fetch failed:", err);
      setCommentaryState({ kind: "error" });
    }
  }, []);

  /* ── Derive game phase from move count ───────────────────────────── */

  function deriveGamePhase(moveCount: number): string {
    if (moveCount <= 10) return "opening";
    if (moveCount <= 40) return "midgame";
    return "endgame";
  }

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

          // Only clear the waiting flags when the move is actually applied.
          // If the move fails (e.g. a stale bestmove from the cancelled
          // display evaluation arrives for the wrong turn), keep waiting
          // for the real engine response.
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

    // If the user already moved before the engine was ready (e.g. during
    // initialization), trigger the opponent search now that we're ready.
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

      // Generate AI commentary after the player's move
      generateCommentary();

      return true;
    },
    [triggerEngineMove, generateCommentary],
  );

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
    <div className="flex min-h-screen flex-col">
      <ChessHeader />

      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-4 p-4 lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 lg:p-6">
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
          onRetryCommentary={generateCommentary}
        />
      </div>

      <ChessFooter />
    </div>
  );
}
