/**
 * ──────────────────────────────────────────────────────────
 * AI Commentary API Route  —  app/api/ai/commentary/route.ts
 *
 * Server-side POST handler that:
 *   1. Receives game context from the browser
 *   2. Calls the Gemini service to generate commentary
 *   3. Returns the validated response (or fallback)
 *
 * The Gemini API key lives ONLY on the server (GEMINI_API_KEY)
 * and is NEVER exposed to the browser.
 *
 * # Request
 *
 *   POST /api/ai/commentary
 *   Content-Type: application/json
 *   Body: { fen, lastMove, moveNumber, playerColor, moveHistory,
 *           evalScore?, evalDepth, gamePhase, inCheck, isGameOver }
 *
 * # Response (success)
 *
 *   { success: true, commentary: string, reactions: string[],
 *     tip?: string, followUpQuestions: string[], latencyMs: number }
 *
 * # Response (fallback)
 *
 *   { success: false, fallback: string, error?: string }
 * ──────────────────────────────────────────────────────────
 */

import { NextResponse } from "next/server";
import { generateCommentary } from "@/lib/ai/gemini/service";
import type { CommentaryRequest } from "@/lib/ai/gemini/types";
import type { CommentaryApiResponse } from "@/lib/ai/gemini/types";

/* ─── Validation ──────────────────────────────────────── */

const REQUIRED_FIELDS: (keyof CommentaryRequest)[] = [
  "fen",
  "lastMove",
  "moveNumber",
  "playerColor",
  "moveHistory",
  "evalDepth",
  "gamePhase",
];

function isValidRequest(body: unknown): body is CommentaryRequest {
  if (!body || typeof body !== "object") return false;
  for (const field of REQUIRED_FIELDS) {
    if (!(field in body)) return false;
  }
  return true;
}

/* ─── Handler ─────────────────────────────────────────── */

export async function POST(request: Request): Promise<NextResponse<CommentaryApiResponse>> {
  /* ── Parse body ────────────────────────────────────── */

  let body: unknown;
  try {
    body = await request.json();
    console.log("[API] commentary request received, fields:", Object.keys(body as object));
  } catch {
    console.log("[API] invalid JSON body");
    return NextResponse.json(
      {
        success: false,
        fallback: "I couldn't understand the request. Let's keep playing!",
        error: "Invalid JSON body",
      },
      { status: 400 },
    );
  }

  if (!isValidRequest(body)) {
    console.log("[API] missing required fields");
    return NextResponse.json(
      {
        success: false,
        fallback: "Some game information was missing. Let's keep playing!",
        error: "Missing required fields",
      },
      { status: 400 },
    );
  }

  /* ── Check API key ─────────────────────────────────── */

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.length === 0) {
    console.log("[API] no GEMINI_API_KEY set — returning unconfigured");
    return NextResponse.json({
      success: false,
      fallback: "AI commentary is not configured. Keep playing!",
    });
  }

  console.log("[API] GEMINI_API_KEY present (length:", apiKey.length, ")");

  /* ── Generate commentary ───────────────────────────── */

  try {
    console.log("[API] calling generateCommentary...");
    const result = await generateCommentary(body, {
      apiKey,
      model: process.env.GEMINI_MODEL ?? "gemini-2.0-flash",
      temperature: 0.7,
      maxOutputTokens: 400,
      timeoutMs: 10_000,
      maxRetries: 2,
    });

    console.log("[API] generateCommentary result — success:", result.success, "usedFallback:", result.usedFallback);

    if (!result.success || result.usedFallback) {
      console.log("[API] returning fallback:", result.fallbackText, "validation:", result.validationResult?.reason);
      const originalText = result.validation?.original;
      console.log("[API] original text (first 500):", originalText?.slice(0, 500));
      return NextResponse.json({
        success: false,
        fallback: result.fallbackText ?? "An interesting position!",
        error: result.validationResult.kind === "fail"
          ? result.validationResult.reason
          : undefined,
        debug: originalText?.slice(0, 1000),
      });
    }

    // Extract structured response from pipeline result
    const response = result.response;
    const commentary = response && "commentary" in response
      ? (response as { commentary: string }).commentary
      : undefined;

    console.log("[API] success — commentary:", commentary?.slice(0, 100));

    return NextResponse.json({
      success: true,
      commentary: commentary ?? result.fallbackText ?? "An interesting position!",
      reactions: response && "reactions" in response
        ? (response as { reactions?: string[] }).reactions ?? []
        : [],
      tip: response && "tip" in response
        ? (response as { tip?: string }).tip
        : undefined,
      followUpQuestions: response && "followUpQuestions" in response
        ? (response as { followUpQuestions?: string[] }).followUpQuestions ?? []
        : [],
      latencyMs: result.totalDurationMs,
    });
  } catch (err) {
    console.log("[API] error:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({
      success: false,
      fallback: "I couldn't analyse that move right now. Keep playing!",
      error: "Internal server error",
    });
  }
}
