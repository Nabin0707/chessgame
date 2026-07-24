/**
 * ──────────────────────────────────────────────────────────
 * useKeyboardShortcuts  —  hooks/useKeyboardShortcuts.ts
 *
 * Registers global keyboard shortcuts with input-field
 * detection to avoid triggering while typing.
 * ──────────────────────────────────────────────────────────
 */

"use client";

import { useEffect } from "react";

export interface ShortcutMap {
  [key: string]: () => void;
}

const INPUT_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Register keyboard shortcuts.  Shortcuts are ignored when
 * the user is focused on an input / textarea / select element.
 * Set `enabled = false` to temporarily disable shortcuts.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutMap,
  enabled = true,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = event.target as HTMLElement;
      if (INPUT_TAGS.has(target.tagName)) return;
      if (target.isContentEditable) return;

      // Ignore modifier combos (Ctrl, Meta, Alt)
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const key = event.key.toLowerCase();

      if (shortcuts[key]) {
        event.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [shortcuts, enabled]);
}
