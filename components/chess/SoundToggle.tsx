/**
 * ──────────────────────────────────────────────────────────
 * SoundToggle  —  components/chess/SoundToggle.tsx
 *
 * Mute / unmute toggle for the in-game sound system.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";

import type { SoundEngine } from "@/lib/chess/sound";

interface SoundToggleProps {
  soundEngine: SoundEngine;
}

export function SoundToggle({ soundEngine }: SoundToggleProps) {
  const [muted, setMuted] = useState(soundEngine.isMuted());

  const handleToggle = () => {
    soundEngine.toggle();
    setMuted(soundEngine.isMuted());
  };

  return (
    <motion.div whileTap={{ scale: 0.9 }}>
      <Button
        variant="ghost"
        size="icon"
        className="size-8"
        onClick={handleToggle}
        aria-label={muted ? "Unmute sounds" : "Mute sounds"}
        title={muted ? "Unmute" : "Mute"}
      >
        {muted ? (
          <VolumeX className="size-4 text-muted-foreground" aria-hidden="true" />
        ) : (
          <Volume2 className="size-4 text-primary" aria-hidden="true" />
        )}
      </Button>
    </motion.div>
  );
}
