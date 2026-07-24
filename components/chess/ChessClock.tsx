/**
 * ──────────────────────────────────────────────────────────
 * ChessClock  —  components/chess/ChessClock.tsx
 *
 * Chess clock panel with dual timers, time control presets,
 * pause/resume, and timeout display.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  Clock,
  Pause,
  Play,
} from "lucide-react";

import type { TimeControl, TimerState } from "@/lib/chess/clock";
import { formatTimeDisplay, TIME_CONTROLS, TIME_CONTROL_GROUPS } from "@/lib/chess/clock";

/* ─── Props ──────────────────────────────────────────────── */

interface ChessClockProps {
  className?: string;
  timerState: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  isPaused: boolean;
  onTimeControlChange: (tc: TimeControl) => void;
  /** The game is over — clock stops */
  gameOver?: boolean;
}

/* ─── Component ──────────────────────────────────────────── */

export function ChessClock({
  className,
  timerState,
  onStart,
  onPause,
  onResume,
  isPaused,
  onTimeControlChange,
  gameOver = false,
}: ChessClockProps) {
  const timeControlName = useMemo(() => {
    for (const [key, tc] of Object.entries(TIME_CONTROLS)) {
      if (
        tc.initial === timerState.increment
          ? timerState.whiteTime + timerState.increment
          : timerState.whiteTime === tc.initial
      ) {
        // Find matching control by initial and increment
        if (
          tc.initial === timerState.whiteTime &&
          tc.increment === timerState.increment
        ) {
          return key;
        }
      }
    }
    // Fallback: find by increment
    for (const [key, tc] of Object.entries(TIME_CONTROLS)) {
      if (tc.increment === timerState.increment) return key;
    }
    return "unlimited";
  }, [timerState]);

  const whiteDisplay = formatTimeDisplay(timerState.whiteTime);
  const blackDisplay = formatTimeDisplay(timerState.blackTime);
  const whiteLow = timerState.whiteTime < 30_000 && timerState.whiteTime > 0;
  const blackLow = timerState.blackTime < 30_000 && timerState.blackTime > 0;
  const whiteTimeout = timerState.whiteTime <= 0;
  const blackTimeout = timerState.blackTime <= 0;
  const canStart = !timerState.started && !gameOver;

  /* ── Preset selection ─────────────────────────────────── */

  const handlePresetChange = useCallback(
    (value: string) => {
      const tc = TIME_CONTROLS[value];
      if (tc) onTimeControlChange(tc);
    },
    [onTimeControlChange],
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="size-4 text-primary" aria-hidden="true" />
            Chess Clock
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Time control selector */}
          <Select value={timeControlName} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue placeholder="Time control" />
            </SelectTrigger>
            <SelectContent>
              {TIME_CONTROL_GROUPS.map((group) => (
                <SelectGroup key={group.label}>
                  <SelectLabel className="text-[10px]">{group.label}</SelectLabel>
                  {group.controls.map((key) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {TIME_CONTROLS[key].label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>

          {/* Timer displays */}
          <div className="space-y-2">
            {/* Black timer (top) */}
            <TimerDisplay
              label="Black"
              display={blackDisplay}
              active={timerState.active === "b"}
              low={blackLow}
              timeout={blackTimeout}
            />

            {/* White timer (bottom) */}
            <TimerDisplay
              label="White"
              display={whiteDisplay}
              active={timerState.active === "w"}
              low={whiteLow}
              timeout={whiteTimeout}
            />
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {canStart ? (
              <Button
                variant="default"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={onStart}
              >
                <Play className="size-3" />
                Start
              </Button>
            ) : isPaused ? (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={onResume}
              >
                <Play className="size-3" />
                Resume
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={onPause}
                disabled={gameOver || !timerState.started}
              >
                <Pause className="size-3" />
                Pause
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── TimerDisplay ───────────────────────────────────────── */

function TimerDisplay({
  label,
  display,
  active,
  low,
  timeout,
}: {
  label: string;
  display: { main: string; tenths?: string };
  active: boolean;
  low: boolean;
  timeout: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-md border px-3 py-2 transition-colors",
        active && "border-primary/50 bg-primary/5",
        timeout && "border-red-500 bg-red-500/10",
      )}
    >
      <div className="flex items-center gap-2">
        {active && (
          <motion.span
            className="size-2 rounded-full bg-primary"
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex items-baseline gap-0.5">
        <span
          className={cn(
            "font-mono text-lg font-bold tabular-nums",
            low && "text-red-500",
            timeout && "text-red-600",
          )}
        >
          {timeout ? "0:00" : display.main}
        </span>
        {display.tenths && !timeout && (
          <span className="font-mono text-xs tabular-nums text-muted-foreground">
            .{display.tenths}
          </span>
        )}
      </div>
    </div>
  );
}
