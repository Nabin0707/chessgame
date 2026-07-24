"use client";

import Link from "next/link";
import { ChessKnight, Github, Heart } from "lucide-react";

import { SITE_CONFIG } from "@/seo/config";

const FOOTER_LINKS = [
  {
    title: "Product",
    links: [
      { label: "Play", href: "/play" },
      { label: "Analysis", href: "#" },
      { label: "Learn", href: "#" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "GitHub", href: SITE_CONFIG.links.github, external: true },
      { label: "About", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/30" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Brand */}
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg"
            >
              <ChessKnight className="size-5 text-primary" aria-hidden="true" />
              {SITE_CONFIG.name}
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              Master the board with AI-powered commentary, Stockfish analysis,
              and interactive learning tools.
            </p>
            <p className="text-xs text-muted-foreground">
              <a
                href="https://chess.nabinghimire23.com.np"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                chess.nabinghimire23.com.np
              </a>
            </p>
          </div>

          {/* Nav columns */}
          {FOOTER_LINKS.map((group) => (
            <div key={group.title} className="space-y-3">
              <h3 className="text-sm font-semibold">{group.title}</h3>
              <ul className="space-y-2">
                {group.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      target={link.external ? "_blank" : undefined}
                      rel={link.external ? "noopener noreferrer" : undefined}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {new Date().getFullYear()}{" "}
            <a
              href={SITE_CONFIG.authorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              {SITE_CONFIG.author}
            </a>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>v{SITE_CONFIG.version}</span>
            <span className="flex items-center gap-1">
              Built with
              <Heart className="size-3 fill-current text-red-500" aria-hidden="true" />
              in Nepal
            </span>
            <a
              href={SITE_CONFIG.links.github}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
              aria-label="GitHub repository"
            >
              <Github className="size-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
