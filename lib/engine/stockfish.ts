import type { EvalScore, EngineCallbacks, SearchOptions } from "@/types/engine";

/**
 * ─── UCI Reference ──────────────────────────────────────────────────────
 *
 * Commands sent to Stockfish:
 *   uci                 – Initiate UCI mode (engine replies "uciok")
 *   isready             – Check readiness (engine replies "readyok")
 *   position fen <FEN>  – Set up a position from a FEN string
 *   position startpos   – Set up the starting position
 *     [moves <...>]     –   followed by a space-separated list of moves
 *   go depth <N>        – Search to depth N (1 – 99)
 *   go movetime <N>     – Search for N milliseconds
 *   stop                – Stop the current search immediately
 *
 * Output lines parsed from Stockfish:
 *   info ... score cp <centipawns> ...  – Position scored in centipawns
 *   info ... score mate <moves> ...     – Forced mate in N moves
 *   info ... pv <move> ...              – Principal variation (best line)
 *   bestmove <move> [ponder <move>]     – Best move (and ponder response)
 *   readyok                             – Engine is ready
 *   uciok                               – Engine entered UCI mode
 * ────────────────────────────────────────────────────────────────────────
 */

/*
 * Debug logging control — set to true to trace every UCI command and
 * engine response in the browser console.
 */
const ENGINE_LOG = true;

let stepCounter = 0;

function logStep(dir: "→" | "←", msg: string): void {
  if (!ENGINE_LOG) return;
  stepCounter++;
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[ENGINE ${dir}] ${ts} #${stepCounter} ${msg}`);
}

/**
 * URL of the Stockfish Web Worker script provided by the stockfish
 * npm package (nmrugg/stockfish.js).  This file IS the worker — it
 * speaks raw UCI over the Worker postMessage / onmessage channel.
 */
const WORKER_URL = "/stockfish/stockfish.js";

/**
 * High-level API for communicating with Stockfish via a Web Worker.
 *
 * Usage:
 *   const engine = createEngine();
 *   await engine.initialize();
 *   engine.evaluate(fen, { onEval: (s) => updateUI(s) });
 *   engine.dispose();
 */
export function createEngine() {
  let worker: Worker | null = null;
  let isReady = false;
  let currentCallbacks: EngineCallbacks | null = null;

  /* ── Single permanent message handler ────────────────────────────────
   * Every line from the Worker passes through here. We dispatch to the
   * currently active callbacks so that previous searches don't accumulate
   * stale listeners.                                                   */

  function handleMessage(event: MessageEvent): void {
    const line = String(event.data);

    if (line.startsWith("bestmove")) {
      logStep("←", `bestmove: ${line}`);
    } else if (line.startsWith("info")) {
      if (line.includes("score cp") || line.includes("score mate")) {
        logStep("←", `${line.slice(0, 100)}`);
      }
    } else {
      logStep("←", line);
    }

    if (!currentCallbacks) {
      logStep("←", `(dropped — no active callbacks)`);
      return; // nobody listening right now
    }

    // Evaluation score (centipawns): "info ... score cp 45 ..."
    const cpMatch = line.match(/score cp (-?\d+)/);
    if (cpMatch && currentCallbacks.onEval) {
      currentCallbacks.onEval({
        type: "cp",
        value: parseInt(cpMatch[1], 10),
      });
      logStep("←", `→ onEval(cp ${cpMatch[1]})`);
      return;
    }

    // Evaluation score (mate): "info ... score mate 3"
    const mateMatch = line.match(/score mate (-?\d+)/);
    if (mateMatch && currentCallbacks.onEval) {
      currentCallbacks.onEval({
        type: "mate",
        value: parseInt(mateMatch[1], 10),
      });
      logStep("←", `→ onEval(mate ${mateMatch[1]})`);
      return;
    }

    // Best move: "bestmove e2e4" or "bestmove e2e4 ponder d7d5"
    const bmMatch = line.match(/^bestmove (\S+)/);
    if (bmMatch && currentCallbacks.onBestMove) {
      logStep("←", `→ onBestMove("${bmMatch[1]}")`);
      currentCallbacks.onBestMove(bmMatch[1]);
      return;
    }
  }

  /* ── Spawn the Worker (lazy, on first use) ────────────────────────── */

  function ensureWorker(): Worker {
    if (worker) return worker;

    logStep("→", `new Worker("${WORKER_URL}")`);
    worker = new Worker(WORKER_URL);

    worker.addEventListener("message", handleMessage);

    // Catch Worker-level errors that might not show up elsewhere
    worker.addEventListener("error", (ev) => {
      logStep("←", `WORKER 'error' EVENT: ${ev.message}`);
    });

    // Catch unhandled rejections inside the Worker
    worker.addEventListener("messageerror", (ev) => {
      logStep("←", `WORKER 'messageerror' EVENT`);
    });

    return worker;
  }

  /* ── Public API ───────────────────────────────────────────────────── */

  /**
   * Send `uci` and wait for `uciok`.
   * Must be called before any other commands.
   */
  function initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const w = ensureWorker();

      // First, test if the Worker is alive by sending a special message
      // that stockfish.js responds to immediately, even before init.
      // If we get "info WillOutputEngineDownloadProgress", the Worker is alive.
      let workerResponded = false;

      const initHandler = (event: MessageEvent) => {
        const line = String(event.data);

        // Liveness check: the Worker responds to this immediately
        if (line === "info WillOutputEngineDownloadProgress") {
          workerResponded = true;
          logStep("←", "← Worker is ALIVE (download progress check)");
          return;
        }

        if (line === "uciok") {
          w.removeEventListener("message", initHandler);
          isReady = true;
          logStep("←", "← resolve(initialize) — engine ready");
          resolve();
        }
      };

      w.addEventListener("message", initHandler);
      w.addEventListener("error", (err) => {
        w.removeEventListener("message", initHandler);
        logStep("←", `WORKER ERROR EVENT: ${err.message}`);
        reject(new Error(err.message || "Stockfish Worker failed to load"));
      });

      // Send liveness test message
      logStep("→", 'setoption name CanOutputEngineDownloadProgress');
      w.postMessage("setoption name CanOutputEngineDownloadProgress");

      // Small delay then send uci
      setTimeout(() => {
        logStep("→", "uci");
        w.postMessage("uci");
      }, 100);

      // Intermediate diagnostic at 15s
      setTimeout(() => {
        logStep("←", `INTERMEDIATE (15s) — workerResponded=${workerResponded} isReady=${isReady}`);
      }, 15000);

      // Safety timeout — 30 seconds
      setTimeout(() => {
        w.removeEventListener("message", initHandler);
        if (!isReady) {
          logStep("←", `TIMEOUT — no uciok after 30s (workerResponded=${workerResponded})`);
          reject(new Error("Stockfish initialization timed out — " + (workerResponded ? "Worker alive but engine not ready. If using Brave, try turning Shields off." : "Worker did not respond at all. Check that /stockfish/stockfish.wasm is accessible.")));
        }
      }, 30000);
    });
  }

  /**
   * Set a position and start evaluating.
   * Callbacks receive incremental evaluation updates and the final best move.
   *
   * If a previous search is still running it is stopped first.
   */
  function evaluate(
    fen: string,
    callbacks: EngineCallbacks,
    options: SearchOptions = {},
  ): void {
    const w = ensureWorker();

    const depth = options.depth ?? 18;
    logStep(
      "→",
      `evaluate() depth=${depth}${options.movetime ? ` movetime=${options.movetime}` : ""} hasOnBestMove=${!!callbacks.onBestMove} hasOnEval=${!!callbacks.onEval}`,
    );

    // Stop any running search
    stop();

    // Replace callbacks so stale results are ignored
    currentCallbacks = callbacks;

    // Set position
    const shortFen = fen.length > 60 ? fen.slice(0, 60) + "…" : fen;
    logStep("→", `position fen ${shortFen}`);
    w.postMessage(`position fen ${fen}`);

    // Start search
    if (options.movetime) {
      logStep("→", `go movetime ${options.movetime}`);
      w.postMessage(`go movetime ${options.movetime}`);
    } else {
      logStep("→", `go depth ${depth}`);
      w.postMessage(`go depth ${depth}`);
    }
  }

  /**
   * Request the best move for a position.
   * Identical to evaluate() but focused on getting the best line.
   */
  function getBestMove(
    fen: string,
    callbacks: EngineCallbacks,
    options: SearchOptions = {},
  ): void {
    evaluate(fen, callbacks, options);
  }

  /** Stop the current search. */
  function stop(): void {
    logStep("→", "stop");
    if (worker) {
      worker.postMessage("stop");
    }
    currentCallbacks = null;
  }

  /** Terminate the Worker and free resources. */
  function dispose(): void {
    logStep("→", "dispose()");
    stop();
    if (worker) {
      worker.terminate();
      worker = null;
    }
    isReady = false;
    currentCallbacks = null;
  }

  /** Check if the engine has completed initialization. */
  function ready(): boolean {
    return isReady;
  }

  return {
    initialize,
    evaluate,
    getBestMove,
    stop,
    dispose,
    ready,
  };
}

export type Engine = ReturnType<typeof createEngine>;
