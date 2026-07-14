/**
 * Context — lib/ai/context/index.ts
 *
 * Context builder system that aggregates game state,
 * engine evaluation, player profile, and memory into
 * a single CommentaryContext for the prompt builder.
 */
export type {
  AssembleContextParams,
  BuildGameContextParams,
  BuildMoveContextParams,
  BuildPlayerContextParams,
  ContextAssembler,
  ContextConfig,
  GameContextBuilder,
  MoveContextBuilder,
  PlayerContextBuilder,
} from "./types";
