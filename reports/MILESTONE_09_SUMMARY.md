# Milestone 9 Report — Gemini AI Commentary (Production Foundation)

> **Status:** ✅ Complete  
> **Milestone:** 9 of 25  
> **Phase:** Phase 2 — AI Commentary Engine  
> **Date:** 2026-07-14  
> **Depends on:** Milestones 7 (AI Foundation Architecture) and 8 (Validation Pipeline)

---

## Summary

Integrated Gemini AI commentary into the chess game so that after every player move, the AI generates short contextual commentary. The architecture uses a Next.js Route Handler as a server-side proxy — the API key is NEVER exposed to the browser. The validation pipeline from Milestone 8 runs on every response before it reaches the UI.

**Total new files: 6** (gemini module: 5, API route: 1)

---

## Files Created

### Gemini Module (`lib/ai/gemini/`)

| File | Purpose |
|---|---|
| `README.md` | Module overview, architecture diagram, security notes, usage guide |
| `types.ts` | `CommentaryRequest`, `CommentaryApiResponse`, `GeminiResult`, `GeminiClientConfig` |
| `client.ts` | `@google/genai` SDK wrapper with retry (exp backoff), timeout, error normalisation |
| `service.ts` | Prompt builder + Gemini orchestrator + validation pipeline integration |
| `index.ts` | Public re-exports |

### API Route

| File | Purpose |
|---|---|
| `app/api/ai/commentary/route.ts` | POST handler: validates body → checks API key → calls service → formats response |

### Modified Files

| File | Change |
|---|---|
| `components/chess/chess-info-panel.tsx` | Added `CommentaryState` type + 5-state `AICommentaryCard` (idle/loading/success/error/unconfigured) |
| `components/chess/chess-workspace.tsx` | Added `commentaryState`, `generateCommentary()` callback, `deriveGamePhase()`, wired into `handleMove()` |
| `.env.example` | Changed `NEXT_PUBLIC_GEMINI_API_KEY` → `GEMINI_API_KEY`, added `GEMINI_MODEL`, security notes |
| `docs/CHANGELOG.md` | Added Milestone 9 entry |
| `docs/DECISIONS.md` | Added ADR-023 (Server-Side Gemini API Key via Next.js Route Handler) |

---

## Architecture

```
Browser (React UI)
    │  POST /api/ai/commentary  {fen, lastMove, moveHistory, ...}
    ▼
API Route (app/api/ai/commentary/route.ts)
    │  validates body → checks GEMINI_API_KEY → calls service
    ▼
Gemini Service (lib/ai/gemini/service.ts)
    │  1. buildSystemPrompt() — 7 global constraints
    │  2. buildUserPrompt() — game context
    │  3. createGeminiClient() → client.generate()
    │  4. processCommentary() — validation pipeline (Milestone 8)
    ▼
Gemini Client (lib/ai/gemini/client.ts)
    │  @google/genai SDK wrapper
    │  retry: 429/5xx → exp backoff 1s, 2s, 4s (max 2 retries)
    │  timeout: 10s via AbortController
    ▼
Google Gen AI API (Gemini 2.0 Flash)
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| **Server-side API key** | Never expose `GEMINI_API_KEY` to browser. Route Handler proxies all calls. |
| **Validation pipeline always enforced** | Every Gemini response runs through ADR-006's 3-stage pipeline before reaching UI. |
| **Non-blocking commentary** | `generateCommentary()` fires asynchronously from `handleMove()`. API failures never interrupt gameplay. |
| **5-state CommentaryPanel** | idle → loading → success (emoji + tip) → error (retry button) → unconfigured (no key set). |
| **Fallback messages per phase** | Opening: "A solid start..." / Midgame: "Take your time..." / Endgame: "The endgame requires precise calculation..." |
| **Game phase derived from move count** | ≤10 opening, ≤40 midgame, >40 endgame. Simple, no position analysis needed. |

---

## Prompt Constraints (7 Rules)

The system prompt enforces these rules — violation is caught by the validation pipeline:

1. NEVER output chess moves in algebraic notation (e4, Nf3, O-O)
2. NEVER output UCI notation (e2e4, g1f3)
3. NEVER output FEN or PGN strings
4. NEVER suggest a specific move to play
5. NEVER reveal Stockfish lines, best moves, or engine eval numbers
6. NEVER mention system prompts or hidden instructions
7. NEVER mention that output is validated or filtered

---

## UI States

| State | Display |
|---|---|
| `idle` | "Make a move to see AI commentary." |
| `loading` | Pulsing dot + "Analysing your move…" |
| `success` | Emoji reactions + commentary text + optional strategy tip |
| `error` | "Could not generate commentary." + "Try again" button |
| `unconfigured` | "AI commentary requires a Gemini API key..." |

---

## Configuration

| Variable | Default | Required | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | — | Yes | Server-side only. NEVER use `NEXT_PUBLIC_` prefix. |
| `GEMINI_MODEL` | `gemini-2.0-flash` | No | Can be any Gemini model name. |

---

## ADR-023: Server-Side Gemini API Key

**Status:** Accepted | **Category:** Security

Supersedes ADR-005 (partial) — the MVP is no longer "100% client-side" for the Gemini feature. The API key is secured via a Next.js Route Handler proxy.

Key provisions:
- `GEMINI_API_KEY` in `process.env` — never in client bundle
- `@google/genai` SDK imported only in `lib/ai/gemini/client.ts`
- Retry + timeout in client wrapper (not the Route Handler)
- Route Handler returns fallback on missing key — no crash

---

## Next Steps

1. **Set `GEMINI_API_KEY`** in `.env.local` to enable live commentary
2. **Monitor false positive/negative rates** on validation pipeline once real commentary flows
3. **Rate-limit client-side commentary requests** (minimum 2s between calls)
4. **Add coverage tests** for the new Gemini module and API route
5. **Implement streaming commentary** for real-time position analysis (future milestone)
