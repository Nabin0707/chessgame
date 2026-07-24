/**
 * ──────────────────────────────────────────────────────────
 * Memory Storage  —  lib/ai/memory/storage.ts
 *
 * localStorage persistence for player memory data.
 * Handles serialisation, import, export, and reset.
 * ──────────────────────────────────────────────────────────
 */

import type { MemoryData } from "./types";
import { EMPTY_MEMORY } from "./statistics";

/* ─── Storage Key ──────────────────────────────────────── */

const STORAGE_KEY = "chess-player-memory";

/* ─── Read / Write ─────────────────────────────────────── */

export function loadMemory(): MemoryData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...EMPTY_MEMORY };
    const parsed: unknown = JSON.parse(raw);
    if (isValidMemoryData(parsed)) return parsed;
    return { ...EMPTY_MEMORY };
  } catch {
    return { ...EMPTY_MEMORY };
  }
}

export function saveMemory(data: MemoryData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/* ─── Export / Import / Reset ──────────────────────────── */

export function exportMemoryJson(): string {
  const data = loadMemory();
  return JSON.stringify(data, null, 2);
}

export function importMemoryJson(json: string): boolean {
  try {
    const parsed: unknown = JSON.parse(json);
    if (!isValidMemoryData(parsed)) return false;
    saveMemory(parsed);
    return true;
  } catch {
    return false;
  }
}

export function resetMemory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently ignore
  }
}

/* ─── Validation ───────────────────────────────────────── */

function isValidMemoryData(value: unknown): value is MemoryData {
  if (!value || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.version !== "number") return false;
  if (!obj.stats || typeof obj.stats !== "object") return false;
  if (!Array.isArray(obj.recentGames)) return false;
  return true;
}
