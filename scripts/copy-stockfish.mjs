#!/usr/bin/env node

/**
 * Copies the Stockfish WASM worker files from node_modules to public/
 * so they can be served as static assets by Next.js.
 *
 * The stockfish npm package (nmrugg/stockfish.js) ships its browser-ready
 * files in node_modules/stockfish/bin/.  Since the browser cannot directly
 * access node_modules, we copy the files we need to public/stockfish/.
 *
 * This runs automatically after `npm install` via the "postinstall" script.
 */

import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const FILES = [
  // Source (in node_modules) → Destination (in public/)
  [
    "node_modules/stockfish/bin/stockfish-18-lite-single.js",
    "public/stockfish/stockfish.js",
  ],
  [
    "node_modules/stockfish/bin/stockfish-18-lite-single.wasm",
    "public/stockfish/stockfish.wasm",
  ],
];

let copied = 0;

for (const [src, dest] of FILES) {
  const srcPath = join(ROOT, src);
  const destPath = join(ROOT, dest);

  if (!existsSync(srcPath)) {
    console.warn(`⚠  SKIP — source not found: ${src}`);
    continue;
  }

  mkdirSync(dirname(destPath), { recursive: true });
  copyFileSync(srcPath, destPath);
  copied++;
}

console.log(`✓ Stockfish assets copied (${copied} file${copied === 1 ? "" : "s"})`);
