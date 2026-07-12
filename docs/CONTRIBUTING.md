# Contributing — AI Chess Platform

## Development Setup

### Prerequisites

- Node.js 22+
- npm 10+

### Getting Started

```bash
# Clone the repository
git clone https://github.com/your-org/ai-chess-platform.git
cd ai-chess-platform

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Gemini API key

# Start development server
npm run dev
# Open http://localhost:3000
```

### Development Scripts

```bash
npm run dev          # Start dev server with hot reload
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run test         # Run Vitest tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Run tests with coverage report
```

---

## Git Workflow

### Branching Strategy

```
main              # Production-ready code
  └── develop     # Integration branch (optional, for small teams)
       ├── feat/stockfish-bridge      # Feature branches
       ├── fix/promotion-mobile       # Bug fix branches
       ├── refactor/game-state        # Refactoring branches
       ├── docs/api-design            # Documentation branches
       └── perf/bundle-optimization   # Performance branches
```

### Branch Naming

```
feat/<short-description>
fix/<short-description>
refactor/<short-description>
docs/<short-description>
perf/<short-description>
test/<short-description>
chore/<short-description>
```

Branch names are kebab-case, all lowercase.

### Commit Conventions

Follow **Conventional Commits**:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:**

| Type | Usage |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `docs` | Documentation changes |
| `chore` | Build process, dependencies, tooling |
| `style` | Formatting, missing semicolons (no code change) |
| `ci` | CI/CD configuration |

**Scopes:**

```
chess         # lib/chess/ (chess.js logic)
engine        # lib/engine/ (Stockfish bridge)
ai            # lib/ai/ (Gemini integration)
board         # components/board/
game          # components/game/
analysis      # components/analysis/
settings      # components/settings/
store         # lib/store/ (Zustand)
ui            # components/ui/ (shadcn)
deps          # Dependencies
config        # Configuration files
docs          # Documentation
```

**Examples:**

```
feat(engine): implement Stockfish evaluation bridge

Add Web Worker wrapper for Stockfish WASM with UCI protocol support.
Supports position setup, search commands, and evaluation parsing.

Closes #42
```

```
fix(board): handle promotion on mobile touch devices

Promotion dialog was not responding to tap on iOS Safari.
Fixed by adding touch event handler to promotion piece selection.
```

```
refactor(chess): extract game state machine from store

Move game lifecycle logic (start, move, undo, resign, game-over)
out of Zustand store into pure functions in lib/chess/game.ts.
```

### Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following coding standards
3. **Write or update tests** for your changes
4. **Run quality checks** locally:
   ```bash
   npm run lint && npm run typecheck && npm run test
   ```
5. **Push your branch** and create a PR to `main`
6. **PR title** follows conventional commits: `feat(engine): add Stockfish bridge`
7. **PR description** includes:
   - What changed and why
   - Screenshots for UI changes
   - Testing instructions
   - Link to related issue
8. **Wait for CI** to pass (lint, typecheck, test, build)
9. **Request review** from at least one teammate
10. **Merge** after approval (squash merge preferred)

---

## Code Review Checklist

### General
- [ ] Does the code follow coding standards?
- [ ] Is the change necessary? (No scope creep)
- [ ] Are there tests for new functionality?
- [ ] Do existing tests still pass?
- [ ] Are error states handled?
- [ ] Are edge cases covered?

### Chess Logic
- [ ] Does chess.js remain the sole source of truth for game state?
- [ ] Is Stockfish only consulted, never modifying game state?
- [ ] Are chess rules tested (en passant, castling, promotion, draws)?

### AI / Gemini
- [ ] Is Gemini output validated before reaching UI?
- [ ] Does it pass the "no move notation" security check?
- [ ] Is there a rate limit / debounce on API calls?

### Performance
- [ ] Are expensive computations memoized?
- [ ] Is the Stockfish Worker managed correctly (start/stop/restart)?
- [ ] Are Zustand selectors optimized?
- [ ] Are components lazy-loaded where appropriate?

### Accessibility
- [ ] Are interactive elements keyboard accessible?
- [ ] Are there appropriate ARIA labels?
- [ ] Is color not the only means of conveying information?
- [ ] Does the board work with screen readers?

---

## Testing Guidelines

### Writing Tests

- **Unit tests** for every function in `lib/`:
  - One `describe` block per function or module
  - Test happy path, error cases, and edge cases
  - Use descriptive test names (sentences)
- **Integration tests** for feature flows:
  - Full game lifecycle
  - Store + engine pipeline
  - Board interaction + state update
- **E2E tests** for critical user paths:
  - Play a game
  - Analyze a game
  - Settings persistence

```typescript
// lib/chess/engine.test.ts
import { describe, it, expect } from 'vitest';
import { createGame, makeMove } from './engine';

describe('makeMove', () => {
  it('applies a legal pawn move', () => {
    const game = createGame();
    const result = makeMove(game, 'e2', 'e4');
    expect(result.success).toBe(true);
  });

  it('rejects an illegal move', () => {
    const game = createGame();
    const result = makeMove(game, 'e2', 'e5');
    expect(result.success).toBe(false);
  });
});
```

### Test File Location

Tests are co-located with source files:

```
lib/chess/engine.ts
lib/chess/engine.test.ts

components/game/clock.tsx
components/game/clock.test.tsx
```

Integration and E2E tests live in `tests/`:

```
tests/integration/game-flow.test.ts
tests/e2e/play-game.spec.ts
```

---

## Project Structure

See [FOLDER_STRUCTURE.md](./FOLDER_STRUCTURE.md) for the complete directory layout.

Key directories:

```
src/
  app/              # Next.js pages and layouts
  components/       # React components (board, game, analysis, ai, shared)
  lib/              # Pure logic (chess, engine, ai, store, utils)
  hooks/            # React hooks
  types/            # TypeScript type definitions
  workers/          # Web Worker scripts (Stockfish)
```

---

## Communication

- **Issues**: Bug reports, feature requests, questions
- **Discussions**: Architecture decisions, design proposals
- **Pull Requests**: Code changes with full context in description
- **Commit messages**: Clear, conventional, self-explanatory

---

## Documentation

When contributing, update relevant documentation:

- New feature → update `ROADMAP.md` and relevant `docs/` file
- Architecture change → update `ARCHITECTURE.md` (including Mermaid diagrams)
- API change → update `API_DESIGN.md`
- Dependency change → update `TECH_STACK.md`
- Configuration change → update `DEPLOYMENT.md`
- All changes → update `CHANGELOG.md`

---

## Getting Help

- Check existing documentation in `docs/`
- Search GitHub issues for similar questions
- Tag maintainers in PR comments for review
