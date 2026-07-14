# Pipeline — lib/ai/pipeline/

Response processing pipeline that sits between Gemini and the UI.
Orchestrates validation, sanitisation, and formatting into a
reliable, error-tolerant flow.

## Pipeline Flow

```
Raw AI Response
     ↓
Validation Stage      — schema check + injection detection
     ↓
Sanitisation Stage    — strip prohibited content, normalise
     ↓
Formatting Stage      — structure into CommentResponse/ChatResponse
     ↓
UI
```

## Error Handling

Each stage is wrapped in try/catch. If a stage fails:
- **Non-fatal errors** (validation warning, parse glitch): logged, stage
  continues with best-effort processing
- **Fatal errors** (schema mismatch, critical injection detected):
  pipeline falls through to fallback generation

## Key Interfaces

| Interface | File | Purpose |
|---|---|---|
| `PipelineConfig` | `types.ts` | Behaviour flags for each stage |
| `ProcessContext` | `types.ts` | Input to the pipeline (raw response + metadata) |
| `ProcessResult` | `types.ts` | Output from the pipeline (validated + formatted) |
| `StageHandler` | `types.ts` | Function signature for pipeline stages |
| `PipelineError` | `types.ts` | Typed error from pipeline execution |
