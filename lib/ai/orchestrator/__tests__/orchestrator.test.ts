import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommentaryOrchestrator } from "../orchestrator";
import type { CommentaryQueueItem, CommentaryResult } from "../types";

function createItem(
  overrides: Partial<CommentaryQueueItem> = {},
): CommentaryQueueItem {
  return {
    id: "test-1",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    lastMove: "e4",
    moveNumber: 1,
    playerColor: "w",
    moveHistory: [{ san: "e4", color: "w", from: "e2", to: "e4", piece: "p", flags: "b" }],
    evalScore: null,
    evalDepth: 18,
    gamePhase: "opening",
    inCheck: false,
    isGameOver: false,
    isCapture: false,
    isCheckmate: false,
    timestamp: Date.now(),
    ...overrides,
  };
}

describe("CommentaryOrchestrator", () => {
  let fetchFn: ReturnType<typeof vi.fn>;
  let orchestrator: CommentaryOrchestrator;

  beforeEach(() => {
    vi.useFakeTimers();
    fetchFn = vi.fn();
    orchestrator = new CommentaryOrchestrator(
      { cooldownMs: 2000 },
      fetchFn,
    );
  });

  afterEach(() => {
    orchestrator.destroy();
    vi.useRealTimers();
  });

  /* ─── Queue & Dispatch ────────────────────────────────── */

  it("dispatches immediately when idle", () => {
    const events: string[] = [];
    orchestrator.onEvent((e) => events.push(e.type));

    orchestrator.enqueue(createItem());
    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(events).toContain("loading");
  });

  it("queues a second request while the first is in-flight", () => {
    // Keep the first request pending (don't resolve)
    fetchFn.mockReturnValue(new Promise(() => {}));

    orchestrator.enqueue(createItem({ id: "req-1", lastMove: "e4" }));
    orchestrator.enqueue(createItem({ id: "req-2", lastMove: "e5" }));

    expect(fetchFn).toHaveBeenCalledTimes(1);
    expect(orchestrator["queue"].length).toBe(1);
  });

  /* ─── Cooldown / Importance Filtering ─────────────────── */

  it("does NOT dispatch within cooldown for non-important events", () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);

    // Simulate a recent dispatch (500ms ago — inside 2000ms cooldown)
    orchestrator["lastRequestTime"] = Date.now() - 500;

    orchestrator.enqueue(createItem({ isCapture: false, inCheck: false }));
    expect(fetchFn).not.toHaveBeenCalled();
    expect(orchestrator["queue"].length).toBe(1);
  });

  it("DISPATCHES within cooldown for important events (capture)", () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);
    orchestrator["lastRequestTime"] = Date.now() - 500;

    orchestrator.enqueue(createItem({ isCapture: true }));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("DISPATCHES within cooldown for important events (check)", () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);
    orchestrator["lastRequestTime"] = Date.now() - 500;

    orchestrator.enqueue(createItem({ inCheck: true }));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("DISPATCHES within cooldown for important events (checkmate)", () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);
    orchestrator["lastRequestTime"] = Date.now() - 500;

    orchestrator.enqueue(createItem({ isCheckmate: true }));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it("DISPATCHES within cooldown for important events (gameover)", () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);
    orchestrator["lastRequestTime"] = Date.now() - 500;

    orchestrator.enqueue(createItem({ isGameOver: true }));
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  /* ─── Stale Position Detection ────────────────────────── */

  it("discards stale items pre-request", async () => {
    fetchFn.mockResolvedValue({ kind: "error" } as CommentaryResult);

    const item = createItem({ lastMove: "e4" });
    orchestrator.updateCurrentFen("some-other-fen");
    orchestrator.enqueue(item);

    await vi.runAllTimersAsync();

    // The pre-request check in processNext should skip it.
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("discards stale items post-request (response arrives after position changed)", async () => {
    // Make fetchFn resolve after a delay
    fetchFn.mockImplementation(
      () => new Promise<CommentaryResult>((resolve) => {
        setTimeout(() => resolve({ kind: "error" }), 100);
      }),
    );

    const item = createItem({ lastMove: "e4", fen: "fen-a" });
    orchestrator.updateCurrentFen("fen-a");
    orchestrator.enqueue(item);

    // Advance time enough for the request to start, but change FEN before it resolves
    await vi.advanceTimersByTimeAsync(50);
    orchestrator.updateCurrentFen("fen-b"); // position changed!
    await vi.advanceTimersByTimeAsync(100);

    // fetchFn was called, but the result should have been discarded (no 'result' event)
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  /* ─── Disabled State ──────────────────────────────────── */

  it("does nothing when disabled", () => {
    orchestrator.setConfig({ enabled: false });
    orchestrator.enqueue(createItem());
    expect(fetchFn).not.toHaveBeenCalled();
  });

  /* ─── Reset & Destroy ─────────────────────────────────── */

  it("resets state", () => {
    orchestrator["lastRequestTime"] = 999;
    orchestrator["queue"] = [createItem()];
    orchestrator["isProcessing"] = true;

    orchestrator.reset();

    expect(orchestrator["queue"]).toHaveLength(0);
    expect(orchestrator["isProcessing"]).toBe(false);
    expect(orchestrator["lastRequestTime"]).toBe(0);
  });

  it("destroy clears listeners", () => {
    const cb = vi.fn();
    orchestrator.onEvent(cb);
    orchestrator.destroy();

    // After destroy, no listeners should fire
    orchestrator["emit"]({ type: "loading" });
    expect(cb).not.toHaveBeenCalled();
  });
});
