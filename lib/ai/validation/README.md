# Validation — lib/ai/validation/

Response validation for the AI commentary system. This module implements
**ADR-006 Layer 2** — post-generation output validation that scans Gemini
responses for prohibited content before they reach the UI.

## Responsibilities

- **Schema validation** — verify Gemini's JSON responses conform to expected shapes
- **Prompt injection detection** — scan for move notation, FEN, PGN in commentary
- **Response sanitization** — strip or normalise prohibited patterns
- **Fallback generation** — produce safe fallback text when validation fails

## Pipeline Position

```
Gemini raw response
     ↓
Validator      ← you are here
  - parse JSON
  - schema check
  - injection detection
     ↓
Sanitizer
  - strip moves
  - normalise whitespace
  - truncate
     ↓
Formatter
  - apply emoji
  - structure output
     ↓
UI renders
```

## Key Interfaces

| Interface | File | Purpose |
|---|---|---|
| `ValidationIssue` | `types.ts` | A single finding (error/warning/info) |
| `ValidationReport` | `types.ts` | Aggregate of all issues with pass/fail verdict |
| `DetectionResult` | `types.ts` | Matches found by a single detector |
| `DetectorConfig` | `types.ts` | Which detection patterns are enabled |
| `SanitizerConfig` | `types.ts` | Which sanitisation steps to apply |
| `ValidatorConfig` | `types.ts` | Overall validation behaviour |

## Detection Rules

The detector checks for these prohibited patterns:

| Pattern | Examples | Severity |
|---|---|---|
| Algebraic moves | `e4`, `Nf3`, `Qxd8+`, `O-O`, `O-O-O` | error |
| UCI moves | `e2e4`, `g1f3`, `e7e8q` | error |
| FEN strings | `rnbqkbnr/pppppppp/8/...` | error |
| PGN tags | `[Event "..." ]`, `[Date "..." ]` | error |
| Move suggestions | `you should play`, `I recommend`, `try moving` | error |
| Partial moves | `Nf`, `e2-`, `Kg` (edge cases) | warning |
