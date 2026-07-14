# Prompts

## Purpose

Defines the prompt template system used to construct constrained, personality-aware prompts for Gemini. Every prompt is built from a template that includes the system prompt, a user prompt with variable substitution, and explicit constraints that prevent Gemini from outputting chess moves.

## Responsibilities

- Define the `PromptTemplate` interface
- Define prompt template categories (commentary, analysis, chat, post-game)
- Define variable substitution contracts for template parameters
- Define the system prompt structure (global rules + personality injection)
- Document the prompt generation pipeline

## Future Files

| File | Purpose |
|---|---|
| `commentary-prompts.ts` | Prompt templates for move commentary |
| `analysis-prompts.ts` | Prompt templates for position analysis |
| `chat-prompts.ts` | Prompt templates for free-form chat |
| `system-prompts.ts` | System prompt definitions with global safety rules |
| `builder.ts` | Runtime prompt construction from templates + context |

## Dependencies

- `lib/ai/types/index.ts` — ResponseFormat, CommentaryLevel
- `lib/ai/personalities/types.ts` — Personality, ReactionTemplates
