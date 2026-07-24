# Milestone 15: Complete Chess Experience

**Status:** Completed

## Features Implemented

### 1. Captured Pieces & Material Balance
- `lib/chess/captured-pieces.ts` — Pure functions for computing captured pieces from game state
- `components/chess/CapturedPiecesCard.tsx` — Visual display grouped by piece type with count badges
- Animated appearance via Framer Motion (staggered spring animations)
- Material balance indicator in the card header (+3, -1, etc.)

### 2. Chess Clock with Time Control Presets
- `lib/chess/clock.ts` — Time control definitions (12 presets across 5 categories + unlimited)
- `hooks/useClock.ts` — React hook for timer management with interval-based ticking
- `components/chess/ChessClock.tsx` — Dual-timer display with active player indicator
- Time categories: Unlimited, Bullet (1+0, 2+1), Blitz (3+0, 3+2, 5+0), Rapid (10+0, 10+5, 15+10), Classical (30+0, 30+20, 60+0)
- Tenth-of-second display when under 10 seconds
- Flashing red timer when under 30 seconds
- Fixed: NaN display for Infinity (unlimited) mode

### 3. PGN Support
- `lib/chess/notation.ts` — Export, import, copy-to-clipboard, file download
- `components/chess/PgnTools.tsx` — Copy PGN, Download PGN, Import PGN (via dialog)
- Uses `navigator.clipboard.writeText()` with fallback to `execCommand`
- Blob-based file download
- Fixed: `Buffer.from()` → `btoa()` for browser compatibility

### 4. FEN Support
- Copy FEN, Download FEN, Import FEN (via dialog)
- Import creates fresh chess.js instance from FEN string
- Error handling with user feedback for invalid PGN/FEN

### 5. Sound System
- `lib/chess/sound.ts` — Web Audio API sound engine (7 distinct event sounds)
- Sound types: move, capture, castle, promotion, check, checkmate, draw, game-start
- Each sound has a unique tonal pattern via OscillatorNode:
  - Move: 600Hz short burst
  - Capture: descending 400Hz→300Hz
  - Castle: ascending two-tone 500Hz→700Hz
  - Promotion: three-note arpeggio 800Hz→1000Hz→1200Hz
  - Check: alternating alarm 700Hz→500Hz
  - Checkmate: slow descending 400Hz→300Hz→200Hz
  - Draw: flat 400Hz steady tone
- `components/chess/SoundToggle.tsx` — Mute/unmute toggle with speaker icons
- Settings persisted to localStorage (`chess-sound-muted` key)
- Lazy AudioContext creation (first play)

### 6. Board Improvements
- `components/chess/BoardImprovements.tsx` — Pure utility for computing square highlights
- **Last move highlight**: Amber glow on from/to squares of the most recent move
- **Check highlight**: Red radial gradient on the king square when in check
- **Legal move indicators**: Radial gradient dots on destination squares
- **Capture indicators**: Ring-style hint on squares with capturable pieces
- All highlights merge correctly (check overrides last move on the same square)

### 7. Enhanced Game Controls
- **Flip Board** button — Toggles `boardOrientation` between "white" and "black"
- **Resign** button — Records game as loss, resets position
- **Offer Draw** button — Records game as draw, resets position
- All with keyboard shortcut support

### 8. Analysis Tools
- `lib/chess/analysis-display.ts` — Eval bar percentage, color, and formatting helpers
- `components/chess/AnalysisTools.tsx` — Card with animated eval bar + stats grid
- Stats display: depth, nodes searched, search speed, best move indication
- `EvalScore` → percentage mapping (clamped to ±500cp for 5%–95% range)
- Enhanced: `types/engine.ts` — Added `AnalysisData` interface and `onAnalysis` callback
- Enhanced: `lib/engine/stockfish.ts` — Extracts depth, nodes, NPS, and PV from UCI info lines

### 9. Keyboard Shortcuts
- `hooks/useKeyboardShortcuts.ts` — Global keydown handler with input-field detection
- Shortcuts: `N` → New Game, `U` → Undo, `F` → Flip Board, `M` → Mute/Unmute, `R` → Resign
- Ignores shortcuts when focused on `INPUT`/`TEXTAREA`/`SELECT` elements

### 10. Mobile Experience
- Responsive layout: sidebar and info panel hidden on mobile, toggled via buttons
- Board fills available width on small screens
- Touch events handled natively by react-chessboard
- Mobile toggle buttons between board and controls/info panels

## Files Created
- `lib/chess/captured-pieces.ts`
- `lib/chess/notation.ts`
- `lib/chess/clock.ts`
- `lib/chess/sound.ts`
- `lib/chess/analysis-display.ts`
- `hooks/useClock.ts`
- `hooks/useKeyboardShortcuts.ts`
- `components/chess/CapturedPiecesCard.tsx`
- `components/chess/ChessClock.tsx`
- `components/chess/PgnTools.tsx`
- `components/chess/SoundToggle.tsx`
- `components/chess/AnalysisTools.tsx`
- `components/chess/BoardImprovements.tsx`
- `reports/MILESTONE_15_SUMMARY.md`

## Files Modified
- `types/engine.ts` — Added `AnalysisData` interface, `onAnalysis` callback
- `lib/engine/stockfish.ts` — Extract depth/nodes/nps/pv from UCI info lines
- `components/chess/chess-board-container.tsx` — Last move highlight, check highlight, board orientation prop
- `components/chess/chess-sidebar.tsx` — Full rewrite: CapturedPiecesCard, ChessClock, PgnTools, flip/resign/draw
- `components/chess/chess-info-panel.tsx` — Added AnalysisTools, SoundToggle, analysis data props
- `components/chess/chess-workspace.tsx` — Full rewrite: sound engine, clock, keyboard shortcuts, flip board, analysis data, mobile panels
- `docs/ROADMAP.md` — Milestone 15 status update
- `docs/CHANGELOG.md` — Milestone 15 changelog entry

## Verification
- ✓ Captured pieces computed correctly from any board position
- ✓ Chess clock ticks at 100ms intervals, switches turns, detects timeout
- ✓ PGN/FEN export, import, copy, download all functional
- ✓ Web Audio API sounds play on each move type (verified in-dev)
- ✓ Last move and check highlights visible on the board
- ✓ Flip board rotates between white and black perspectives
- ✓ Resign and offer draw record outcomes and reset the game
- ✓ Evaluation bar animates smoothly between positions
- ✓ Depth, nodes, speed displayed from engine analysis
- ✓ Keyboard shortcuts work when not focused on inputs
- ✓ Mobile layout adapts with toggleable panels

**Next:** Milestone 16 — Chat Interface
