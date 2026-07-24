/**
 * ──────────────────────────────────────────────────────────
 * Gemini Service  —  lib/ai/gemini/service.ts
 *
 * High-level service that orchestrates commentary generation.
 *
 * Responsibilities:
 *   1. Build the prompt from context data
 *   2. Call the Gemini client
 *   3. Run the response through the validation pipeline
 *   4. Return the validated result (or a fallback)
 *
 * This is the ONLY module the API route imports.
 * The Gemini client can be replaced (GPT, Claude, local LLM)
 * by swapping lib/ai/gemini/client.ts without changing this
 * service's interface.
 * ──────────────────────────────────────────────────────────
 */

import { createGeminiClient } from "./client";
import { processCommentary } from "@/lib/ai/pipeline/pipeline";
import type { GeminiClientConfig, GeminiResult } from "./types";
import type { CommentaryRequest } from "./types";
import type { ProcessResult } from "@/lib/ai/pipeline/types";
import { buildPersonalityPrompt, buildUserPrompt } from "@/lib/ai/personalities/engine";
import { DEFAULT_PERSONALITY_ID } from "@/lib/ai/personalities/base";

/* ─── Prompt Builder ──────────────────────────────────── */

/**
 * Determine the personality to use for this request.
 */
function resolvePersonalityId(params: CommentaryRequest): string {
  return params.personalityId || DEFAULT_PERSONALITY_ID;
}

/**
 * Determine the event type key from the request params.
 */
function deriveEventKey(params: CommentaryRequest): string {
  if (params.isGameOver) return "checkmate";
  if (params.inCheck) return "check";
  return "general";
}

/* ─── Fallback Messages ───────────────────────────────── */

function fallbackForPhase(gamePhase: string): string {
  switch (gamePhase) {
    case "opening":
      return "A solid start. The opening sets the stage for the battle ahead.";
    case "endgame":
      return "The endgame requires precise calculation. Keep your focus!";
    default:
      return "Take your time and consider your options carefully.";
  }
}

/* ─── Service ─────────────────────────────────────────── */

/**
 * Generate AI commentary for a player's move.
 *
 * @param params - The request context (FEN, move, evaluation, etc.)
 * @param clientConfig - Gemini client configuration (API key, model, etc.)
 * @returns ProcessResult from the validation pipeline
 */
export async function generateCommentary(
  params: CommentaryRequest,
  clientConfig: GeminiClientConfig,
): Promise<ProcessResult> {
  /* ── Build personality-injected prompt ────────────── */

  const personalityId = resolvePersonalityId(params);
  const eventKey = deriveEventKey(params);
  const { systemPrompt, personalityName } = buildPersonalityPrompt(personalityId, eventKey);
  const moveHistorySan = params.moveHistory.map((m) => m.san).join(" ");
  const userPrompt = buildUserPrompt(
    params.lastMove,
    params.playerColor,
    params.moveNumber,
    params.gamePhase,
    params.inCheck,
    params.isGameOver,
    moveHistorySan,
  );
  let memorySection = "";
  if (params.memoryContext) {
    memorySection = `\n\n## Player Profile\n\n${params.memoryContext}\n\nReference the player's history naturally and conversationally.`;
  }
  const fullPrompt = `${systemPrompt}\n\n${userPrompt}${memorySection}`;

  console.log("[SERVICE] building prompt for move:", params.lastMove, "phase:", params.gamePhase, "personality:", personalityName, "hasMemory:", !!params.memoryContext);

  /* ── Call Gemini ──────────────────────────────────── */

  let geminiResult: GeminiResult;

  try {
    console.log("[SERVICE] creating Gemini client and sending prompt (length:", fullPrompt.length, ")");
    const client = createGeminiClient(clientConfig);
    geminiResult = await client.generate(fullPrompt);
    console.log("[SERVICE] Gemini raw response length:", geminiResult.raw.length, "latency:", geminiResult.latencyMs, "ms");
  } catch (err) {
    console.log("[SERVICE] Gemini API call threw:", err instanceof Error ? err.message : String(err));
    // Gemini call failed — return a fallback immediately
    return {
      success: false,
      usedFallback: true,
      fallbackText: fallbackForPhase(params.gamePhase),
      validation: {
        valid: false,
        original: "",
        sanitized: "",
        report: { passed: false, issues: [], score: 0, durationMs: 0 },
        result: { kind: "fail", reason: "Gemini API call failed" },
        wasSanitized: false,
      },
      stages: [],
      totalDurationMs: 0,
      validationResult: { kind: "fail", reason: "Gemini API call failed" },
    };
  }

  /* ── Pre-process: extract JSON from response ────────── */

  let cleanResponse = geminiResult.raw;
  console.log("[SERVICE] raw response (first 300):", cleanResponse.slice(0, 300));

  // Step 1: Find the first { and strip everything before it
  const firstBrace = cleanResponse.indexOf("{");
  if (firstBrace > 0) {
    console.log("[SERVICE] stripped", firstBrace, "chars of leading text before JSON");
    cleanResponse = cleanResponse.slice(firstBrace);
  }

  // Step 2: Try to find the matching closing }
  const lastBrace = cleanResponse.lastIndexOf("}");
  if (lastBrace > 0) {
    cleanResponse = cleanResponse.slice(0, lastBrace + 1);
  } else {
    // Step 3: No closing } — repair truncated JSON
    console.log("[SERVICE] JSON is truncated, attempting repair");
    const opens = (cleanResponse.match(/{/g) || []).length;
    const closes = (cleanResponse.match(/}/g) || []).length;
    if (opens > closes) {
      // Close any unclosed string value
      const lastOpenQuote = cleanResponse.lastIndexOf('"');
      if (lastOpenQuote !== -1) {
        const afterQuote = cleanResponse.slice(lastOpenQuote + 1);
        if (!afterQuote.includes('"') && !afterQuote.includes('}')) {
          cleanResponse += '"';
        }
      }
      // Add missing closing braces
      const missing = opens - closes;
      cleanResponse += "}".repeat(missing);
      console.log("[SERVICE] repaired truncated JSON — added", missing, "closing brace(s)");
    }
  }

  console.log("[SERVICE] clean response (first 200):", cleanResponse.slice(0, 200));

  /* ── Run through validation pipeline ──────────────── */

  const eventType = deriveEventType(params);

  try {
    console.log("[SERVICE] running pipeline — eventType:", eventType, "personality:", personalityId, "cleanResponse:", cleanResponse.slice(0, 400));
    const pipelineResult = await processCommentary(
      cleanResponse,
      personalityId,
      eventType,
      { failFast: true },
    );

    console.log("[SERVICE] pipeline result — success:", pipelineResult.success, "usedFallback:", pipelineResult.usedFallback);

    // If the pipeline returned a fallback, wrap with latency
    if (pipelineResult.usedFallback || !pipelineResult.success) {
      return {
        ...pipelineResult,
        fallbackText:
          pipelineResult.fallbackText ?? fallbackForPhase(params.gamePhase),
      };
    }

    return pipelineResult;
  } catch (err) {
    console.log("[SERVICE] pipeline threw:", err instanceof Error ? err.message : String(err));
    return {
      success: false,
      usedFallback: true,
      fallbackText: fallbackForPhase(params.gamePhase),
      validation: {
        valid: false,
        original: cleanResponse,
        sanitized: "",
        report: { passed: false, issues: [], score: 0, durationMs: 0 },
        result: { kind: "fail", reason: "Pipeline processing failed" },
        wasSanitized: false,
      },
      stages: [],
      totalDurationMs: geminiResult.latencyMs,
      validationResult: { kind: "fail", reason: "Pipeline processing failed" },
    };
  }
}

/* ─── Helpers ─────────────────────────────────────────── */

function deriveEventType(params: CommentaryRequest): import("@/lib/ai/types").ReactionType {
  if (params.isGameOver) {
    return "checkmate";
  }
  return "good";
}
