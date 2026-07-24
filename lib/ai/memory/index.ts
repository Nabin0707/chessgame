/**
 * ──────────────────────────────────────────────────────────
 * Memory Module  —  lib/ai/memory/index.ts
 *
 * Barrel exports for the player memory & adaptive commentary
 * module. Also re-exports legacy memory types.
 * ──────────────────────────────────────────────────────────
 */

// Legacy types (from M7)
export type {
  ConversationMemory,
  ConversationMemoryConfig,
  GameMemory,
  MemorySlice,
  PlayerMemory,
} from "./types-legacy";

// Types (M14 — player memory)
export type {
  GameOutcome,
  PlayStyle,
  GameRecord,
  PlayerStatistics,
  PlayerProfile,
  MemoryData,
  MemoryContext,
} from "./types";

// Storage
export {
  loadMemory,
  saveMemory,
  exportMemoryJson,
  importMemoryJson,
  resetMemory,
} from "./storage";

// Statistics
export {
  computeProfile,
  determineLevel,
  detectPlayStyle,
  findFavouriteOpening,
  findBiggestWeakness,
  findBiggestStrength,
  findRecurringMistake,
  computeWinStreak,
  computeLossStreak,
  computeLongestWinStreak,
  computeLongestLossStreak,
  estimateAccuracy,
  EMPTY_MEMORY,
} from "./statistics";

// Tracker
export {
  recordGame,
  recordStyleEvent,
  detectOpeningFromHistory,
} from "./tracker";

// Engine
export {
  getProfile,
  buildMemoryContext,
} from "./memory-engine";
