/**
 * ──────────────────────────────────────────────────────────
 * Prompt Template Types  —  lib/ai/prompts/types.ts
 *
 * Defines the contract for prompt templates used to build
 * constrained, personality-aware prompts for Gemini.
 * Every prompt template enforces the "no move output" rule
 * at the template level.
 * ──────────────────────────────────────────────────────────
 */

import type { CommentaryLevel, ResponseFormat } from "@/lib/ai/types";

/* ─── Prompt Variable ────────────────────────────────── */

/** A variable that can be substituted into a prompt template. */
export interface PromptVariable {
  /** Variable name (used as {name} in the template string). */
  name: string;
  /** Human-readable description of what this variable represents. */
  description: string;
  /** Expected data type of the variable value. */
  type: "string" | "number" | "fen" | "pgn" | "move" | "evaluation" | "list";
  /** Whether the variable must be provided. */
  required: boolean;
  /** Default value if the variable is optional and not provided. */
  defaultValue?: string;
}

/* ─── Prompt Category ────────────────────────────────── */

/** Categories of prompt templates. */
export type PromptCategory =
  | "commentary"
  | "analysis"
  | "chat"
  | "post-game"
  | "lesson";

/* ─── Prompt Template ────────────────────────────────── */

/** A complete prompt template definition. */
export interface PromptTemplate {
  /** Unique identifier (kebab-case, e.g. "commentary-move"). */
  id: string;
  /** Human-readable name. */
  name: string;
  /** Category this template belongs to. */
  category: PromptCategory;
  /** Description of when this template is used. */
  description: string;
  /**
   * The system prompt that establishes Gemini's role and
   * constraints.  This is injected before every request.
   */
  systemPrompt: string;
  /**
   * The user prompt template with {variable} placeholders.
   * Variables are filled by the prompt builder at runtime.
   */
  userPromptTemplate: string;
  /** Expected response format. */
  responseFormat: ResponseFormat;
  /**
   * Explicit constraints enforced in the system prompt.
   * Each constraint is a complete sentence.
   */
  constraints: string[];
  /** Variables required/substituted in `userPromptTemplate`. */
  variables: PromptVariable[];
  /** Maximum allowed length for the response (in characters). */
  maxResponseLength: number;
  /** Minimum commentary level required to use this template. */
  minimumLevel?: CommentaryLevel;
  /** Example use case shown in documentation. */
  example?: string;
}

/* ─── Prompt Builder Result ──────────────────────────── */

/** The result of building a prompt from a template. */
export interface BuiltPrompt {
  /** The template that was used. */
  templateId: string;
  /** The fully constructed system prompt. */
  systemPrompt: string;
  /** The fully constructed user prompt. */
  userPrompt: string;
  /** The combined prompt (system + user). */
  fullPrompt: string;
  /** Variables that were substituted and their resolved values. */
  resolvedVariables: Record<string, string>;
  /** Expected response format. */
  responseFormat: ResponseFormat;
  /** Constraints passed to the output validator. */
  constraints: string[];
}

/* ─── Prompt Config ──────────────────────────────────── */

/** Configuration for the prompt builder module. */
export interface PromptConfig {
  /** Maximum length of the full prompt (characters). */
  maxPromptLength: number;
  /** Whether to inject personality tone into the system prompt. */
  injectPersonality: boolean;
  /** Whether to include game context in every prompt. */
  includeGameContext: boolean;
  /** Default response format. */
  defaultResponseFormat: ResponseFormat;
}
