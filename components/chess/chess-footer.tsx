"use client";

export function ChessFooter() {
  return (
    <footer className="flex h-10 items-center justify-center border-t bg-background px-4 sm:px-6">
      <p className="text-xs text-muted-foreground">
        AI Chess Platform &copy; {new Date().getFullYear()} &mdash; Powered by
        Stockfish &amp; Gemini
      </p>
    </footer>
  );
}
