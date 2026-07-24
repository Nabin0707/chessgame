"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { SITE_CONFIG } from "@/seo/config";

import {
  ChessKnight,
  Sparkles,
  Brain,
  Target,
  MessageSquareText,
  ArrowRight,
  BarChart3,
  BookOpen,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquareText,
    title: "AI Commentary",
    description:
      "Every move analysed by Gemini AI with contextual insights, reactions, and strategic tips.",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    icon: Brain,
    title: "Stockfish Engine",
    description:
      "Play against the world's strongest chess engine with adjustable difficulty levels.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: BarChart3,
    title: "Live Evaluation",
    description:
      "Real-time position evaluation with centipawn scores and depth indicators.",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    icon: Target,
    title: "Legal Move Help",
    description:
      "Click any piece to see all legal destinations — perfect for learning and improving.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: BookOpen,
    title: "Interactive Learning",
    description:
      "Undo moves, explore variations, and learn from AI-powered post-game analysis.",
    gradient: "from-rose-500 to-pink-500",
  },
  {
    icon: Sparkles,
    title: "Modern UX",
    description:
      "Sleek dark/light mode, responsive design, and smooth animations throughout.",
    gradient: "from-indigo-500 to-violet-500",
  },
];

function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right";
  className?: string;
}) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? 24 : 0,
      x: direction === "left" ? -24 : direction === "right" ? 24 : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration: 0.5, delay, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={variants}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main>
        {/* ─── Hero ─────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-border/40">
          {/* Decorative blobs */}
          <div className="absolute -top-40 -right-40 size-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 size-96 rounded-full bg-primary/5 blur-3xl" />

          <div className="relative mx-auto flex max-w-7xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:px-8 lg:py-32">
            <FadeIn delay={0}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary" aria-hidden="true" />
                Powered by Gemini AI &amp; Stockfish 18
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Where AI{" "}
                <span className="text-primary">Meets the</span> Chessboard
              </h1>
            </FadeIn>

            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
                Challenge Stockfish, learn from AI commentary, and master your
                game with real-time analysis — all in your browser.
              </p>
            </FadeIn>

            <FadeIn delay={0.3} className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Button size="lg" asChild className="gap-2 text-base">
                <Link href="/play">
                  <ChessKnight className="size-5" aria-hidden="true" />
                  Start Playing
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="gap-2 text-base">
                <a href="#features">
                  <BookOpen className="size-4" aria-hidden="true" />
                  Learn More
                </a>
              </Button>
            </FadeIn>

            <FadeIn delay={0.4} className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <ChessKnight className="size-4" aria-hidden="true" />
                Free to play
              </span>
              <span className="flex items-center gap-1.5">
                <Target className="size-4" aria-hidden="true" />
                No account needed
              </span>
              <span className="flex items-center gap-1.5">
                <Sparkles className="size-4" aria-hidden="true" />
                AI-powered
              </span>
            </FadeIn>
          </div>
        </section>

        {/* ─── Features ─────────────────────────────────────── */}
        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <FadeIn delay={0}>
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need to improve
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                AI-powered tools to analyse, learn, and master every aspect of
                your game.
              </p>
            </div>
          </FadeIn>

          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, index) => (
              <FadeIn key={feature.title} delay={0.1 + index * 0.08}>
                <motion.div
                  whileHover={{ y: -4, scale: 1.01 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="group relative rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className={`mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient} text-white shadow-sm`}
                  >
                    <feature.icon className="size-5" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* ─── CTA ──────────────────────────────────────────── */}
        <section className="border-t border-border/40 bg-muted/30">
          <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
            <FadeIn delay={0}>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to make your move?
              </h2>
            </FadeIn>
            <FadeIn delay={0.1}>
              <p className="mt-4 text-lg text-muted-foreground">
                Jump into a game and experience the future of AI-powered chess.
              </p>
            </FadeIn>
            <FadeIn delay={0.2} className="mt-8">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button size="lg" asChild className="gap-2 text-base">
                  <Link href="/play">
                    <ChessKnight className="size-5" aria-hidden="true" />
                    Play Now
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </motion.div>
            </FadeIn>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
