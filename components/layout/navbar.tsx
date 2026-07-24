"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/providers/theme-provider";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SITE_CONFIG } from "@/seo/config";

import {
  ChessKnight,
  Sun,
  Moon,
  Github,
  Menu,
  X,
  Swords,
  BookOpen,
  Info,
  Monitor,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Play", href: "/play", icon: Swords },
  { label: "Analysis", href: "#", icon: Monitor, disabled: true },
  { label: "Learn", href: "#", icon: BookOpen, disabled: true },
  { label: "About", href: "#", icon: Info, disabled: true },
];

export function Navbar() {
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { setTheme, resolvedTheme } = useTheme();

  /* Avoid hydration mismatch: wait for mount before reading theme */
  useEffect(() => { setMounted(true); }, []);

  const isDark = resolvedTheme === "dark";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold text-lg tracking-tight transition-opacity hover:opacity-80"
        >
          <ChessKnight className="size-6 text-primary" aria-hidden="true" />
          <span className="hidden sm:inline">{SITE_CONFIG.name}</span>
          <span className="sm:hidden">AI Chess</span>
        </Link>

        {/* Desktop nav links */}
        <div className="ml-10 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Button
                key={link.label}
                variant={isActive ? "secondary" : "ghost"}
                size="sm"
                asChild
                disabled={link.disabled}
                className={cn(
                  "relative gap-1.5",
                  link.disabled && "cursor-not-allowed opacity-50",
                )}
              >
                <Link href={link.href} aria-disabled={link.disabled}>
                  <link.icon className="size-4" aria-hidden="true" />
                  {link.label}
                  {link.disabled && (
                    <span className="ml-1 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Soon
                    </span>
                  )}
                </Link>
              </Button>
            );
          })}
        </div>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2">
          {/* Theme toggle — placeholder during SSR to avoid hydration mismatch */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? "light" : "dark")}
            aria-label={mounted ? `Switch to ${isDark ? "light" : "dark"} mode` : "Toggle theme"}
            className="relative"
          >
            {mounted ? (
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={isDark ? "moon" : "sun"}
                  initial={{ y: -10, opacity: 0, rotate: -90 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  exit={{ y: 10, opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.2 }}
                >
                  {isDark ? (
                    <Moon className="size-4" aria-hidden="true" />
                  ) : (
                    <Sun className="size-4" aria-hidden="true" />
                  )}
                </motion.div>
              </AnimatePresence>
            ) : (
              <div className="size-4" />
            )}
          </Button>

          {/* GitHub */}
          <Button
            variant="ghost"
            size="icon"
            asChild
            aria-label="View source on GitHub"
          >
            <a
              href={SITE_CONFIG.links.github}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="size-4" aria-hidden="true" />
            </a>
          </Button>

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" aria-hidden="true" />
          </Button>
        </div>
      </nav>

      {/* Mobile menu drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden="true"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 right-0 z-50 w-72 border-l bg-background p-6 shadow-xl md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Mobile navigation"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="font-bold text-lg">Menu</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close navigation menu"
                >
                  <X className="size-5" aria-hidden="true" />
                </Button>
              </div>

              <nav className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Button
                    key={link.label}
                    variant={
                      pathname === link.href ? "secondary" : "ghost"
                    }
                    className="justify-start gap-3 text-base"
                    asChild
                    disabled={link.disabled}
                    onClick={() => setMobileOpen(false)}
                  >
                    <Link
                      href={link.href}
                      aria-disabled={link.disabled}
                    >
                      <link.icon className="size-5" aria-hidden="true" />
                      {link.label}
                      {link.disabled && (
                        <span className="ml-auto rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          Soon
                        </span>
                      )}
                    </Link>
                  </Button>
                ))}

                <hr className="my-4 border-border" />

                <Button
                  variant="ghost"
                  className="justify-start gap-3 text-base"
                  onClick={() => {
                    setTheme(isDark ? "light" : "dark");
                  }}
                >
                  {mounted ? (
                    isDark ? (
                      <Sun className="size-5" aria-hidden="true" />
                    ) : (
                      <Moon className="size-5" aria-hidden="true" />
                    )
                  ) : (
                    <div className="size-5" />
                  )}
                  {mounted ? (isDark ? "Light Mode" : "Dark Mode") : "Theme"}
                </Button>

                <Button
                  variant="ghost"
                  className="justify-start gap-3 text-base"
                  asChild
                >
                  <a
                    href={SITE_CONFIG.links.github}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Github className="size-5" aria-hidden="true" />
                    GitHub
                  </a>
                </Button>
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
