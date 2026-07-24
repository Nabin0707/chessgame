/**
 * ──────────────────────────────────────────────────────────
 * Notation  —  lib/chess/notation.ts
 *
 * PGN and FEN utilities: export, import, copy-to-clipboard,
 * and file download helpers.
 * ──────────────────────────────────────────────────────────
 */

import { Chess } from "chess.js";
import type { GameInstance } from "@/lib/chess/game";

/* ─── PGN ────────────────────────────────────────────────── */

/**
 * Export current position as PGN string.
 */
export function exportPgn(game: GameInstance): string {
  return game.pgn();
}

/**
 * Import a PGN string and return a new GameInstance.
 * Throws if the PGN is invalid.
 */
export function importPgn(pgn: string): GameInstance {
  const game = new Chess();
  game.loadPgn(pgn);
  return game as unknown as GameInstance;
}

/* ─── FEN ────────────────────────────────────────────────── */

/**
 * Export current position as FEN string.
 */
export function exportFen(game: GameInstance): string {
  return game.fen();
}

/**
 * Import a FEN string and return a new GameInstance.
 * Throws if the FEN is invalid.
 */
export function importFen(fen: string): GameInstance {
  const game = new Chess(fen);
  return game as unknown as GameInstance;
}

/* ─── Clipboard ──────────────────────────────────────────── */

/**
 * Copy text to clipboard.  Returns `true` on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers / non-HTTPS contexts
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/* ─── File Download ──────────────────────────────────────── */

/**
 * Trigger a file download from a string.
 */
export function downloadText(text: string, filename: string): void {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download game as PGN file.
 */
export function downloadPgn(pgn: string, filename = "chess-game.pgn"): void {
  downloadText(pgn, filename);
}

/**
 * Download position as FEN file.
 */
export function downloadFen(fen: string, filename = "chess-position.fen"): void {
  downloadText(fen, filename);
}
