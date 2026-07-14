# Formatter

## Purpose

Defines the output formatting system that transforms raw Gemini responses into structured, validated, UI-ready data. The formatter is the last stage of the AI pipeline — it parses Gemini's natural language output, extracts structured fields, applies personality emoji, and passes the result to the output validation layer.

## Responsibilities

- Define formatter interfaces for parsing Gemini responses
- Extract structured data (commentary text, grade, tips, follow-up questions)
- Apply personality emoji to commentary output
- Prepare data for the UI rendering layer
- Pass output to the validation layer before UI delivery

## Future Files

| File | Purpose |
|---|---|
| `commentary-formatter.ts` | Formats move commentary responses |
| `analysis-formatter.ts` | Formats position analysis responses |
| `chat-formatter.ts` | Formats chat responses |
| `emoji-applier.ts` | Injects personality emojis into formatted output |
| `response-parser.ts` | Parses Gemini JSON/text responses into structured types |

## Dependencies

- `lib/ai/types/index.ts` — CommentResponse, ChatResponse, ValidationResult, CommentaryContext
- `lib/ai/personalities/types.ts` — Personality, EmojiStyle
- `lib/ai/personalities/personalities.ts` — PERSONALITY_MAP
