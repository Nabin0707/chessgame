"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const NAV_ITEMS: Array<{ label: string; href: string; active: boolean }> = [
  { label: "Play", href: "/play", active: true },
  { label: "Analysis", href: "#", active: false },
  { label: "Puzzles", href: "#", active: false },
  { label: "Games", href: "#", active: false },
];

export function ChessHeader() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <a
        href="/"
        className="flex items-center gap-2 font-bold text-lg tracking-tight"
      >
        <span className="text-foreground">♚</span>
        <span className="hidden sm:inline">AI Chess Platform</span>
        <span className="sm:hidden">Chess</span>
      </a>

      <Separator orientation="vertical" className="h-6" />

      <nav className="flex items-center gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => (
          <Button
            key={item.label}
            variant={item.active ? "secondary" : "ghost"}
            size="sm"
            asChild
          >
            <a href={item.href}>{item.label}</a>
          </Button>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Toggle theme (coming soon)"
          disabled
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
        </Button>
      </div>
    </header>
  );
}
