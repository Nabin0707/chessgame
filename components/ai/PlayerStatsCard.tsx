/**
 * ──────────────────────────────────────────────────────────
 * PlayerStatsCard  —  components/ai/PlayerStatsCard.tsx
 *
 * Displays aggregated player statistics from local memory.
 * Includes memory management (reset, export, import).
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Trophy,
  TrendingDown,
  RotateCcw,
  Download,
  Upload,
  Swords,
  Target,
  BarChart3,
  AlertTriangle,
  Flame,
} from "lucide-react";

import {
  loadMemory,
  resetMemory as resetMemoryData,
  exportMemoryJson,
  importMemoryJson,
} from "@/lib/ai/memory/storage";
import {
  computeProfile,
  estimateAccuracy,
  computeWinStreak,
  computeLossStreak,
} from "@/lib/ai/memory/statistics";

import type { MemoryData, PlayerProfile } from "@/lib/ai/memory/types";

/* ─── Props ──────────────────────────────────────────────── */

interface PlayerStatsCardProps {
  className?: string;
}

/* ─── Component ──────────────────────────────────────────── */

export function PlayerStatsCard({ className }: PlayerStatsCardProps) {
  const [memory, setMemory] = useState<MemoryData>(() => loadMemory());
  const [showSettings, setShowSettings] = useState(false);

  const refresh = useCallback(() => {
    const data = loadMemory();
    setMemory(data);
  }, []);

  const profile = computeProfile(memory.stats);
  const accuracy = estimateAccuracy(memory.stats);
  const winStreak = computeWinStreak(memory.recentGames);
  const lossStreak = computeLossStreak(memory.recentGames);
  const hasData = memory.stats.gamesPlayed > 0;

  const handleReset = useCallback(() => {
    resetMemoryData();
    refresh();
    setShowSettings(false);
  }, [refresh]);

  const handleExport = useCallback(() => {
    const json = exportMemoryJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "chess-memory.json";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleImport = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (importMemoryJson(text)) {
          refresh();
          setShowSettings(false);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [refresh]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <BarChart3 className="size-4 text-primary" aria-hidden="true" />
            Player Stats
            <span className="ml-auto">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => setShowSettings(!showSettings)}
              >
                {showSettings ? "Done" : "Memory"}
              </Button>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {!hasData ? (
              <motion.p
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm text-muted-foreground"
              >
                Complete a game to see statistics.
              </motion.p>
            ) : showSettings ? (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-2"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={handleExport}
                >
                  <Download className="size-3.5" />
                  Export Memory
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={handleImport}
                >
                  <Upload className="size-3.5" />
                  Import Memory
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="justify-start gap-2"
                  onClick={handleReset}
                >
                  <RotateCcw className="size-3.5" />
                  Reset Memory
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {/* Record row */}
                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  <StatCell
                    label="Games"
                    value={String(memory.stats.gamesPlayed)}
                    icon={<Swords className="size-3" />}
                  />
                  <StatCell
                    label="Wins"
                    value={String(memory.stats.wins)}
                    icon={<Trophy className="size-3 text-amber-500" />}
                    highlight
                  />
                  <StatCell
                    label="Loss"
                    value={String(memory.stats.losses)}
                    icon={<TrendingDown className="size-3 text-red-500" />}
                  />
                  <StatCell
                    label="Draws"
                    value={String(memory.stats.draws)}
                    icon={<Swords className="size-3 text-muted-foreground" />}
                  />
                </div>

                {/* Profile details */}
                <div className="space-y-1.5 text-xs">
                  <InfoRow
                    icon={<Trophy className="size-3" />}
                    label="Level"
                    value={profile.level}
                  />
                  <InfoRow
                    icon={<Target className="size-3" />}
                    label="Style"
                    value={profile.playStyle}
                  />
                  <InfoRow
                    icon={<Swords className="size-3" />}
                    label="Opening"
                    value={profile.favouriteOpening}
                  />
                  <InfoRow
                    icon={<BarChart3 className="size-3" />}
                    label="Accuracy"
                    value={`${accuracy}%`}
                  />
                  <InfoRow
                    icon={<AlertTriangle className="size-3" />}
                    label="Weakness"
                    value={profile.biggestWeakness}
                  />
                </div>

                {/* Streak row */}
                {(winStreak > 0 || lossStreak > 0) && (
                  <div className="flex items-center gap-2 text-xs">
                    {winStreak > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <Flame className="size-3" />
                        {winStreak}W streak
                      </span>
                    )}
                    {lossStreak > 0 && (
                      <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                        <TrendingDown className="size-3" />
                        {lossStreak}L streak
                      </span>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function StatCell({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 p-2">
      <span className="flex items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-semibold tabular-nums",
          highlight && "text-amber-600 dark:text-amber-400",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex w-20 items-center gap-1 text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="font-medium capitalize">{value}</span>
    </div>
  );
}
