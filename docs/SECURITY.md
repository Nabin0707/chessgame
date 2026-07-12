# Security — AI Chess Platform

## Overview

The AI Chess Platform has a unique security profile: most computation happens **client-side** (Stockfish, chess.js, game state), and the only external API call is to **Gemini** for commentary. There is no user database, no server-side game storage, and no multiplayer in the MVP.

This document covers security considerations for the current architecture and the future server-backed system.

---

## Threat Model

| Threat | Severity | Current Mitigation |
|---|---|---|
| Gemini prompt injection → move suggestion | Critical | Output validation layer rejects any move notation |
| Gemini API key exposure | Critical | Key in environment variable, CSP restricts exfiltration |
| Stockfish WASM modification | Low | WASM loaded from origin, SRI hash |
| XSS via PGN import | Medium | Sanitize imported PGN, validate with chess.js |
| localStorage data theft | Low | No sensitive data stored (games only) |
| CSRF (future) | Medium | SameSite cookies, CSRF tokens |

---

## Gemini API Security

### The Critical Rule: Gemini Never Outputs Moves

This is the most important security constraint in the platform. It is enforced at three layers:

**Layer 1 — Prompt Engineering (`lib/ai/prompts.ts`)**

Every system prompt contains explicit constraints:

```typescript
export const COMMENTARY_SYSTEM_PROMPT = `
You are a chess commentator. Your role is to explain and analyze chess positions.

You MUST follow these rules:
- NEVER output a chess move in any notation (algebraic, UCI, or otherwise).
- NEVER suggest what move to play.
- NEVER say "you should play" or "the best move is" or similar.
- ONLY describe the position, explain themes, and discuss strategic ideas.
- If asked for a move recommendation, politely decline and offer strategic advice instead.
- Keep responses concise (2-4 sentences).
- Adapt depth to the user's selected skill level (beginner / intermediate / advanced).

Violating these rules will result in immediate termination of this session.
`;
```

**Layer 2 — Output Validation (`lib/ai/validation.ts`)**

Before any Gemini response reaches the UI, it passes through a validation function:

```typescript
export function validateCommentary(response: string): ValidationResult {
  // Reject if response contains UCI notation (e.g., "e2e4", "g1f3")
  const uciPattern = /\b[a-h][1-8][a-h][1-8]\b/;
  if (uciPattern.test(response)) {
    return { isValid: false, reason: 'Response contains UCI move notation' };
  }

  // Reject if response contains algebraic notation (e.g., "Nf3", "Qxf7+", "O-O")
  const algebraicPattern = /\b([KQRBN]?[a-h]?[1-8]?x?[a-h][1-8](=[QRBN])?[+#]?|O-O(-O)?)\b/;
  // (Simplified — actual regex is more precise)
  if (algebraicPattern.test(response)) {
    return { isValid: false, reason: 'Response contains algebraic notation' };
  }

  // Reject if response contains move-suggestive phrases
  const suggestivePhrases = [
    'you should play',
    'the best move',
    'I recommend',
    'play ',
  ];

  return { isValid: true };
}
```

**Layer 3 — Monitoring (Future)**

In production, rejected Gemini responses are logged (without PII) to detect prompt injection attempts and tune prompts.

### API Key Management

```bash
# .env.local (local development)
NEXT_PUBLIC_GEMINI_API_KEY=your_key_here

# Vercel (production)
# Set via Vercel CLI or dashboard:
# vercel env add NEXT_PUBLIC_GEMINI_API_KEY production
```

**Risks and mitigations:**

| Risk | Mitigation |
|---|---|
| Key exposed in client bundle | Must be `NEXT_PUBLIC_*` for client access — accept this risk. Rate limits and key rotation limit blast radius. |
| Key stolen via XSS | CSP headers prevent data exfiltration. Key is read-only (Gemini API). |
| Key leaked to git | `.env*` in `.gitignore`. Pre-commit hook to check for keys. |

### Rate Limiting

Client-side rate limiting for Gemini calls:

```typescript
// lib/ai/gemini.ts
const rateLimiter = {
  lastCall: 0,
  minInterval: 2000, // 2 seconds minimum between calls

  async callWithThrottle<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const wait = Math.max(0, this.minInterval - (now - this.lastCall));
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    this.lastCall = Date.now();
    return fn();
  }
};
```

---

## Content Security Policy

```typescript
// next.config.ts
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval'",           // unsafe-eval required for WASM
  "worker-src 'self' blob:",                     // Web Worker for Stockfish
  "style-src 'self' 'unsafe-inline'",            // Tailwind generates inline styles
  "img-src 'self' data:",
  "connect-src 'self' https://generativelanguage.googleapis.com", // Gemini API only
  "font-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ');
```

---

## Stockfish WASM Security

| Concern | Mitigation |
|---|---|
| **WASM binary tampering** | Serve from origin, use Subresource Integrity (SRI) |
| **Worker sandboxing** | Web Worker has no DOM access. Stockfish only receives FEN strings. |
| **Resource exhaustion** | Limit search depth and time. Worker can be terminated by user. |
| **Memory safety** | Stockfish WASM is compiled from C++ — inherit memory safety of Wasm sandbox |

---

## Input Validation

### PGN Import

```typescript
export function validateAndParsePgn(pgn: string): ParseResult {
  // Reject if PGN contains HTML or script tags
  if (/<[^>]*>/i.test(pgn)) {
    return { success: false, error: 'PGN contains invalid characters' };
  }

  // Parse with chess.js (validates move legality)
  try {
    const chess = new Chess();
    chess.loadPgn(pgn);
    return { success: true, game: chess };
  } catch {
    return { success: false, error: 'Invalid PGN format' };
  }
}
```

### FEN Validation

```typescript
export function isValidFen(fen: string): boolean {
  // chess.js validateFen returns { valid: boolean, error?: string }
  return new Chess().validateFen(fen).valid;
}
```

---

## localStorage Security

Game data stored in localStorage:
- FEN, PGN, move history
- User preferences (board theme, piece set, sound settings)
- **No API keys, no passwords, no personal data**

```typescript
// lib/store/settings-store.ts
// Only store non-sensitive preferences
interface PersistedSettings {
  boardTheme: string;
  pieceSet: string;
  soundEnabled: boolean;
  commentaryLevel: 'beginner' | 'intermediate' | 'advanced';
  engineDepth: number;
}
```

---

## Future Security Concerns (Server)

When the platform adds user accounts, multiplayer, and cloud sync:

| Feature | Security Measure |
|---|---|
| **User authentication** | Argon2 password hashing, JWT with refresh tokens, rate-limited login |
| **Game sync** | Authenticated API calls, user-scoped data access |
| **Multiplayer** | WebSocket authentication, move validation on server, anti-cheat (verify moves via server-side chess.js) |
| **Server-side analysis** | Rate-limited, user-authenticated, compute-time capped |
| **User data export/deletion** | GDPR-compliant data export and account deletion API |
| **CSRF** | SameSite cookies, CSRF tokens in state-changing requests |
| **Rate limiting** | Per-endpoint rate limiting (express-rate-limit or API gateway) |

---

## Security Checklist

- [ ] Gemini output validation rejects moves (three layers)
- [ ] CSP headers configured
- [ ] API key is `NEXT_PUBLIC_*` (for client access) with restricted quota
- [ ] No sensitive data in localStorage
- [ ] PGN import sanitized before rendering
- [ ] Stockfish Workers have no DOM access
- [ ] Environment variables in `.env.local`, not `.env`
- [ ] `.env*` in `.gitignore`
- [ ] No hardcoded secrets in source code
- [ ] All user-generated content (PGN) validated before use
- [ ] HTTPS enforced (Vercel default)
