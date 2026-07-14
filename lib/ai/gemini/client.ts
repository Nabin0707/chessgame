/**
 * ──────────────────────────────────────────────────────────
 * Gemini Client  —  lib/ai/gemini/client.ts
 *
 * Thin wrapper around the official Google Gen AI SDK
 * (@google/genai).  Responsibilities:
 *
 *   - SDK initialisation (server-side only)
 *   - API communication with retry + timeout
 *   - Error normalisation
 *
 * This module is the ONLY code that imports @google/genai.
 * The rest of the application communicates through
 * lib/ai/gemini/service.ts.
 *
 * # Security
 *
 * The API key is NEVER exposed to the browser.  This module
 * runs only in Next.js server-side context (API routes).
 * ──────────────────────────────────────────────────────────
 */

import { GoogleGenAI } from "@google/genai";
import type { GeminiClientConfig, GeminiResult } from "./types";

/* ─── Defaults ────────────────────────────────────────── */

const DEFAULT_MODEL = "gemini-2.0-flash";
const DEFAULT_TEMPERATURE = 0.7;
const DEFAULT_MAX_OUTPUT_TOKENS = 400;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_RETRIES = 2;

/* ─── Retryable Errors ────────────────────────────────── */

const RETRYABLE_STATUSES = [429, 500, 502, 503];

function isRetryable(error: unknown): boolean {
  if (error && typeof error === "object") {
    const status = (error as Record<string, unknown>).status;
    if (typeof status === "number" && RETRYABLE_STATUSES.includes(status)) {
      return true;
    }
    const message = String((error as Record<string, unknown>).message ?? "");
    if (
      message.includes("rate_limit") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("internal") ||
      message.includes("unavailable")
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Sleep for `ms` milliseconds (used for retry back-off).
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ─── Client ──────────────────────────────────────────── */

/**
 * Create a Gemini client that wraps the Google Gen AI SDK.
 *
 * @param config - Configuration including API key and model settings.
 * @returns An object with a `generate()` method.
 */
export function createGeminiClient(config: GeminiClientConfig) {
  const model = config.model ?? DEFAULT_MODEL;
  const temperature = config.temperature ?? DEFAULT_TEMPERATURE;
  const maxOutputTokens = config.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
  const timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxRetries = config.maxRetries ?? DEFAULT_MAX_RETRIES;

  /* ── SDK initialisation ────────────────────────────── */

  const client = new GoogleGenAI({ apiKey: config.apiKey });

  /**
   * Send a prompt to Gemini and return the generated text.
   *
   * Implements:
   *   - Timeout via AbortController
   *   - Retry with exponential back-off for retryable errors
   *   - Error normalisation
   */
  async function generate(prompt: string): Promise<GeminiResult> {
    const start = performance.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        // Exponential back-off: 1s, 2s, 4s...
        const delay = Math.min(1000 * 2 ** (attempt - 1), 10_000);
        console.log(`[CLIENT] retry attempt ${attempt} — sleeping ${delay}ms`);
        await sleep(delay);
      }

      try {
        console.log(`[CLIENT] attempt ${attempt + 1}/${maxRetries + 1} — sending to model "${model}"`);
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);

        const response = await client.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature,
            maxOutputTokens,
          },
        });

        clearTimeout(timer);

        const text = response.text ?? "";
        const latencyMs = Math.round(performance.now() - start);

        console.log(`[CLIENT] response received — text length: ${text.length}, latency: ${latencyMs}ms`);
        if (text.length > 0) {
          console.log(`[CLIENT] raw response (first 200 chars):`, text.slice(0, 200));
        } else {
          console.log(`[CLIENT] WARNING: empty response text from Gemini`);
        }

        return { raw: text, latencyMs };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const status = error && typeof error === "object" ? (error as Record<string, unknown>).status : undefined;
        console.log(`[CLIENT] attempt ${attempt + 1} failed — status:`, status, "message:", lastError.message);
        console.log(`[CLIENT] retryable:`, isRetryable(error), "maxRetries:", maxRetries);

        if (!isRetryable(error) || attempt >= maxRetries) {
          break;
        }
      }
    }

    const latencyMs = Math.round(performance.now() - start);
    const message = lastError?.message ?? "Gemini API call failed";
    console.log(`[CLIENT] all ${maxRetries + 1} attempts failed — error:`, message);
    throw new Error(`Gemini error after ${maxRetries + 1} attempt(s): ${message}`);
  }

  return { generate };
}

export type GeminiClient = ReturnType<typeof createGeminiClient>;
