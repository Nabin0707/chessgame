/**
 * Orchestrator — lib/ai/orchestrator/index.ts
 *
 * Re-exports for the commentary orchestration layer.
 */
export type {
  OrchestratorConfig,
  CommentaryQueueItem,
  CommentaryResult,
  OrchestratorEvent,
  FetchCommentaryFn,
} from "./types";
export { DEFAULT_ORCHESTRATOR_CONFIG } from "./types";
export { CommentaryOrchestrator } from "./orchestrator";
