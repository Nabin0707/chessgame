# Gemini Module — `lib/ai/gemini/`

Server-side Gemini AI commentary integration.

## Architecture

```
Browser (UI)
    │  POST /api/ai/commentary  {fen, lastMove, ...}
    ▼
API Route (app/api/ai/commentary/route.ts)
    │
    ▼
Gemini Service (lib/ai/gemini/service.ts)
    │  builds prompt → calls client → validates via pipeline
    ▼
Gemini Client (lib/ai/gemini/client.ts)
    │  @google/genai SDK wrapper with retry + timeout
    ▼
Google Gen AI API
```

## Security

- The API key (`GEMINI_API_KEY`) lives ONLY on the server.
- The browser sends game context as a JSON payload.
- The server builds the prompt, calls Gemini, validates the response,
  and returns a safe result to the browser.

## Files

| File | Responsibility |
|---|---|
| `types.ts` | Request/response types for the API route and Gemini client |
| `client.ts` | SDK wrapper with retry logic, timeout, and error normalisation |
| `service.ts` | Prompt builder, commentary orchestrator, pipeline integration |
| `index.ts` | Public re-exports |

## Usage

The UI should only call the API route:

```typescript
const res = await fetch("/api/ai/commentary", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fen,
    lastMove: "e4",
    moveNumber: 1,
    playerColor: "w",
    moveHistory: [],
    evalScore: null,
    evalDepth: 0,
    gamePhase: "opening",
    inCheck: false,
    isGameOver: false,
  }),
});

const data = await res.json();
// { success: true, commentary: "...", reactions: [...], ... }
// { success: false, fallback: "..." }
```

## Replacing Gemini

To swap Gemini for GPT, Claude, or a local LLM:

1. Create a new client implementation (e.g. `lib/ai/gpt/client.ts`)
2. Update `lib/ai/gemini/client.ts` or create a factory in `service.ts`
3. The prompt-building and validation logic in `service.ts` stays the same
4. The API route interface stays the same — the UI never changes
