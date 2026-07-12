export type Square = `${File}${Rank}`;
export type File = "a" | "b" | "c" | "d" | "e" | "f" | "g" | "h";
export type Rank = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8";
export type Color = "w" | "b";
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";

export type FEN = string & { readonly __brand: "FEN" };
export type PGN = string & { readonly __brand: "PGN" };

export interface MoveRecord {
  san: string;
  color: Color;
  from: Square;
  to: Square;
  piece: PieceType;
  captured?: PieceType;
  promotion?: PieceType;
  flags: string;
}

export type GameStatus =
  | { kind: "playing"; turn: Color; inCheck: false }
  | { kind: "check"; turn: Color; inCheck: true }
  | { kind: "checkmate"; winner: Color }
  | { kind: "stalemate" }
  | { kind: "draw"; reason: DrawReason };

export type DrawReason =
  | "insufficient-material"
  | "threefold-repetition"
  | "fifty-move-rule"
  | "agreement";

export interface MoveResult {
  success: boolean;
  san?: string;
  fen?: string;
  status?: GameStatus;
  error?: string;
}

export interface BoardOrientation {
  kind: "white" | "black";
}
