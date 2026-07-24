/**
 * ──────────────────────────────────────────────────────────
 * Chess Clock  —  lib/chess/clock.ts
 *
 * Time control definitions, timer state management, and
 * display formatting.
 * ──────────────────────────────────────────────────────────
 */

/* ─── Types ──────────────────────────────────────────────── */

export interface TimeControl {
  initial: number;   // ms (use Infinity for unlimited)
  increment: number; // ms per move
  name: string;
  label: string;
}

export interface TimerState {
  whiteTime: number;   // ms remaining
  blackTime: number;
  active: "w" | "b" | null;
  increment: number;   // ms
  started: boolean;
}

/* ─── Time Control Presets ───────────────────────────────── */

export const TIME_CONTROLS: Record<string, TimeControl> = {
  unlimited: { initial: Infinity, increment: 0, name: "unlimited", label: "Unlimited" },
  "bullet-1": { initial: 60_000, increment: 0, name: "bullet-1", label: "Bullet (1+0)" },
  "bullet-2": { initial: 120_000, increment: 1_000, name: "bullet-2", label: "Bullet (2+1)" },
  "blitz-3": { initial: 180_000, increment: 0, name: "blitz-3", label: "Blitz (3+0)" },
  "blitz-3-2": { initial: 180_000, increment: 2_000, name: "blitz-3-2", label: "Blitz (3+2)" },
  "blitz-5": { initial: 300_000, increment: 0, name: "blitz-5", label: "Blitz (5+0)" },
  "rapid-10": { initial: 600_000, increment: 0, name: "rapid-10", label: "Rapid (10+0)" },
  "rapid-10-5": { initial: 600_000, increment: 5_000, name: "rapid-10-5", label: "Rapid (10+5)" },
  "rapid-15-10": { initial: 900_000, increment: 10_000, name: "rapid-15-10", label: "Rapid (15+10)" },
  "classical-30": { initial: 1_800_000, increment: 0, name: "classical-30", label: "Classical (30+0)" },
  "classical-30-20": { initial: 1_800_000, increment: 20_000, name: "classical-30-20", label: "Classical (30+20)" },
  "classical-60": { initial: 3_600_000, increment: 0, name: "classical-60", label: "Classical (60+0)" },
};

export const TIME_CONTROL_GROUPS = [
  { label: "Unlimited", controls: ["unlimited"] },
  { label: "Bullet", controls: ["bullet-1", "bullet-2"] },
  { label: "Blitz", controls: ["blitz-3", "blitz-3-2", "blitz-5"] },
  { label: "Rapid", controls: ["rapid-10", "rapid-10-5", "rapid-15-10"] },
  { label: "Classical", controls: ["classical-30", "classical-30-20", "classical-60"] },
] as const;

/* ─── Timer Functions ────────────────────────────────────── */

/**
 * Create a fresh timer state from a time control.
 */
export function createTimerState(tc: TimeControl): TimerState {
  return {
    whiteTime: tc.initial,
    blackTime: tc.initial,
    active: null,
    increment: tc.increment,
    started: false,
  };
}

/**
 * Apply increment to the active player's remaining time.
 */
export function applyIncrement(state: TimerState): TimerState {
  if (state.active === "w") {
    return { ...state, whiteTime: state.whiteTime + state.increment };
  }
  if (state.active === "b") {
    return { ...state, blackTime: state.blackTime + state.increment };
  }
  return state;
}

/**
 * Format ms into display strings.
 * Returns { main, tenths? } — tenths shown only when < 10s remain.
 */
export function formatTimeDisplay(
  timeMs: number,
): { main: string; tenths?: string } {
  if (!isFinite(timeMs)) {
    return { main: "∞" };
  }

  const totalSeconds = Math.floor(timeMs / 1000);
  const tenths = Math.floor((timeMs % 1000) / 100);

  if (totalSeconds >= 3600) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return { main: `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` };
  }

  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  const main = `${m}:${String(s).padStart(2, "0")}`;

  if (totalSeconds < 10) {
    return { main, tenths: String(tenths) };
  }

  return { main };
}

/**
 * Detect if a player has run out of time.
 * Returns "w" (White lost on time), "b" (Black lost), or null.
 */
export function detectTimeout(state: TimerState): "w" | "b" | null {
  if (state.whiteTime <= 0) return "w";
  if (state.blackTime <= 0) return "b";
  return null;
}

/**
 * Get presets grouped for the UI.
 */
export function getTimeControlPresets() {
  return TIME_CONTROL_GROUPS.map((group) => ({
    label: group.label,
    options: group.controls.map((key) => TIME_CONTROLS[key]),
  }));
}
