"use client";

import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

import { ChessSidebar } from "@/components/chess/chess-sidebar";
import { ChessBoardContainer } from "@/components/chess/chess-board-container";
import { ChessInfoPanel } from "@/components/chess/chess-info-panel";

import { CommentaryOrchestrator } from "@/lib/ai/orchestrator/orchestrator";
import type { CommentaryResult } from "@/lib/ai/orchestrator/types";
import { getPersonalitySetting } from "@/lib/ai/personalities/settings";
import {
  loadMemory,
  saveMemory,
  recordGame,
  buildMemoryContext,
  detectOpeningFromHistory,
} from "@/lib/ai/memory";

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
import { createSoundEngine } from "@/lib/chess/sound";
import { useClock } from "@/hooks/useClock";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { TIME_CONTROLS } from "@/lib/chess/clock";

import type { GameInstance } from "@/lib/chess/game";
import type { Engine } from "@/lib/engine/stockfish";
import type { EvalScore, AnalysisData } from "@/types/engine";
import type { MoveRecord, GameStatus } from "@/types/chess";

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

  /* ── Board orientation (flip) ────────────────────────────────────── */

  const [boardOrientation, setBoardOrientation] = useState<"white" | "black">("white");

  const handleFlipBoard = useCallback(() => {
    setBoardOrientation((prev) => (prev === "white" ? "black" : "white"));
  }, []);

  /* ── Sound engine ────────────────────────────────────────────────── */

  const soundEngineRef = useRef(createSoundEngine());

  /* ── Clock ───────────────────────────────────────────────────────── */

  const {
    timerState,
    start: clockStart,
    pause: clockPause,
    resume: clockResume,
    switchTurn: clockSwitchTurn,
    reset: clockReset,
    setTimeControl,
    isPaused: clockIsPaused,
  } = useClock(TIME_CONTROLS["unlimited"]);

  /* ── Engine state (display evaluation) ───────────────────────────── */

  const engineRef = useRef<Engine | null>(null);
  const [engineStatus, setEngineStatus] = useState<
    "idle" | "loading" | "ready" | "error"
  >("idle");
  const [evalScore, setEvalScore] = useState<EvalScore | null>(null);
  const [evalIsThinking, setEvalIsThinking] = useState(false);
  const [engineErrorMessage, setEngineErrorMessage] = useState<string | null>(null);

  /* ── Analysis data (depth, nodes, speed, bestMove) ──────────────── */

  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [bestMove, setBestMove] = useState<string | null>(null);

  /* ── Opponent engine state ───────────────────────────────────────── */

  const [isAwaitingEngineMove, setIsAwaitingEngineMove] = useState(false);
  const pendingEngineMoveRef = useRef(false);

  /* ── Game tracking (prevents double-recording in memory) ──────────── */

  const gameRecordedRef = useRef(false);

  /* ── Game-over result from resign / draw ─────────────────────────── */

  const [gameOverMessage, setGameOverMessage] = useState<string | null>(null);

  /* ── Record game outcome when it ends ────────────────────────────── */

  useEffect(() => {
    if (isGameOver && !gameRecordedRef.current) {
      gameRecordedRef.current = true;
      const memory = loadMemory();
      const history = getMoveHistory(gameRef.current);
      const movesSan = history.map((m) => m.san).join(" ");
      const opening = detectOpeningFromHistory(movesSan);

      let outcome: "win" | "loss" | "draw" = "draw";
      if (gameStatus.kind === "checkmate") {
        outcome = gameStatus.winner === "w" ? "win" : "loss";
      }

      const updated = recordGame(memory, {
        outcome,
        opening,
        totalMoves: history.length,
        playerColor: "w",
        blunders: 0,
        mistakes: 0,
        inaccuracies: 0,
        queenLost: false,
        castled: false,
        earlyQueenMove: false,
        avgPawnPushDistance: 0,
      });
      saveMemory(updated);
    }
    if (!isGameOver) {
      gameRecordedRef.current = false;
    }
  }, [isGameOver, gameStatus]);

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

  /* ── Find king square for check highlight ────────────────────────── */

  const checkSquare = useMemo<string | null>(() => {
    if (gameStatus.kind !== "check") return null;
    const board = gameRef.current.board();
    const turn = gameStatus.turn;
    for (const row of board) {
      for (const sq of row) {
        if (sq && sq.type === "k" && sq.color === turn) {
          return sq.square as string;
        }
      }
    }
    return null;
  }, [gameStatus]);

  /* ── Initialize orchestrator once ────────────────────────────────── */

  useEffect(() => {
    const fetchFn = async (
      item: import("@/lib/ai/orchestrator/types").CommentaryQueueItem,
    ): Promise<CommentaryResult> => {
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

    engine.getBestMove(currentFen, {
      onBestMove: (move: string) => {

        if (move === "(none)") {
          pendingEngineMoveRef.current = false;
          setIsAwaitingEngineMove(false);
          return;
        }

        const from = move.slice(0, 2);
        const to = move.slice(2, 4);
        const promotion = move.length > 4 ? move.slice(4, 5) : undefined;

        const result = makeMove(gameRef.current, from, to, promotion);

        if (result.success) {
          setRevision((r) => r + 1);

          // Play sound for engine move
          const lastMoves = getMoveHistory(gameRef.current);
          const last = lastMoves[lastMoves.length - 1];
          const status = getGameStatus(gameRef.current);
          playSoundForMove(last, status, soundEngineRef.current);

          clockSwitchTurn();

          pendingEngineMoveRef.current = false;
          setIsAwaitingEngineMove(false);
        } else {
          // Keep waiting for the real bestmove
        }
      },
      onError: (error: string) => {
        console.warn("Engine opponent move failed:", error);
        pendingEngineMoveRef.current = false;
        setIsAwaitingEngineMove(false);
      },
    }, { depth: 10 });
  }, [engineStatus, clockSwitchTurn]);

  /* ── After engine initializes, trigger opponent if needed ──────────── */

  useEffect(() => {
    if (engineStatus !== "ready") return;

    const status = getGameStatus(gameRef.current);
    if ((status.kind === "playing" || status.kind === "check") && status.turn === "b") {
      pendingEngineMoveRef.current = true;
      triggerEngineMove();
    }
  }, [engineStatus, triggerEngineMove]);

  /* ── Sound helper ───────────────────────────────────────────────── */

  function playSoundForMove(
    move: MoveRecord | undefined,
    status: GameStatus,
    engine: ReturnType<typeof createSoundEngine>,
  ): void {
    if (!move) return;

    const flags = move.flags;

    if (status.kind === "checkmate") {
      engine.play("checkmate");
    } else if (status.kind === "check") {
      engine.play("check");
    } else if (status.kind === "draw") {
      engine.play("draw");
    } else if (flags.includes("p")) {
      engine.play("promotion");
    } else if (flags.includes("k") || flags.includes("q")) {
      engine.play("castle");
    } else if (flags.includes("c") || flags.includes("e")) {
      engine.play("capture");
    } else {
      engine.play("move");
    }
  }

  /* ── Handle user moves ───────────────────────────────────────────── */

  const handleMove = useCallback(
    (from: string, to: string): boolean => {
      if (pendingEngineMoveRef.current) return false;

      const result = makeMove(gameRef.current, from, to);
      if (!result.success) return false;

      pendingEngineMoveRef.current = true;
      setRevision((r) => r + 1);

      // Start clock on first move
      if (!timerState.started) {
        clockStart();
      }

      // Play sound for this move
      const history = getMoveHistory(gameRef.current);
      const lastMove = history[history.length - 1];
      const currentStatus = getGameStatus(gameRef.current);
      playSoundForMove(lastMove, currentStatus, soundEngineRef.current);

      // Switch clock turn
      clockSwitchTurn();

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
        ("inCheck" in status && (status as any).inCheck);
      const isGameOver =
        status.kind === "checkmate" ||
        status.kind === "stalemate" ||
        status.kind === "draw";
      const isCapture = !!lastRecord?.captured;
      const isCheckmate = status.kind === "checkmate";

      // Safe access to player color — use the original turn from before
      // the move if status doesn't carry it (game-over states).
      const playerColor =
        "turn" in status
          ? status.turn === "w"
            ? "b"
            : "w"
          : ("b" as const);

      orchestrator?.updateCurrentFen(currentFen);

      const memory = loadMemory();
      const memoryContext =
        memory.stats.gamesPlayed > 0
          ? buildMemoryContext(memory).summary
          : undefined;

      orchestrator?.enqueue({
        fen: currentFen,
        lastMove: lastRecord?.san ?? "",
        moveNumber: Math.ceil(currentHistory.length / 2),
        playerColor,
        moveHistory: currentHistory,
        evalScore: null,
        evalDepth: 18,
        gamePhase: deriveGamePhase(currentHistory.length),
        inCheck,
        isGameOver,
        isCapture,
        isCheckmate,
        personalityId: getPersonalitySetting(),
        memoryContext,
      });

      return true;
    },
    [triggerEngineMove, engineStatus, timerState.started, clockStart, clockSwitchTurn],
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

  /* ── Record game for resign/draw ─────────────────────────────────── */

  const recordGameEnd = useCallback((outcome: "win" | "loss" | "draw") => {
    if (gameRecordedRef.current) return;
    gameRecordedRef.current = true;
    const memory = loadMemory();
    const history = getMoveHistory(gameRef.current);
    const movesSan = history.map((m) => m.san).join(" ");
    const opening = detectOpeningFromHistory(movesSan);

    const updated = recordGame(memory, {
      outcome,
      opening,
      totalMoves: history.length,
      playerColor: "w",
      blunders: 0,
      mistakes: 0,
      inaccuracies: 0,
      queenLost: false,
      castled: false,
      earlyQueenMove: false,
      avgPawnPushDistance: 0,
    });
    saveMemory(updated);
  }, []);

  /* ── Handle resign ───────────────────────────────────────────────── */

  const handleResign = useCallback(() => {
    if (isGameOver) return;
    recordGameEnd("loss");
    gameRef.current = resetGame();
    setRevision((r) => r + 1);
    setEngineStatus("loading");
    clockReset();
    setGameOverMessage("You resigned. Black wins!");
    setCommentaryState({ kind: "idle" });
    soundEngineRef.current.play("checkmate");
    pendingEngineMoveRef.current = false;
    setIsAwaitingEngineMove(false);

    // Re-initialize engine
    engineRef.current
      ?.initialize()
      .then(() => setEngineStatus("ready"))
      .catch(() => setEngineStatus("error"));
  }, [isGameOver, recordGameEnd, clockReset]);

  /* ── Handle offer draw ───────────────────────────────────────────── */

  const handleOfferDraw = useCallback(() => {
    if (isGameOver) return;
    recordGameEnd("draw");
    gameRef.current = resetGame();
    setRevision((r) => r + 1);
    setEngineStatus("loading");
    clockReset();
    setGameOverMessage("Game drawn by agreement.");
    setCommentaryState({ kind: "idle" });
    soundEngineRef.current.play("draw");
    pendingEngineMoveRef.current = false;
    setIsAwaitingEngineMove(false);

    engineRef.current
      ?.initialize()
      .then(() => setEngineStatus("ready"))
      .catch(() => setEngineStatus("error"));
  }, [isGameOver, recordGameEnd, clockReset]);

  /* ── Handle import (PGN/FEN) ─────────────────────────────────────── */

  const handleImport = useCallback(
    (newGame: GameInstance) => {
      gameRef.current = newGame;
      setRevision((r) => r + 1);
      clockReset();
      setCommentaryState({ kind: "idle" });
      pendingEngineMoveRef.current = false;
      setIsAwaitingEngineMove(false);
      setGameOverMessage(null);
      setEvalScore(null);
      setEvalIsThinking(false);
      setAnalysisData(null);
      setBestMove(null);
      gameRecordedRef.current = false;
    },
    [clockReset],
  );

  /* ── Handle new game ─────────────────────────────────────────────── */

  const handleNewGame = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    engineRef.current?.stop();

    pendingEngineMoveRef.current = false;
    setIsAwaitingEngineMove(false);
    setEvalScore(null);
    setEvalIsThinking(false);
    setAnalysisData(null);
    setBestMove(null);
    setGameOverMessage(null);
    gameRecordedRef.current = false;

    gameRef.current = resetGame();
    setRevision((r) => r + 1);

    clockReset();
    setBoardOrientation("white");

    orchestratorRef.current?.reset();
    orchestratorRef.current?.updateCurrentFen(getFen(gameRef.current));
    setCommentaryState({ kind: "idle" });
    soundEngineRef.current.play("game-start");
  }, [clockReset]);

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

      setCommentaryState({ kind: "idle" });
    }
  }, [isAwaitingEngineMove, triggerEngineMove]);

  /* ── Keyboard shortcuts ──────────────────────────────────────────── */

  const shortcuts = useMemo(
    () => ({
      n: handleNewGame,
      u: handleUndo,
      f: handleFlipBoard,
      m: () => soundEngineRef.current.toggle(),
      r: handleResign,
    }),
    [handleNewGame, handleUndo, handleFlipBoard, handleResign],
  );
  useKeyboardShortcuts(shortcuts, !boardDisabled);

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
        onBestMove: (move: string) => {
          setEvalIsThinking(false);
          // Extract best move in algebraic notation from UCI
          setBestMove(move);
        },
        onAnalysis: (data: AnalysisData) => {
          setAnalysisData(data);
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

  /* ── Derive lastMove from history ──────────────────────────────── */

  const lastMove = useMemo(() => {
    if (moveHistory.length === 0) return null;
    const last = moveHistory[moveHistory.length - 1];
    return { from: last.from, to: last.to };
  }, [moveHistory]);

  /* ── Responsive visibility ────────────────────────────────────────── */

  const [mobilePanel, setMobilePanel] = useState<"sidebar" | "info" | null>(null);

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 p-4 lg:grid lg:grid-cols-[280px_1fr_280px] lg:gap-6 lg:p-6"
    >
      {/* Desktop sidebar */}
      <ChessSidebar
        className="hidden lg:flex"
        moveHistory={moveHistory}
        gameStatus={gameStatus}
        onNewGame={handleNewGame}
        onUndo={handleUndo}
        isAwaitingEngineMove={isAwaitingEngineMove}
        gameRef={gameRef}
        revision={revision}
        boardFlipped={boardOrientation === "black"}
        onFlipBoard={handleFlipBoard}
        onResign={handleResign}
        onOfferDraw={handleOfferDraw}
        timerState={timerState}
        onClockStart={clockStart}
        onClockPause={clockPause}
        onClockResume={clockResume}
        clockIsPaused={clockIsPaused}
        onTimeControlChange={setTimeControl}
        gameOver={isGameOver || !!gameOverMessage}
        onImport={handleImport}
        visible={true}
      />

      {/* Board + Mobile toggles */}
      <div className="flex flex-col items-center gap-3">
        {/* Mobile panel toggle buttons */}
        <div className="flex w-full gap-2 lg:hidden">
          <button
            onClick={() => setMobilePanel(mobilePanel === "sidebar" ? null : "sidebar")}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
          >
            {mobilePanel === "sidebar" ? "Hide Controls" : "Show Controls"}
          </button>
          <button
            onClick={() => setMobilePanel(mobilePanel === "info" ? null : "info")}
            className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium"
          >
            {mobilePanel === "info" ? "Hide Info" : "Show Info"}
          </button>
        </div>

        <ChessBoardContainer
          fen={fen}
          onMove={handleMove}
          disabled={boardDisabled}
          getLegalMovesForSquare={getLegalMovesForSquare}
          lastMove={lastMove}
          checkSquare={checkSquare}
          boardOrientation={boardOrientation}
        />

        {gameOverMessage && (
          <div className="rounded-lg bg-primary/10 px-4 py-2 text-center text-sm font-medium">
            {gameOverMessage}
          </div>
        )}
      </div>

      {/* Mobile panels */}
      {mobilePanel === "sidebar" && (
        <div className="lg:hidden">
          <ChessSidebar
            className=""
            moveHistory={moveHistory}
            gameStatus={gameStatus}
            onNewGame={handleNewGame}
            onUndo={handleUndo}
            isAwaitingEngineMove={isAwaitingEngineMove}
            gameRef={gameRef}
            revision={revision}
            boardFlipped={boardOrientation === "black"}
            onFlipBoard={handleFlipBoard}
            onResign={handleResign}
            onOfferDraw={handleOfferDraw}
            timerState={timerState}
            onClockStart={clockStart}
            onClockPause={clockPause}
            onClockResume={clockResume}
            clockIsPaused={clockIsPaused}
            onTimeControlChange={setTimeControl}
            gameOver={isGameOver || !!gameOverMessage}
            onImport={handleImport}
            visible={true}
          />
        </div>
      )}

      {mobilePanel === "info" && (
        <div className="lg:hidden">
          <ChessInfoPanel
            className=""
            gameStatus={gameStatus}
            evalScore={evalScore}
            evalIsThinking={evalIsThinking}
            engineStatus={engineStatus}
            engineErrorMessage={engineErrorMessage}
            isAwaitingEngineMove={isAwaitingEngineMove}
            commentaryState={commentaryState}
            onRetryCommentary={() => {}}
            analysisDepth={analysisData?.depth}
            analysisNodes={analysisData?.nodes}
            analysisSpeed={analysisData?.nps}
            analysisBestMove={bestMove ?? undefined}
            soundEngine={soundEngineRef.current}
            visible={true}
          />
        </div>
      )}

      {/* Desktop info panel */}
      <ChessInfoPanel
        className="hidden lg:flex"
        gameStatus={gameStatus}
        evalScore={evalScore}
        evalIsThinking={evalIsThinking}
        engineStatus={engineStatus}
        engineErrorMessage={engineErrorMessage}
        isAwaitingEngineMove={isAwaitingEngineMove}
        commentaryState={commentaryState}
        onRetryCommentary={() => {}}
        analysisDepth={analysisData?.depth}
        analysisNodes={analysisData?.nodes}
        analysisSpeed={analysisData?.nps}
        analysisBestMove={bestMove ?? undefined}
        soundEngine={soundEngineRef.current}
        visible={true}
      />
    </motion.div>
  );
}
