/**
 * ──────────────────────────────────────────────────────────
 * PersonalitySelector  —  components/ai/PersonalitySelector.tsx
 *
 * Compact dropdown to switch between AI commentary personalities.
 * Persists selection to localStorage.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getPersonality, getAllPersonalities } from "@/lib/ai/personalities/registry";
import { getPersonalitySetting, setPersonalitySetting } from "@/lib/ai/personalities/settings";

/* ─── Props ──────────────────────────────────────────────── */

interface PersonalitySelectorProps {
  /** Triggered when the user selects a new personality. */
  onPersonalityChange?: (id: string) => void;
}

/* ─── Component ──────────────────────────────────────────── */

export function PersonalitySelector({
  onPersonalityChange,
}: PersonalitySelectorProps) {
  const [currentId, setCurrentId] = useState<string>(getPersonalitySetting());
  const personalities = getAllPersonalities();

  const handleChange = useCallback(
    (id: string) => {
      setPersonalitySetting(id);
      setCurrentId(id);
      onPersonalityChange?.(id);
    },
    [onPersonalityChange],
  );

  return (
    <Select value={currentId} onValueChange={handleChange}>
      <SelectTrigger className="h-7 w-fit gap-1.5 border-none bg-transparent px-1 text-xs shadow-none hover:bg-accent/50 [&_svg:not([class*='text-'])]:text-muted-foreground">
        <PersonalityAvatar personalityId={currentId} className="text-sm" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className="min-w-[180px]">
        {personalities.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <span className="mr-2 text-base">{p.avatar}</span>
            <span>{p.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ─── Inline Avatar Display ──────────────────────────────── */

interface PersonalityAvatarProps {
  personalityId: string;
  className?: string;
}

export function PersonalityAvatar({
  personalityId,
  className = "",
}: PersonalityAvatarProps) {
  const personality = getPersonality(personalityId);

  return (
    <motion.span
      key={personalityId}
      initial={{ scale: 0.6, rotate: -20, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      exit={{ scale: 0.6, rotate: 20, opacity: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 15 }}
      className={className}
      role="img"
      aria-label={`${personality.name} avatar`}
    >
      {personality.avatar}
    </motion.span>
  );
}
