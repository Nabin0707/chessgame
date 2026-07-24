/**
 * ──────────────────────────────────────────────────────────
 * Sound  —  lib/chess/sound.ts
 *
 * Web Audio API sound engine for chess events.
 * Generates tones programmatically — no audio files needed.
 * ──────────────────────────────────────────────────────────
 */

export type SoundType =
  | "move"
  | "capture"
  | "castle"
  | "promotion"
  | "check"
  | "checkmate"
  | "draw"
  | "game-start";

export interface SoundEngine {
  play: (type: SoundType) => void;
  setMuted: (muted: boolean) => void;
  toggle: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

/* ─── Audio context helpers ──────────────────────────────── */

const STORAGE_KEY = "chess-sound-muted";

function getStoredMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

function storeMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, String(muted));
}

function playTone(
  ctx: AudioContext,
  freq: number,
  duration: number,
  startTime: number,
  type: OscillatorType = "sine",
  volume = 0.08,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(volume, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration);
}

/* ─── Sound patterns ─────────────────────────────────────── */

function applySoundPattern(
  ctx: AudioContext,
  type: SoundType,
): void {
  const now = ctx.currentTime;
  const vol = 0.10;

  switch (type) {
    case "move":
      playTone(ctx, 600, 0.10, now, "sine", vol);
      break;

    case "capture":
      playTone(ctx, 400, 0.10, now, "triangle", vol);
      playTone(ctx, 300, 0.12, now + 0.08, "triangle", vol * 0.8);
      break;

    case "castle":
      playTone(ctx, 500, 0.08, now, "sine", vol);
      playTone(ctx, 700, 0.10, now + 0.10, "sine", vol);
      break;

    case "promotion":
      playTone(ctx, 800, 0.08, now, "sine", vol);
      playTone(ctx, 1000, 0.08, now + 0.08, "sine", vol);
      playTone(ctx, 1200, 0.12, now + 0.16, "sine", vol);
      break;

    case "check":
      playTone(ctx, 700, 0.08, now, "square", vol * 0.5);
      playTone(ctx, 500, 0.08, now + 0.12, "square", vol * 0.5);
      playTone(ctx, 700, 0.08, now + 0.24, "square", vol * 0.5);
      break;

    case "checkmate":
      playTone(ctx, 400, 0.15, now, "sawtooth", vol * 0.3);
      playTone(ctx, 300, 0.20, now + 0.15, "sawtooth", vol * 0.3);
      playTone(ctx, 200, 0.30, now + 0.35, "sawtooth", vol * 0.3);
      break;

    case "draw":
      playTone(ctx, 400, 0.15, now, "sine", vol);
      playTone(ctx, 400, 0.15, now + 0.20, "sine", vol * 0.7);
      break;

    case "game-start":
      playTone(ctx, 500, 0.08, now, "sine", vol);
      playTone(ctx, 600, 0.08, now + 0.10, "sine", vol);
      playTone(ctx, 800, 0.12, now + 0.20, "sine", vol);
      break;
  }
}

/* ─── Engine factory ─────────────────────────────────────── */

export function createSoundEngine(): SoundEngine {
  let ctx: AudioContext | null = null;
  let muted = getStoredMuted();

  function getContext(): AudioContext {
    if (!ctx) {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => { /* noop */ });
    }
    return ctx;
  }

  return {
    play(type: SoundType) {
      if (muted) return;
      try {
        const context = getContext();
        applySoundPattern(context, type);
      } catch {
        // Audio not available — silently ignore
      }
    },

    setMuted(m: boolean) {
      muted = m;
      storeMuted(m);
    },

    toggle() {
      muted = !muted;
      storeMuted(muted);
    },

    isMuted() {
      return muted;
    },

    destroy() {
      if (ctx) {
        ctx.close().catch(() => { /* noop */ });
        ctx = null;
      }
    },
  };
}
