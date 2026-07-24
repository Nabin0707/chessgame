/**
 * ──────────────────────────────────────────────────────────
 * PgnTools  —  components/chess/PgnTools.tsx
 *
 * PGN and FEN import/export/copy/download tools.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  FileText,
  Copy,
  Download,
  Upload,
  FileCode,
  Check,
  AlertCircle,
} from "lucide-react";

import type { GameInstance } from "@/lib/chess/game";
import {
  exportPgn,
  exportFen,
  copyToClipboard,
  downloadPgn,
  downloadFen,
  importPgn,
  importFen,
} from "@/lib/chess/notation";

interface PgnToolsProps {
  className?: string;
  gameRef: React.RefObject<GameInstance | null>;
  onImport: (newGame: GameInstance) => void;
}

export function PgnTools({ className, gameRef, onImport }: PgnToolsProps) {
  const [pgnOpen, setPgnOpen] = useState(false);
  const [fenOpen, setFenOpen] = useState(false);
  const [pgnText, setPgnText] = useState("");
  const [fenText, setFenText] = useState("");
  const [status, setStatus] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);

  /* ── Copy PGN ────────────────────────────────────────── */

  const handleCopyPgn = useCallback(async () => {
    const game = gameRef.current;
    if (!game) return;
    const pgn = exportPgn(game);
    const ok = await copyToClipboard(pgn);
    setStatus({
      kind: ok ? "success" : "error",
      message: ok ? "PGN copied!" : "Failed to copy",
    });
    setTimeout(() => setStatus(null), 2000);
  }, [gameRef]);

  /* ── Download PGN ────────────────────────────────────── */

  const handleDownloadPgn = useCallback(() => {
    const game = gameRef.current;
    if (!game) return;
    downloadPgn(exportPgn(game));
    setStatus({ kind: "success", message: "PGN downloaded!" });
    setTimeout(() => setStatus(null), 2000);
  }, [gameRef]);

  /* ── Copy FEN ────────────────────────────────────────── */

  const handleCopyFen = useCallback(async () => {
    const game = gameRef.current;
    if (!game) return;
    const fen = exportFen(game);
    const ok = await copyToClipboard(fen);
    setStatus({
      kind: ok ? "success" : "error",
      message: ok ? "FEN copied!" : "Failed to copy",
    });
    setTimeout(() => setStatus(null), 2000);
  }, [gameRef]);

  /* ── Import PGN ──────────────────────────────────────── */

  const handleImportPgn = useCallback(() => {
    try {
      const newGame = importPgn(pgnText);
      onImport(newGame);
      setPgnOpen(false);
      setPgnText("");
      setStatus({ kind: "success", message: "PGN imported!" });
    } catch {
      setStatus({ kind: "error", message: "Invalid PGN" });
    }
    setTimeout(() => setStatus(null), 2000);
  }, [pgnText, onImport]);

  /* ── Import FEN ──────────────────────────────────────── */

  const handleImportFen = useCallback(() => {
    try {
      const newGame = importFen(fenText);
      onImport(newGame);
      setFenOpen(false);
      setFenText("");
      setStatus({ kind: "success", message: "FEN imported!" });
    } catch {
      setStatus({ kind: "error", message: "Invalid FEN" });
    }
    setTimeout(() => setStatus(null), 2000);
  }, [fenText, onImport]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <FileText className="size-4 text-primary" aria-hidden="true" />
            Notation Tools
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {/* Status feedback */}
            {status && (
              <div
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1 text-xs",
                  status.kind === "success"
                    ? "bg-green-500/10 text-green-600 dark:text-green-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400",
                )}
              >
                {status.kind === "success" ? (
                  <Check className="size-3" />
                ) : (
                  <AlertCircle className="size-3" />
                )}
                {status.message}
              </div>
            )}

            {/* PGN buttons */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleCopyPgn}
              >
                <Copy className="size-3" />
                PGN
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleDownloadPgn}
              >
                <Download className="size-3" />
                PGN
              </Button>

              {/* Import PGN dialog */}
              <Dialog open={pgnOpen} onOpenChange={setPgnOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <Upload className="size-3" />
                    PGN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import PGN</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <textarea
                      className="w-full h-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Paste PGN here…"
                      value={pgnText}
                      onChange={(e) => setPgnText(e.target.value)}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleImportPgn}
                      disabled={!pgnText.trim()}
                      className="w-full"
                    >
                      Import
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* FEN buttons */}
            <div className="flex flex-wrap gap-1">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs"
                onClick={handleCopyFen}
              >
                <Copy className="size-3" />
                FEN
              </Button>

              {/* Import FEN dialog */}
              <Dialog open={fenOpen} onOpenChange={setFenOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                    <FileCode className="size-3" />
                    FEN
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Import FEN</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <input
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      placeholder="Paste FEN here…"
                      value={fenText}
                      onChange={(e) => setFenText(e.target.value)}
                    />
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleImportFen}
                      disabled={!fenText.trim()}
                      className="w-full"
                    >
                      Import
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
