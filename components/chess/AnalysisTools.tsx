/**
 * ──────────────────────────────────────────────────────────
 * AnalysisTools  —  components/chess/AnalysisTools.tsx
 *
 * Evaluation bar with engine stats (depth, nodes, speed).
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Search,
  Hash,
  Cpu,
  Zap,
  Target,
} from "lucide-react";

import type { EvalScore } from "@/types/engine";

/* ─── Props ──────────────────────────────────────────────── */

interface AnalysisToolsProps {
  className?: string;
  evalScore: EvalScore | null;
  isThinking: boolean;
  depth?: number;
  nodes?: number;
  speed?: number;
  bestMove?: string;
}

/* ─── Component ──────────────────────────────────────────── */

export function AnalysisTools({
  className,
  evalScore,
  isThinking,
  depth,
  nodes,
  speed,
  bestMove,
}: AnalysisToolsProps) {
  const hasData = evalScore !== null || isThinking;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Cpu className="size-4 text-primary" aria-hidden="true" />
            Engine Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasData ? (
            <p className="text-sm text-muted-foreground">
              Waiting for engine…
            </p>
          ) : (
            <div className="space-y-2">
              {/* Evaluation bar */}
              <EvalBar score={evalScore} isThinking={isThinking} />

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <StatItem
                  icon={<Hash className="size-3" />}
                  label="Depth"
                  value={depth != null ? String(depth) : "-"}
                />
                <StatItem
                  icon={<Zap className="size-3" />}
                  label="Nodes"
                  value={nodes != null ? formatCount(nodes) : "-"}
                />
                <StatItem
                  icon={<Search className="size-3" />}
                  label="Speed"
                  value={speed != null ? formatSpeed(speed) : "-"}
                />
              </div>

              {/* Best move */}
              {bestMove && (
                <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1.5 text-xs">
                  <Target className="size-3 text-primary" />
                  <span className="text-muted-foreground">Best:</span>
                  <span className="font-mono font-medium">{bestMove}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── EvalBar ────────────────────────────────────────────── */

function EvalBar({
  score,
  isThinking,
}: {
  score: EvalScore | null;
  isThinking: boolean;
}) {
  // Convert cp/mate to 0-100 percentage (50 = equal)
  const percentage = scoreToPercent(score);
  const orientation = scoreOrientation(score);

  return (
    <div className="space-y-1">
      {/* Score label */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold tabular-nums">
          {score ? formatScore(score) : "-"}
        </span>
        {isThinking && (
          <span className="flex items-center gap-1 text-muted-foreground">
            <Search className="size-3 animate-pulse" />
            thinking…
          </span>
        )}
      </div>

      {/* Bar */}
      <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
        <motion.div
          className={cn(
            "absolute inset-y-0 rounded-full transition-colors",
            orientation === "white"
              ? "bg-amber-500"
              : orientation === "black"
                ? "bg-slate-600"
                : "bg-muted-foreground/30",
          )}
          initial={false}
          animate={{
            left: orientation === "black" ? `${100 - percentage}%` : "50%",
            right: orientation === "white" ? `${100 - percentage}%` : "50%",
          }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
        />
      </div>

      {/* Perspective labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>White</span>
        <span>Black</span>
      </div>
    </div>
  );
}

/* ─── StatItem ───────────────────────────────────────────── */

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted/50 px-2 py-1">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-muted-foreground">{label}:</span>
      <span className="font-mono font-medium tabular-nums">{value}</span>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */

function scoreToPercent(score: EvalScore | null): number {
  if (!score) return 50;
  if (score.type === "mate") {
    return score.value > 0 ? 95 : 5;
  }
  const cp = score.value;
  const clamped = Math.max(-500, Math.min(500, cp));
  return 50 + (clamped / 500) * 45;
}

function scoreOrientation(
  score: EvalScore | null,
): "white" | "black" | "equal" {
  if (!score) return "equal";
  if (score.type === "mate") {
    return score.value > 0 ? "white" : "black";
  }
  if (score.value > 30) return "white";
  if (score.value < -30) return "black";
  return "equal";
}

function formatScore(score: EvalScore): string {
  if (score.type === "mate") {
    const m = score.value;
    return `#${m > 0 ? "+" : ""}${Math.abs(m)}`;
  }
  const sign = score.value >= 0 ? "+" : "-";
  return `${sign}${(Math.abs(score.value) / 100).toFixed(2)}`;
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatSpeed(s: number): string {
  if (s >= 1_000_000) return `${(s / 1_000_000).toFixed(1)}M`;
  if (s >= 1_000) return `${(s / 1_000).toFixed(0)}K`;
  return String(s);
}
