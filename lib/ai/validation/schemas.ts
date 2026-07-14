/**
 * ──────────────────────────────────────────────────────────
 * Response Schemas  —  lib/ai/validation/schemas.ts
 *
 * Zod schemas for validating Gemini response structure.
 * Ensures that parsed JSON responses contain all required
 * fields with correct types before reaching the UI.
 *
 * Schemas validate:
 *   - CommentResponse (commentary-after-move)
 *   - ChatResponse (chat-message)
 *   - GradeResult (embedded grade object)
 *   - PostGameSummary (post-game-summary)
 * ──────────────────────────────────────────────────────────
 */

import { z } from "zod";

/* ─── Helpers ─────────────────────────────────────────── */

/**
 * Safely parse a JSON string, returning a typed result
 * rather than throwing.
 */
export function safeParseJSON<T>(text: string): {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
} {
  try {
    const data = JSON.parse(text);
    return { success: true, data: data as T };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Invalid JSON",
    };
  }
}

/* ─── Reaction Type Enum ──────────────────────────────── */

const reactionTypeSchema = z.enum([
  "blunder",
  "mistake",
  "inaccuracy",
  "good",
  "excellent",
  "brilliant",
  "checkmate",
  "victory",
  "defeat",
  "draw",
  "opening",
  "midgame",
  "endgame",
  "time_trouble",
  "comeback",
  "trade",
  "novelty",
]);

/* ─── Grade Schema ────────────────────────────────────── */

/**
 * Validates a move grade object embedded in commentary
 * responses.
 */
export const GradeSchema = z.object({
  type: reactionTypeSchema,
  label: z.string().min(1).max(50),
  emoji: z.string().min(1).max(10),
});

export type GradeSchemaType = z.infer<typeof GradeSchema>;

/* ─── Metadata Schema ─────────────────────────────────── */

/** Validates response metadata fields. */
export const MetadataSchema = z.object({
  personalityId: z.string().min(1),
  timestamp: z.number().positive(),
  latency: z.number().nonnegative().optional(),
  model: z.string().optional(),
});

/* ─── Comment Response Schema ─────────────────────────── */

/**
 * Schema for commentary-after-move and position-analysis
 * responses that return JSON.
 */
export const CommentResponseSchema = z.object({
  /** 2-3 sentence commentary on the move or position. */
  commentary: z
    .string()
    .min(1, "Commentary must not be empty")
    .max(2000, "Commentary exceeds maximum length"),

  /** Emoji reactions to display alongside the commentary. */
  reactions: z
    .array(z.string().min(1).max(10))
    .max(5, "Too many reactions")
    .optional()
    .default([]),

  /** Optional move quality grade. */
  grade: GradeSchema.optional(),

  /** Brief strategic tip or learning takeaway. */
  tip: z
    .string()
    .max(500, "Tip exceeds maximum length")
    .nullable()
    .optional(),

  /** Follow-up questions the player can ask. */
  followUpQuestions: z
    .array(
      z.string().min(1).max(200, "Question too long"),
    )
    .max(5, "Too many follow-up questions")
    .optional()
    .default([]),
});

export type CommentResponseSchemaType = z.infer<typeof CommentResponseSchema>;

/* ─── Chat Response Schema ────────────────────────────── */

/**
 * Schema for chat-message responses.
 */
export const ChatResponseSchema = z.object({
  /** The AI's reply text. */
  reply: z
    .string()
    .min(1, "Reply must not be empty")
    .max(4000, "Reply exceeds maximum length"),

  /** Follow-up questions to keep the conversation going. */
  followUpQuestions: z
    .array(
      z.string().min(1).max(200),
    )
    .max(3, "Too many follow-up questions")
    .optional()
    .default([]),
});

export type ChatResponseSchemaType = z.infer<typeof ChatResponseSchema>;

/* ─── Post-Game Summary Schema ────────────────────────── */

/**
 * Schema for post-game-summary JSON responses.
 */
export const PostGameSummarySchema = z.object({
  /** One-sentence summary of the game. */
  summary: z
    .string()
    .min(1, "Summary must not be empty")
    .max(500),

  /** The critical moment where the game turned. */
  criticalMoment: z
    .string()
    .min(1)
    .max(500)
    .optional(),

  /** One thing the player did well. */
  strength: z
    .string()
    .min(1)
    .max(300)
    .optional(),

  /** One thing to work on. */
  improvement: z
    .string()
    .min(1)
    .max(300)
    .optional(),

  /** Encouraging closing message in character. */
  closingMessage: z
    .string()
    .min(1)
    .max(500),

  /** Optional grade for overall play. */
  overallGrade: z
    .string()
    .max(20)
    .optional(),
});

export type PostGameSummarySchemaType = z.infer<typeof PostGameSummarySchema>;

/* ─── Unified Response Schema ─────────────────────────── */

/**
 * Discriminated union schema for auto-detecting response type.
 * Attempts to match against all known response shapes and
 * returns the best match.
 */
export const UnifiedResponseSchema = z.union([
  CommentResponseSchema,
  ChatResponseSchema,
  PostGameSummarySchema,
]);

export type UnifiedResponseType = z.infer<typeof UnifiedResponseSchema>;

/* ─── Schema Registry ─────────────────────────────────── */

/** Map of expected response formats to their Zod schemas. */
export const RESPONSE_SCHEMAS = {
  "commentary-after-move": CommentResponseSchema,
  "position-analysis": CommentResponseSchema,
  "chat-message": ChatResponseSchema,
  "post-game-summary": PostGameSummarySchema,
} as const;

/** Category of response type for schema matching. */
export type ResponseSchemaCategory = keyof typeof RESPONSE_SCHEMAS;

/**
 * Validate a parsed JSON object against the expected schema.
 */
export function validateAgainstSchema(
  data: unknown,
  category: ResponseSchemaCategory,
): { success: true; data: unknown } | { success: false; error: string } {
  const schema = RESPONSE_SCHEMAS[category];
  if (!schema) {
    return { success: false, error: `Unknown schema category: ${category}` };
  }

  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }

  const issues = result.error.issues
    .map((i) => `${i.path.join(".")}: ${i.message}`)
    .join("; ");
  return { success: false, error: issues };
}
