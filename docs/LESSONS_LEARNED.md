# Lessons Learned — AI Chess Platform

> **Purpose**: Engineering journal capturing discoveries, mistakes, and recommendations throughout the project lifecycle. Update entries as lessons are learned.

## Bug Discovery Template

```markdown
### BUG-YYYYMMDD-N — Short Bug Title

**Discovered**: YYYY-MM-DD
**Module**: <lib/chess/ | lib/engine/ | components/ | etc.>
**Root Cause**: <one-paragraph explanation>
**Fix**: <one-paragraph summary of the change>
**Prevention**: <how to prevent this class of bug>
**Related**: <link to PR or issue>
```

## Performance Finding Template

```markdown
### PERF-YYYYMMDD-N — Short Title

**Date**: YYYY-MM-DD
**Observation**: <what was measured / what was slow>
**Root Cause**: <why it was slow>
**Action Taken**: <what was changed>
**Result**: <before/after metrics>
**Lesson**: <what to watch for in the future>
```

## AI Prompt Improvement Template

```markdown
### PROMPT-YYYYMMDD-N — Short Title

**Date**: YYYY-MM-DD
**Observation**: <what Gemini did wrong>
**Prompt Change**: <what was added/removed from prompt>
**Result**: <improvement observed>
**Lesson**: <guidance for future prompt engineering>
```

## Security Lesson Template

```markdown
### SEC-YYYYMMDD-N — Short Title

**Date**: YYYY-MM-DD
**Discovery**: <what was found>
**Impact**: <what could have happened>
**Fix**: <what was done>
**Lesson**: <permanent rule to follow>
```

## Deployment Lesson Template

```markdown
### DEPLOY-YYYYMMDD-N — Short Title

**Date**: YYYY-MM-DD
**Environment**: <preview | staging | production>
**What Happened**: <description of the incident>
**Root Cause**: <why it happened>
**Resolution**: <how it was fixed>
**Prevention**: <process change / automation / monitoring>
```

---

## Initial Entries

> No entries yet. This section will grow as development progresses. See [RISK_REGISTER.md](./RISK_REGISTER.md) for anticipated risks and mitigations.

### Mistakes to Avoid (Pre-emptive)

Based on engineering experience with similar platforms:

1. **Don't put the Chess instance in the Zustand store directly.** chess.js is mutable. Cloning it on every state change is expensive. Store FEN + PGN + move history instead, and recreate the chess.js instance from FEN when needed.

2. **Don't initialize Stockfish on app load.** It adds 2-5 MB to the initial download and 1-2 seconds of worker initialization. Load on demand.

3. **Don't call Gemini on every move.** Commentary should throttle. Every move = daily quota exhaustion in under an hour. Use debounce + quality threshold.

4. **Don't block the UI while Stockfish is thinking.** That's why it's in a Worker. Verify no accidental `await` on engine operations from the main thread.

5. **Don't store the Gemini API key in code or git.** Environment variables only. `.env*` in `.gitignore`.

6. **Don't assume all browsers support Web Workers.** Not an issue in modern browsers (2024+), but verify graceful degradation.

7. **Don't make the board unmount/remount on every game state change.** Use `React.memo` and stable props to keep the board mounted.

8. **Don't forget to terminate the Stockfish Worker** when the user navigates away from the analysis page. Zombie Workers consume memory.

### Future Recommendations

- Add `@next/bundle-analyzer` before optimizing bundles — measure first, cut second
- Write integration tests for the store + engine pipeline early — this is where most bugs surface
- Use `performance.mark()` for Stockfish timing from day one — historical data helps set realistic budgets
- Version Gemini prompts so a regression in commentary quality can be traced to a specific prompt change
- Add a manual data-testid attribute strategy for Playwright selectors before components grow complex

### Related Documents

- [RISK_REGISTER.md](./RISK_REGISTER.md) — Tracked risks and mitigations
- [ERROR_HANDLING.md](./ERROR_HANDLING.md) — Error recovery patterns
- [PERFORMANCE.md](./PERFORMANCE.md) — Performance budgets
