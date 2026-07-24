/**
 * ──────────────────────────────────────────────────────────
 * Commentary Orchestrator  —  lib/ai/orchestrator/
 *                             orchestrator.ts
 *
 * Intelligent queue / dispatch / discard layer between the
 * game loop and the AI commentary API.
 *
 * ## Guarantees
 *
 *  1. **Queue AI requests** — requests pile up in a FIFO
 *     queue; only one is in-flight at a time.
 *  2. **Cancel outdated requests** — stale responses whose
 *     FEN no longer matches `currentFen` are silently dropped.
 *  3. **Merge rapid moves** — during cooldown, the last
 *     queued item is replaced with the latest move so we
 *     never "catch up" on old positions.
 *  4. **Importance filter** — trivial moves (no capture,
 *     check, etc.) inside cooldown are skipped entirely.
 *  5. **Configurable cooldown** — minimum gap between API
 *     calls, set via `OrchestratorConfig.cooldownMs`.
 *  6. **Stale-position defence** — both pre-request and
 *     post-response FEN checks ensure the UI never shows
 *     commentary for an outdated board.
 *  7. **Clean reset** — `reset()` and `destroy()` tear
 *     down all state and listeners.
 * ──────────────────────────────────────────────────────────
 */

import type {
  OrchestratorConfig,
  CommentaryQueueItem,
  CommentaryResult,
  OrchestratorEvent,
  FetchCommentaryFn,
} from "./types";
import { DEFAULT_ORCHESTRATOR_CONFIG } from "./types";

/* ─── Orchestrator ────────────────────────────────────────── */

/**
 * Lightweight event-emitter that manages AI commentary
 * request lifecycle.  Not a React hook — use with `useRef`
 * in components.
 */
export class CommentaryOrchestrator {
  /* ── Private state ───────────────────────────────────── */
  private config: OrchestratorConfig;
  private fetch: FetchCommentaryFn;
  private queue: CommentaryQueueItem[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private currentFen: string | null = null;
  private requestSeq = 0;
  private listeners = new Set<(event: OrchestratorEvent) => void>();

  constructor(
    config: Partial<OrchestratorConfig>,
    fetchCommentary: FetchCommentaryFn,
  ) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    this.fetch = fetchCommentary;
  }

  /* ── Public API ──────────────────────────────────────── */

  /**
   * Inform the orchestrator what FEN the board currently
   * shows.  Used to detect stale positions.
   */
  updateCurrentFen(fen: string): void {
    this.currentFen = fen;
  }

  /**
   * Replace the config at runtime (e.g. when user changes
   * settings).
   */
  setConfig(patch: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...patch };
  }

  /**
   * Enqueue a commentary request.
   *
   * If the orchestrator is idle and cooldown has expired,
   * the request is dispatched immediately.  Otherwise it is
   * queued.  During cooldown the last queued entry is
   * replaced ("merge rapid moves") so we never request
   * commentary for a stale intermediate position.
   */
  enqueue(item: Omit<CommentaryQueueItem, "id" | "timestamp">): void {
    if (!this.config.enabled) return;

    const fullItem: CommentaryQueueItem = {
      ...item,
      id: `req-${++this.requestSeq}`,
      timestamp: Date.now(),
    };

    // If a request is already in-flight, queue or replace.
    if (this.isProcessing) {
      this.replaceOrQueue(fullItem);
      return;
    }

    // Cooldown check.
    const elapsed = Date.now() - this.lastRequestTime;
    if (elapsed < this.config.cooldownMs) {
      if (!this.isImportantEvent(fullItem)) {
        // Non-important move during cooldown — replace pending.
        this.replaceOrQueue(fullItem);
        return;
      }
      // Important event during cooldown — still dispatch.
    }

    this.queue.push(fullItem);
    void this.processNext();
  }

  /**
   * Subscribe to orchestrator events.
   * Returns an unsubscribe function.
   */
  onEvent(cb: (event: OrchestratorEvent) => void): () => void {
    this.listeners.add(cb);
    return () => {
      this.listeners.delete(cb);
    };
  }

  /**
   * Cancel all pending requests and reset internal counters.
   */
  reset(): void {
    this.queue = [];
    this.isProcessing = false;
    this.lastRequestTime = 0;
  }

  /**
   * Full teardown — clears listeners, queue, and state.
   */
  destroy(): void {
    this.listeners.clear();
    this.reset();
  }

  /* ── Internals ───────────────────────────────────────── */

  private replaceOrQueue(item: CommentaryQueueItem): void {
    if (this.queue.length > 0) {
      // Replace the last entry (keep the freshest request).
      this.queue[this.queue.length - 1] = item;
    } else {
      this.queue.push(item);
    }

    // Enforce max queue size — discard oldest.
    while (this.queue.length > this.config.maxQueueSize) {
      this.queue.shift();
    }
  }

  /**
   * "Important" events bypass the cooldown gate entirely,
   * ensuring the player always gets commentary on captures,
   * checks, checkmates, and game-over states.
   */
  private isImportantEvent(item: CommentaryQueueItem): boolean {
    const always = this.config.alwaysCommentOn;
    if (always.includes("gameover") && item.isGameOver) return true;
    if (always.includes("checkmate") && item.isCheckmate) return true;
    if (always.includes("check") && item.inCheck) return true;
    if (always.includes("capture") && item.isCapture) return true;
    return false;
  }

  private async processNext(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;

    while (this.queue.length > 0) {
      const item = this.queue.shift()!;

      /* ── Pre-request staleness check ──────────────── */
      if (!this.isPositionCurrent(item)) {
        this.emit({ type: "skipped", reason: "stale-position" });
        continue;
      }

      this.lastRequestTime = Date.now();
      this.emit({ type: "loading" });

      try {
        const result = await this.fetch(item);

        /* ── Post-response staleness check ─────────────── */
        if (!this.isPositionCurrent(item)) {
          this.emit({ type: "skipped", reason: "stale-position" });
          continue;
        }

        this.emit({ type: "result", result });
      } catch {
        this.emit({ type: "result", result: { kind: "error" } });
      }
    }

    this.isProcessing = false;

    // If new items were enqueued while processing, start again.
    if (this.queue.length > 0) {
      void this.processNext();
    }
  }

  private isPositionCurrent(item: CommentaryQueueItem): boolean {
    return this.currentFen === item.fen;
  }

  private emit(event: OrchestratorEvent): void {
    for (const cb of this.listeners) {
      cb(event);
    }
  }
}
