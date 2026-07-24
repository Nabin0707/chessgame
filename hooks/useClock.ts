/**
 * ──────────────────────────────────────────────────────────
 * useClock  —  hooks/useClock.ts
 *
 * React hook for chess clock timer management.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useRef, useCallback, useState } from "react";
import type { TimeControl, TimerState } from "@/lib/chess/clock";
import {
  createTimerState,
  applyIncrement,
  detectTimeout,
} from "@/lib/chess/clock";

export interface UseClockReturn {
  timerState: TimerState;
  start: () => void;
  pause: () => void;
  resume: () => void;
  switchTurn: () => "w" | "b" | null;
  reset: (tc?: TimeControl) => void;
  setTimeControl: (tc: TimeControl) => void;
  isPaused: boolean;
}

export function useClock(initialTimeControl: TimeControl): UseClockReturn {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    createTimerState(initialTimeControl),
  );
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  const stateRef = useRef(timerState);
  const pausedRef = useRef(false);

  // Keep ref in sync
  stateRef.current = timerState;

  const stopInterval = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startInterval = useCallback(() => {
    stopInterval();
    lastTickRef.current = Date.now();

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastTickRef.current;
      lastTickRef.current = now;

      setTimerState((prev) => {
        if (!prev.active || pausedRef.current) return prev;

        const deduction = prev.active === "w"
          ? { whiteTime: Math.max(0, prev.whiteTime - elapsed) }
          : { blackTime: Math.max(0, prev.blackTime - elapsed) };

        return { ...prev, ...deduction };
      });
    }, 100); // tick every 100ms for smooth display
  }, [stopInterval]);

  const start = useCallback(() => {
    setIsPaused(false);
    pausedRef.current = false;
    setTimerState((prev) => ({
      ...prev,
      active: "w",
      started: true,
    }));
    startInterval();
  }, [startInterval]);

  const pause = useCallback(() => {
    setIsPaused(true);
    pausedRef.current = true;
    stopInterval();
  }, [stopInterval]);

  const resume = useCallback(() => {
    if (!pausedRef.current) return;
    setIsPaused(false);
    pausedRef.current = false;
    lastTickRef.current = Date.now();
    startInterval();
  }, [startInterval]);

  /**
   * Switch active player.  Applies increment, checks timeout.
   * Returns the timed-out player ("w" | "b") or null.
   */
  const switchTurn = useCallback((): "w" | "b" | null => {
    // Apply increment to the player who just moved
    setTimerState((prev) => {
      const incremented = applyIncrement(prev);
      const nextActive = incremented.active === "w" ? "b" : "w";
      return { ...incremented, active: nextActive };
    });

    // Check timeout after increment
    // (use a short delay so state settles)
    setTimeout(() => {
      setTimerState((prev) => {
        const timeout = detectTimeout(prev);
        if (timeout) {
          stopInterval();
        }
        return prev;
      });
    }, 50);

    return null;
  }, [stopInterval]);

  const reset = useCallback(
    (tc?: TimeControl) => {
      stopInterval();
      setIsPaused(false);
      pausedRef.current = false;
      setTimerState(createTimerState(tc ?? initialTimeControl));
    },
    [initialTimeControl, stopInterval],
  );

  const setTimeControl = useCallback(
    (tc: TimeControl) => {
      stopInterval();
      setIsPaused(false);
      pausedRef.current = false;
      setTimerState(createTimerState(tc));
    },
    [stopInterval],
  );

  return {
    timerState,
    start,
    pause,
    resume,
    switchTurn,
    reset,
    setTimeControl,
    isPaused,
  };
}
