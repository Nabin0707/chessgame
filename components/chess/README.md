# components/chess/ — Chess UI Components

## Purpose
React components specific to chessboard rendering and player interaction.

## Responsibility
- Rendering the chessboard, pieces, and move indicators
- Handling drag-and-drop and click-to-move interactions
- Displaying legal move highlights and last-move indicators
- Pawn promotion dialog UI

## Files That Will Live Here
- `chess-board.tsx` — react-chessboard wrapper with move handling
- `square.tsx` — Individual square coordinate labels
- `move-indicators.tsx` — Legal move dots and highlights
- `promotion-dialog.tsx` — Pawn promotion piece picker
- `check-indicator.tsx` — Visual check animation

## Constraints
- These components focus on **presentation and interaction only**
- Chess logic (validation, move generation) lives in `lib/chess/`
- State management lives in `lib/store/`
- No direct imports from chess.js or Stockfish
