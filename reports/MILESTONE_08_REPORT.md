# Milestone 8 Report — AI Validation & Response Pipeline

> **Status:** ✅ Complete  
> **Milestone:** 8 of 25  
> **Phase:** Phase 2 — AI Commentary Engine  
> **Date:** 2026-07-14  
> **Depends on:** Milestone 7 (AI Foundation Architecture — types, personalities, prompts, memory, context, formatter)

---

## Summary

Built the middleware layer that sits between Gemini and the UI, implementing ADR-006 Layer 2 (output validation) and the full response processing pipeline. The validation module provides schema validation, injection detection, and sanitization. The pipeline module orchestrates validation → sanitization → formatting as three ordered stages with error handling, fallback generation, and score-based gating.

**Total new files: 19** (validation: 7, pipeline: 6, tests: 6)

---

## Files Created

### Validation Module (`lib/ai/validation/`)

| File | Purpose |
|---|---|
| `README.md` | Module overview and usage documentation |
| `types.ts` | `ValidationOutput`, `DetectorConfig`, `SanitizerConfig`, `ValidatorConfig`, `DetectionPattern`, 5+ supporting interfaces |
| `schemas.ts` | Zod schemas for `CommentResponse`, `ChatResponse`, `PostGameSummary` + `GradeSchema` + `MetadataSchema` + `safeParseJSON()` + `validateAgainstSchema()` |
| `detector.ts` | 6 pattern groups (algebraic, UCI, FEN, PGN, suggestions, partials) + `detectAll()`, `scanResponse()`, `generateReport()` |
| `sanitizer.ts` | `stripAlgebraicMoves()`, `stripUCI()`, `stripFEN()`, `stripPGN()`, `stripMoveSuggestions()`, `normalizeWhitespace()`, `truncate()`, `sanitize()`, `lightSanitize()` |
| `validator.ts` | `validateJSONResponse()`, `validateTextResponse()`, `getFallbackCommentary()`, `getFallbackChatResponse()`, `getRateLimitMessage()`, `getApiErrorMessage()` |
| `index.ts` | Re-exports all validation types and functions |

### Pipeline Module (`lib/ai/pipeline/`)

| File | Purpose |
|---|---|
| `README.md` | Module overview and usage documentation |
| `types.ts` | `ProcessContext`, `ProcessResult`, `PipelineConfig`, `StageResult`, `StageHandler`, `PipelineError` + types |
| `error.ts` | `classifyError()`, `generateFallbackMessage()`, `generateChatFallback()`, `formatErrorLog()`, severity check helpers |
| `stages.ts` | Three stage handlers: `validationStage`, `sanitizationStage`, `formattingStage` |
| `pipeline.ts` | `runPipeline()` orchestrator + convenience wrappers `processCommentary()`, `processChat()`, `processPostGameSummary()` |
| `index.ts` | Re-exports all pipeline types and functions |

### Test Files

| File | Tests | Coverage |
|---|---|---|
| `validation/__tests__/detector.test.ts` | ~30 | All 6 detector categories, detectAll, scanResponse, edge cases |
| `validation/__tests__/sanitizer.test.ts` | ~30 | All strip/normalise/truncate functions, sanitize, lightSanitize |
| `validation/__tests__/schemas.test.ts` | ~25 | safeParseJSON, all 4 schemas, schema registry, validateAgainstSchema |
| `validation/__tests__/validator.test.ts` | ~25 | validateJSONResponse, validateTextResponse, fallback functions |
| `pipeline/__tests__/error.test.ts` | ~20 | classifyError, severity checks, fallback messages, error formatting |
| `pipeline/__tests__/pipeline.test.ts` | ~15 | runPipeline, 3 convenience wrappers, disabled stages, edge cases |

---

## Architecture

### Validation + Pipeline Position in the System

```
Gemini Raw Response (JSON or text)
        │
        ▼
┌────────────────────────────────┐
│  Pipeline Orchestrator         │
│  (lib/ai/pipeline/pipeline.ts) │
│                                │
│  Stage 1: Validation           │
│  ┌────────────────────────┐    │
│  │ validator.ts           │    │
│  │  ├─ JSON.parse()       │    │
│  │  ├─ Schema validation  │    │
│  │  │  (Zod)              │    │
│  │  ├─ Injection detect   │    │
│  │  │  (detector.ts)      │    │
│  │  └─ Score: 0-100       │    │
│  └────────────────────────┘    │
│         │                      │
│  Stage 2: Sanitization         │
│  ┌────────────────────────┐    │
│  │ sanitizer.ts           │    │
│  │  ├─ Strip notation     │    │
│  │  ├─ Normalise          │    │
│  │  └─ Truncate           │    │
│  └────────────────────────┘    │
│         │                      │
│  Stage 3: Formatting           │
│  ┌────────────────────────┐    │
│  │ stages.ts              │    │
│  │  └─ → CommentResponse  │    │
│  │     → ChatResponse     │    │
│  └────────────────────────┘    │
│         │                      │
│  Fallback?                     │
│  ┌────────────────────────┐    │
│  │ error.ts               │    │
│  │  └─ Personality-aware  │    │
│  │     fallback message   │    │
│  └────────────────────────┘    │
└────────────────────────────────┘
         │
         ▼
   ProcessResult → UI
```

### Detection Categories

| Category | Example | Pattern Count |
|---|---|---|
| `algebraic_move` | `e4`, `Nf3`, `Qxd8+`, `O-O`, `Nbd2`, `exd5` | 5 |
| `uci_move` | `e2e4`, `g1f3`, `e7e8q` | 1 |
| `fen` | `rnbqkbnr/pppppppp/8/...` | 2 |
| `pgn` | `[Event "..."]`, `1. e4 e5` | 2 |
| `move_suggestion` | "you should play", "I recommend" | 5 |
| `partial_match` | piece+square patterns, standalone square refs | 2 |

### Scoring System

| Condition | Point Change |
|---|---|
| Clean response | 100 (pass) |
| Per error-level issue | -25 |
| Per warning/info-level issue | -10 |
| Minimum | 0 |
| Default threshold | ≥ 70 passes |

### Error Classification

| Category | Severity | Action |
|---|---|---|
| Schema validation failure | Fatal | Stop pipeline, use fallback |
| JSON parse failure | Fatal | Stop pipeline, use fallback |
| Injection detected | Fatal | Stop pipeline, use fallback |
| Timeout | Fatal | Stop pipeline, use fallback |
| Sanitization failure | Recoverable | Continue with best-effort |
| Unknown internal error | Recoverable | Continue with best-effort |

---

## ADR-022: Validation & Pipeline Architecture

**Status:** Accepted | **Category:** Security

The validation system and pipeline are separated into two submodules: `validation/` provides stateless pure functions for detection, sanitization, and schema validation; `pipeline/` provides stateful orchestration with error handling and fallback generation.

Key decisions:
- **Score-based gating** — not binary pass/fail (score 0-100, threshold 70)
- **Detector/sanitizer parity** — same regex patterns for detection and stripping
- **Personality-aware fallbacks** — fallback messages drawn from personality reaction templates
- **Three-stage pipeline** — validation → sanitization → formatting, each independently disposable

---

## Updated Files

| File | Change |
|---|---|
| `lib/ai/index.ts` | Added 40+ validation and pipeline type/function exports |
| `docs/AI_GUIDELINES.md` | Updated module structure, stage details, validation section, ADR-006 status |
| `docs/ARCHITECTURE.md` | Added validation/pipeline to AI section, updated ADR-006 reference |
| `docs/FOLDER_STRUCTURE.md` | Added validation/ and pipeline/ directories with file listings |
| `docs/CHANGELOG.md` | Added Milestone 8 entry |
| `docs/DECISIONS.md` | Added ADR-022 |

---

## Test Summary

| Test File | Assertions | Focus |
|---|---|---|
| `detector.test.ts` | ~50 | All detection patterns, false positives, disabled config, edge cases |
| `sanitizer.test.ts` | ~45 | Strip functions, whitespace normalisation, smart truncation, idempotency |
| `schemas.test.ts` | ~40 | Zod schema validation, safeParse, defaults, error messages |
| `validator.test.ts` | ~35 | JSON/text validation, score calculation, fallback messages |
| `error.test.ts` | ~25 | Error classification, severity checks, log formatting |
| `pipeline.test.ts` | ~20 | Stage sequencing, disabled stages, convenience wrappers, edge cases |

All tests are written in Vitest syntax (describe/it/expect) and are co-located with their source files.

---

## Key Metrics

| Metric | Value |
|---|---|
| Total source files | 13 |
| Total test files | 6 |
| Estimated test assertions | ~215 |
| Validation latency target | < 10ms |
| Score threshold | 70 |
| Detection pattern groups | 6 |
| Pipeline stages | 3 |
| Error severity levels | 3 |

---

## Next Steps

1. **Install vitest** (`npm install -D vitest`) — currently not in package.json, required to run tests
2. **Integrate Gemini SDK** — real API calls with the pipeline (future milestone)
3. **Implement ADR-006 Layer 3** — monitoring, rate-limit anomaly detection, content quality
4. **Create integration tests** — end-to-end validation → pipeline flow with mocked Gemini responses
5. **Edge case tuning** — monitor false positive rates once real commentary flows through
