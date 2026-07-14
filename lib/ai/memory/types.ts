/**
 * ──────────────────────────────────────────────────────────
 * Memory Types  —  lib/ai/memory/types.ts
 *
 * Interfaces for the AI memory system.  Memory tracks
 * conversation context (recent exchanges with Gemini),
 * game context (moves + evaluations in the current game),
 * and player profile (aggregated across sessions).
 *
 * # Memory Flow
 *
 *   Player makes a move
 *        ↓
 *   Move recorded in GameMemory
 *        ↓
 *   Engine evaluates → stored in GameMemory.evaluations
 *        ↓
 *   Commentary generated → stored in GameMemory.commentaries
 *        ↓
 *   Player chats → stored in ConversationMemory
 *        ↓
 *   On next prompt, Memory Builder slices:
 *     - Last N conversation messages  (for chat continuity)
 *     - Last M game moves             (for positional awareness)
 *     - Key evaluation swings         (for dramatic context)
 *     - Player stats summary          (for personalised advice)
 *        ↓
 *   Memory slices injected into Prompt Builder
 * ──────────────────────────────────────────────────────────
 */

import type {
  AIMessage,
  CommentRecord,
  MoveRecord,
  PlayerStats,
} from "@/lib/ai/types";

/* ─── Conversation Memory ────────────────────────────── */

/** A single conversation session with the AI. */
export interface ConversationMemory {
  /** Unique session identifier. */
  sessionId: string;
  /** Messages in chronological order. */
  messages: AIMessage[];
  /** Timestamp of the first message. */
  createdAt: number;
  /** Timestamp of the most recent message. */
  updatedAt: number;
  /** Total messages in this session. */
  messageCount: number;
}

/** Configuration for conversation memory behaviour. */
export interface ConversationMemoryConfig {
  /** Maximum messages retained in a session (oldest dropped). */
  maxMessages: number;
  /** Maximum age of a memory before it's archived (milliseconds). */
  maxAgeMs: number;
  /** Whether conversation also stores system messages. */
  storeSystemMessages: boolean;
}

/* ─── Game Memory ────────────────────────────────────── */

/** Records the complete history of the current game session. */
export interface GameMemory {
  /** Unique game identifier. */
  gameId: string;
  /** Opening played (ECO code if known). */
  opening?: string;
  /** Moves in chronological order. */
  moves: MoveRecord[];
  /** Engine evaluations recorded during the game. */
  evaluations: Array<{
    moveNumber: number;
    before: {
      score: number;
      depth: number;
    };
    after: {
      score: number;
      depth: number;
    };
    delta: number;
    phase: string;
  }>;
  /** Commentaries generated during the game. */
  commentaries: CommentRecord[];
  /** Key moments identified (large eval swings, blunders, brilliancies). */
  keyMoments: Array<{
    moveNumber: number;
    type: string;
    description: string;
    centipawnDelta: number;
  }>;
  /** Timestamp when the game started. */
  startedAt: number;
  /** Timestamp when the game ended (if applicable). */
  endedAt?: number;
}

/* ─── Player Memory ──────────────────────────────────── */

/** Persistent player profile accumulated across games. */
export interface PlayerMemory {
  /** Locally-generated player ID. */
  playerId: string;
  /** Preferred commentary level. */
  experience: string;
  /** Preferred personality ID. */
  preferredPersonalityId?: string;
  /** Statistics aggregated across all played games. */
  stats: PlayerStats;
  /** Recent game memories (last N games). */
  recentGames: GameMemory[];
  /** Timestamp of first recorded game. */
  firstGameAt?: number;
  /** Total games played. */
  totalGames: number;
}

/* ─── Memory Slice (for Prompt Injection) ────────────── */

/**
 * A curated slice of memory injected into the prompt.
 * The Memory Builder selects the most relevant subset
 * of available memory for each commentary request.
 */
export interface MemorySlice {
  /** Recent conversation exchanges (last N). */
  recentConversation: AIMessage[];
  /** Recent game moves (last M). */
  recentMoves: MoveRecord[];
  /** Key moments that stand out in the game. */
  keyMoments: GameMemory["keyMoments"];
  /** Player statistics summary. */
  playerStats?: Partial<PlayerStats>;
  /** A brief summary of the game so far (if applicable). */
  gameSummary?: string;
}
