/**
 * Gemini — lib/ai/gemini/index.ts
 *
 * Gemini AI commentary client and service.
 * Server-side only — NEVER imported in browser code.
 */
export type {
  CommentaryApiResponse,
  CommentaryErrorResponse,
  CommentaryRequest,
  CommentarySuccessResponse,
  GeminiClientConfig,
  GeminiResult,
} from "./types";

export { createGeminiClient } from "./client";
export type { GeminiClient } from "./client";

export { generateCommentary } from "./service";
