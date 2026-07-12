import { Chess, Square as ChessJsSquare } from "chess.js";

import type { MoveRecord } from "@/types/chess";
import type { GameStatus, MoveResult } from "@/types/chess";

/**
 * Opaque handle to a chess.js instance.
 * UI code receives this handle but never calls chess.js methods directly.
 */
export type GameInstance = Chess;

/**
 * Create a new game in the standard starting position.
 */
export function createGame(): GameInstance {
  return new Chess();
}

/**
 * Attempt to move a piece from one square to another.
 * Returns success with the move's SAN notation, new FEN, and updated status,
 * or failure with an error message.
 */
export function makeMove(
  game: GameInstance,
  from: string,
  to: string,
  promotion?: string,
): MoveResult {
  try {
    const move = game.move({
      from,
      to,
      promotion: promotion ?? "q",
    });

    return {
      success: true,
      san: move.san,
      fen: game.fen(),
      status: deriveGameStatus(game),
    };
  } catch {
    return {
      success: false,
      error: "Illegal move",
    };
  }
}

/**
 * Undo the last half-move.  Returns `true` if a move was undone,
 * `false` if there were no moves to undo.
 */
export function undoMove(game: GameInstance): boolean {
  return game.undo() !== null;
}

/**
 * Reset the game back to the standard starting position.
 * Returns a *new* GameInstance – the caller must replace state.
 */
export function resetGame(): GameInstance {
  return new Chess();
}

/**
 * Return the current FEN string.
 */
export function getFen(game: GameInstance): string {
  return game.fen();
}

/**
 * Return the current PGN string.
 */
export function getPgn(game: GameInstance): string {
  return game.pgn();
}

/**
 * Return a simplified move-history array suitable for UI rendering.
 */
export function getMoveHistory(game: GameInstance): MoveRecord[] {
  const moves = game.history({ verbose: true });

  return moves.map((m) => ({
    san: m.san,
    from: m.from as MoveRecord["from"],
    to: m.to as MoveRecord["to"],
    color: m.color as MoveRecord["color"],
    piece: m.piece as MoveRecord["piece"],
    captured: m.captured as MoveRecord["captured"] | undefined,
    promotion: m.promotion as MoveRecord["promotion"] | undefined,
    flags: m.flags,
  }));
}

/**
 * Get legal moves for a specific square (SAN strings).
 */
export function getLegalMoves(
  game: GameInstance,
  square?: string,
): string[] {
  if (square) {
    return game.moves({ square: square as ChessJsSquare, verbose: false });
  }
  return game.moves({ verbose: false });
}

/**
 * Check whether moving from → to is legal for the side to move.
 */
export function isLegalMove(
  game: GameInstance,
  from: string,
  to: string,
): boolean {
  const moves = game.moves({ square: from as ChessJsSquare, verbose: true });
  return moves.some((m) => m.to === to);
}

/**
 * Derive the current game status from a chess.js instance.
 */
export function getGameStatus(game: GameInstance): GameStatus {
  return deriveGameStatus(game);
}

function deriveGameStatus(game: GameInstance): GameStatus {
  const turn = game.turn() as "w" | "b";
  const inCheck = game.isCheck();

  if (game.isCheckmate()) {
    return { kind: "checkmate", winner: turn === "w" ? "b" : "w" };
  }

  if (game.isStalemate()) {
    return { kind: "stalemate" };
  }

  if (game.isDraw()) {
    if (game.isInsufficientMaterial()) {
      return { kind: "draw", reason: "insufficient-material" };
    }
    if (game.isThreefoldRepetition()) {
      return { kind: "draw", reason: "threefold-repetition" };
    }
    if (game.isDrawByFiftyMoves()) {
      return { kind: "draw", reason: "fifty-move-rule" };
    }
    return { kind: "draw", reason: "agreement" };
  }

  if (inCheck) {
    return { kind: "check", turn, inCheck: true };
  }

  return { kind: "playing", turn, inCheck: false };
}
