/**
 * ──────────────────────────────────────────────────────────
 * Prompt Template Definitions  —  lib/ai/prompts/
 *                                  templates.ts
 *
 * Template shells that describe the structure of prompts
 * the system WILL construct at runtime.  These are
 * definitions only — NO Gemini calls happen here.
 *
 * # Prompt Generation Pipeline
 *
 *   Player Move
 *        ↓
 *   Chess.js processes move
 *        ↓
 *   Stockfish evaluates position
 *        ↓
 *   Context Builder aggregates { game, move, eval }  ←  context/
 *        ↓
 *   Memory Builder loads conversation history          ←  memory/
 *        ↓
 *   Prompt Builder:
 *     1. Selects template by event type
 *     2. Injects personality reactions & style
 *     3. Substitutes {variables} from context
 *     4. Inserts conversation memory
 *     5. Appends global safety constraints
 *        ↓
 *   Gemini (future)
 *        ↓
 *   Formatter parses and grades response              ←  formatter/
 *        ↓
 *   UI renders commentary
 * ──────────────────────────────────────────────────────────
 */

import type { PromptTemplate } from "./types";

/* ─── Shared Constraints ─────────────────────────────── *
 * These are injected into EVERY system prompt to enforce
 * the "Gemini never outputs moves" rule at multiple
 * layers.  See ADR-002 and ADR-006.
 *
 * The output validation layer in lib/ai/validation.ts
 * will additionally regex-check all responses before
 * they reach the UI.
 * ─────────────────────────────────────────────────────── */

const GLOBAL_CONSTRAINTS: string[] = [
  "You NEVER output chess moves in algebraic notation (e.g. e2e4, Nf3, O-O).",
  "You NEVER recommend a specific move for the player to play.",
  "You discuss positional concepts, strategies, and ideas — never concrete moves.",
  "If the player asks 'what should I play?', politely decline and offer strategic advice instead.",
  "You do not output UCI notation, SAN notation, or any chess move format.",
  "Your commentary is educational and entertaining, not prescriptive.",
  "Keep responses concise — under 200 words unless analysing a complex position.",
];

/* ─── System Prompt Shell ────────────────────────────── *
 * This is the base system prompt structure.  At runtime,
 * the personality's styleGuide and the personality-specific
 * constraints are interpolated.
 * ─────────────────────────────────────────────────────── */

const SYSTEM_PROMPT_SHELL = `You are {personalityName}, an AI chess commentator on the AI Chess Platform.

{personalityDescription}

## Your Style

{styleGuide}

## Your Role

You provide entertaining and educational commentary on chess games.
You analyse positions, explain strategic concepts, and help players
understand the game better.  You NEVER tell the player what move to play.

## Global Rules

{constraints}

## Response Format

Respond in {responseFormat} format. Keep responses concise and engaging.
`;

/* ─── Commentary Templates ──────────────────────────── *
 * These will be loaded by category.  The actual prompt
 * builder will interpolate personality data at runtime.
 * ─────────────────────────────────────────────────────── */

const COMMENTARY_AFTER_MOVE: PromptTemplate = {
  id: "commentary-after-move",
  name: "Commentary After Move",
  category: "commentary",
  description:
    "Generated after every player move. Comments on the move quality, position, and provides strategic insight.",
  systemPrompt: SYSTEM_PROMPT_SHELL,
  userPromptTemplate: [
    "The player ({playerColor}) just played {lastMove} on move {moveNumber}.",
    "",
    "Current position (FEN): {fen}",
    "Game PGN: {pgn}",
    "",
    "Engine evaluation: {evalScore} (depth {depth})",
    "Best line according to engine: {bestLine}",
    "",
    "Move quality assessment: {moveQuality}",
    "Centipawn loss: {centipawnLoss}",
    "",
    "Category of this event: {reactionType}",
    "",
    "Personality reaction template: {reactionTemplate}",
    "",
    "Generate 2-3 sentences of commentary. Provide one strategic insight or learning takeaway.",
    "If it was a mistake or blunder, briefly explain the positional idea the player missed.",
    "If it was a good move, explain why it's strong.",
    "End with one follow-up question the player could ask you.",
  ].join("\n"),
  responseFormat: "json",
  constraints: [
    ...GLOBAL_CONSTRAINTS,
    "Do not reference the engine's evaluation as 'my analysis' — frame it as Stockfish's analysis.",
  ],
  variables: [
    { name: "playerColor", description: "The player's color", type: "string", required: true },
    { name: "lastMove", description: "The SAN of the last move played", type: "move", required: true },
    { name: "moveNumber", description: "Current move number", type: "number", required: true },
    { name: "fen", description: "FEN of the current position", type: "fen", required: true },
    { name: "pgn", description: "Game PGN up to this point", type: "pgn", required: true },
    { name: "evalScore", description: "Engine evaluation string", type: "evaluation", required: true },
    { name: "depth", description: "Engine search depth", type: "number", required: true },
    { name: "bestLine", description: "Engine's best line", type: "list", required: true },
    { name: "moveQuality", description: "Quality label (brilliant/good/mistake/blunder)", type: "string", required: true },
    { name: "centipawnLoss", description: "Centipawn loss of the move", type: "number", required: true },
    { name: "reactionType", description: "Type of reaction event", type: "string", required: true },
    { name: "reactionTemplate", description: "Personality's reaction template string", type: "string", required: true },
  ],
  maxResponseLength: 800,
};

const POSITION_ANALYSIS: PromptTemplate = {
  id: "position-analysis",
  name: "Position Analysis",
  category: "analysis",
  description:
    "Deep analysis of a specific position. Used in post-game analysis mode.",
  systemPrompt: SYSTEM_PROMPT_SHELL,
  userPromptTemplate: [
    "Analyse this chess position:",
    "",
    "FEN: {fen}",
    "Move number: {moveNumber}",
    "Turn: {turn}",
    "",
    "Game context: {gameContext}",
    "",
    "Engine evaluation: {evalScore} (depth {depth})",
    "Top 3 engine lines:",
    "{multiPv}",
    "",
    "{additionalContext}",
    "",
    "Provide a concise positional analysis covering:",
    "1. Key features of the position (pawn structure, piece activity, king safety)",
    "2. The main strategic plans for both sides",
    "3. What the engine's top line suggests and why",
    "4. A learning takeaway for the player",
  ].join("\n"),
  responseFormat: "text",
  constraints: [
    ...GLOBAL_CONSTRAINTS,
    "Structure your analysis with clear sections.",
    "Use chess terminology but explain specialised terms briefly.",
  ],
  variables: [
    { name: "fen", description: "FEN of the position to analyse", type: "fen", required: true },
    { name: "moveNumber", description: "Current move number", type: "number", required: true },
    { name: "turn", description: "Whose turn it is", type: "string", required: true },
    { name: "gameContext", description: "Brief game context (history, phase)", type: "string", required: false },
    { name: "evalScore", description: "Engine evaluation", type: "evaluation", required: true },
    { name: "depth", description: "Engine depth", type: "number", required: true },
    { name: "multiPv", description: "Multiple engine lines", type: "list", required: false },
    { name: "additionalContext", description: "Additional context from the analysis request", type: "string", required: false },
  ],
  maxResponseLength: 1500,
};

const CHAT_MESSAGE: PromptTemplate = {
  id: "chat-message",
  name: "Chat Message",
  category: "chat",
  description:
    "Free-form chat between the player and the AI commentator. Context includes the current board position.",
  systemPrompt: SYSTEM_PROMPT_SHELL,
  userPromptTemplate: [
    "The player asks: \"{playerMessage}\"",
    "",
    "Current position (FEN): {fen}",
    "Game PGN: {pgn}",
    "Move number: {moveNumber}",
    "",
    "Engine evaluation: {evalScore}",
    "",
    "Conversation history (last {historyLength} messages):",
    "{conversationHistory}",
    "",
    "Respond to the player's question in character as {personalityName}.",
    "Be helpful, engaging, and consistent with your personality.",
    "{additionalInstructions}",
  ].join("\n"),
  responseFormat: "text",
  constraints: [
    ...GLOBAL_CONSTRAINTS,
    "Stay in character — you are {personalityName}, not a generic AI.",
    "If the player asks you to analyse a specific line, describe the ideas without outputting moves.",
    "If the player asks 'what should I play?', politely explain you can't recommend moves.",
  ],
  variables: [
    { name: "playerMessage", description: "The player's message", type: "string", required: true },
    { name: "fen", description: "Current FEN", type: "fen", required: true },
    { name: "pgn", description: "Game PGN", type: "pgn", required: true },
    { name: "moveNumber", description: "Current move number", type: "number", required: true },
    { name: "evalScore", description: "Engine evaluation", type: "evaluation", required: true },
    { name: "historyLength", description: "Number of messages in history", type: "number", required: true },
    { name: "conversationHistory", description: "Previous messages", type: "string", required: false },
    { name: "additionalInstructions", description: "Additional chat instructions", type: "string", required: false },
  ],
  maxResponseLength: 1000,
};

const POST_GAME_SUMMARY: PromptTemplate = {
  id: "post-game-summary",
  name: "Post-Game Summary",
  category: "post-game",
  description:
    "Generated at the end of a game. Summarises key moments, critical mistakes, and learning takeaways.",
  systemPrompt: SYSTEM_PROMPT_SHELL,
  userPromptTemplate: [
    "The game has ended! Here is the full game:",
    "",
    "PGN: {pgn}",
    "Result: {result}",
    "Total moves: {moveCount}",
    "",
    "Player accuracy: {accuracy}%",
    "Number of blunders: {blunderCount}",
    "Number of mistakes: {mistakeCount}",
    "Number of brilliant moves: {brilliantCount}",
    "",
    "Key moments (engine evaluations at critical points):",
    "{keyMoments}",
    "",
    "Provide:",
    "1. A one-sentence summary of how the game went",
    "2. The critical moment where the game turned",
    "3. One thing the player did well",
    "4. One thing to work on for next time",
    "5. An encouraging closing message in character as {personalityName}",
  ].join("\n"),
  responseFormat: "json",
  constraints: [
    ...GLOBAL_CONSTRAINTS,
    "Keep the summary constructive and encouraging.",
    "Focus on learning and improvement, not just results.",
  ],
  variables: [
    { name: "pgn", description: "Full game PGN", type: "pgn", required: true },
    { name: "result", description: "Game result (1-0, 0-1, 1/2-1/2)", type: "string", required: true },
    { name: "moveCount", description: "Total moves played", type: "number", required: true },
    { name: "accuracy", description: "Player's accuracy percentage", type: "number", required: true },
    { name: "blunderCount", description: "Number of blunders", type: "number", required: true },
    { name: "mistakeCount", description: "Number of mistakes", type: "number", required: true },
    { name: "brilliantCount", description: "Number of brilliant moves", type: "number", required: true },
    { name: "keyMoments", description: "Key moments with engine eval changes", type: "list", required: true },
  ],
  maxResponseLength: 1000,
  minimumLevel: "beginner",
};

/* ─── Template Registry ──────────────────────────────── */

/** All available prompt templates, indexed by id. */
export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  [COMMENTARY_AFTER_MOVE.id]: COMMENTARY_AFTER_MOVE,
  [POSITION_ANALYSIS.id]: POSITION_ANALYSIS,
  [CHAT_MESSAGE.id]: CHAT_MESSAGE,
  [POST_GAME_SUMMARY.id]: POST_GAME_SUMMARY,
};

/** Templates grouped by category for easy selection. */
export const PROMPT_TEMPLATES_BY_CATEGORY: Record<
  string,
  PromptTemplate[]
> = Object.values(PROMPT_TEMPLATES).reduce(
  (acc, template) => {
    if (!acc[template.category]) acc[template.category] = [];
    acc[template.category].push(template);
    return acc;
  },
  {} as Record<string, PromptTemplate[]>,
);
