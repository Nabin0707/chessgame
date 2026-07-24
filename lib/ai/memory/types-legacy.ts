/**
 * ──────────────────────────────────────────────────────────
 * Memory Types (Legacy)  —  lib/ai/memory/types-legacy.ts
 *
 * Interfaces from the M7 AI Foundation Architecture for
 * conversation, game, and player memory.
 *
 * Kept for backward compatibility. M14 player memory types
 * live in types.ts.
 * ──────────────────────────────────────────────────────────
 */

import type {
  AIMessage,
  CommentRecord,
  MoveRecord,
  PlayerStats,
} from "@/lib/ai/types";

/* ─── Conversation Memory ────────────────────────────── */

export interface ConversationMemory {
  sessionId: string;
  messages: AIMessage[];
  createdAt: number;
  updatedAt: number;
  messageCount: number;
}

export interface ConversationMemoryConfig {
  maxMessages: number;
  maxAgeMs: number;
  storeSystemMessages: boolean;
}

/* ─── Game Memory ────────────────────────────────────── */

export interface GameMemory {
  gameId: string;
  opening?: string;
  moves: MoveRecord[];
  evaluations: Array<{
    moveNumber: number;
    before: { score: number; depth: number };
    after: { score: number; depth: number };
    delta: number;
    phase: string;
  }>;
  commentaries: CommentRecord[];
  keyMoments: Array<{
    moveNumber: number;
    type: string;
    description: string;
    centipawnDelta: number;
  }>;
  startedAt: number;
  endedAt?: number;
}

/* ─── Player Memory ──────────────────────────────────── */

export interface PlayerMemory {
  playerId: string;
  experience: string;
  preferredPersonalityId?: string;
  stats: PlayerStats;
  recentGames: GameMemory[];
  firstGameAt?: number;
  totalGames: number;
}

/* ─── Memory Slice ────────────────────────────────────── */

export interface MemorySlice {
  recentConversation: AIMessage[];
  recentMoves: MoveRecord[];
  keyMoments: GameMemory["keyMoments"];
  playerStats?: Partial<PlayerStats>;
  gameSummary?: string;
}
