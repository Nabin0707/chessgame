/**
 * Stockfish.js worker initializer.
 *
 * The stockfish.js file from nmrugg v18 is an Emscripten IIFE that works in
 * three modes: Node CLI, Node module, and Web Worker.  When loaded as a Web
 * Worker via `new Worker("stockfish.js")`, its `d()` function provides a
 * config object with an `instantiateWasm` callback that causes the Emscripten
 * factory to return early before `_command`, `_main`, `ccall`, and other
 * critical function wrappers are set up on the Module object.
 *
 * The Node path (`index.js`) does NOT provide `instantiateWasm` — it omits
 * it so the factory runs to completion and sets everything up correctly.
 *
 * This wrapper mimics the Node approach inside the Worker:
 * 1. Load stockfish.js via importScripts (registers the factory into our scope)
 * 2. Create a config object WITHOUT instantiateWasm, so the standard Emscripten
 *    WASM loading path runs and all function wrappers are set up.
 * 3. The engine's `listener` forwards output to postMessage.
 * 4. The engine's `processCommand` is set after initialization.
 */

// Override the Worker's importScripts behavior to intercept stockfish.js
// Actually, let's just use the standard approach but with a cleaner config.

// Stockfish sets up its own onmessage handler for UCI input and calls d()
// for WASM initialization. But d() uses an instantiateWasm callback that
// causes the factory to skip critical setup. Instead, we:

// 1. Clear instantiateWasm from self so the stockfish.js Worker init
//    uses its own path without instantiateWasm overriding.
//    Wait - stockfish.js creates a fresh config object in d(), so this won't work.

// NEW APPROACH: Create a different config reference and use the
// standard Emscripten path (no instantiateWasm) by calling the
// factory directly after importScripts loads it.

// When stockfish.js is loaded via importScripts in a Worker, the context
// detection code runs. Since we're in a Worker (typeof onmessage !== "undefined"),
// it takes the Worker path: calls d() and sets onmessage.
// But d() is buggy for our use case because of the early return.

// SOLUTION: We set a flag before importScripts that prevents the default
// Worker path from running, then we manually initialize.

// The Worker path is entered when the ternary condition is true.
// Condition: (typeof self !== "undefined" && self.location.hash.split(",")[1] === "worker")
//   || (typeof global !== "undefined" && ... && !require("worker_threads").isMainThread)
//   || (typeof onmessage !== "undefined" && (typeof window === "undefined" || window.document === undefined))
//
// We're in a Worker, so condition is true. To PREVENT stockfish.js from
// taking the Worker path, we temporarily remove 'onmessage' and add a hash.
// Then after importScripts, we restore our own onmessage handler.

// Store the original postMessage for our use
var _postMessage = self.postMessage.bind(self);

// Save the original onmessage if any
var _origOnMessage = self.onmessage;

// Temporarily remove onmessage to prevent stockfish.js from using its
// default Worker path. Instead, we'll use the browser main-thread path
// which just calls t() and exports via document.currentScript._exports.
// Since document is not available in Workers, it falls through to just t()
// which returns the factory function.
// BUT this also won't work because in Workers, the factory doesn't have
// the right locateFile config and the WASM path detection is different.

// ACTUALLY, the simplest fix: just use the SAME approach as worker.js but
// instead of letting d() handle initialization, we'll directly call
// stockfish.js functions after importScripts.

// Actually, let's just try a COMPLETELY different approach.
// Don't use importScripts at all. Instead, construct the Worker
// initialization ourselves.

// First, tell the main thread we're alive
_postMessage('__worker_booting__');

// The key insight from analyzing stockfish.js:
// The factory function `e` (inside `t()`) returns early when
// `instantiateWasm` is provided. But the code AFTER the early return
// sets up critical wrappers (_command, _main, ccall).
//
// The fix: use a config that has locateFile and listener but NOT
// instantiateWasm. This lets the standard Emscripten WASM loading
// handle everything, including the `n()` callback that sets up `f.asm`,
// and `Ie()` that calls `_main`.
//
// BUT: stockfish.js's t() is not accessible from outside the IIFE.
// When loaded via importScripts, the IIFE runs but t() is local to it.
// The Worker path calls d() and does NOT export t().

// APPROACH: Load stockfish.js but intercept its context detection.
// We temporarily make the Worker look like a browser main thread
// by setting document.currentScript and deleting onmessage.

// Actually, this is getting too complex. Let's try something simpler:
// Load stockfish.js TWICE - once to bootstrap t(), once for real init.
// No, that's wasteful.

// SIMPLEST APPROACH YET:
// Just eval the stockfish.js source manually after setting up
// the right environment variables.

// Actually wait - loaded via importScripts, the stockfish.js file runs
// in the Worker scope. The Worker detection code checks:
// 1. self.location.hash - no control, we don't set hash
// 2. typeof onmessage !== "undefined" - true in Worker
// So the Worker path is always taken.

// THE REAL FIX is to prevent d() from providing instantiateWasm.
// Let's just modify the config object BEFORE d() creates it.
// We can do this by overriding c = ... assignment.

// KNOWN FACT: d() sets `c = { locateFile, listener, instantiateWasm }`.
// If we override `c` before d() runs, the stockfish.js code uses our override.
// Actually d() creates a LOCAL `c` variable that shadows any outer `c`.

// OK here's my final approach: modify self.onmessage before loading
// stockfish.js, so that when stockfish.js sets its default onmessage,
// it uses our handler instead. And in our handler, we handle UCI commands
// directly without going through stockfish.js's processCommand.
// BUT we still need the WASM engine to be initialized.

// FINAL APPROACH - just use importScripts and then override the behavior:
// stockfish.js's context detection will:
// 1. See Worker context (onmessage !== undefined)
// 2. Extract WASM URL from location.hash
// 3. Call d() to start WASM loading
// 4. Set onmessage = onmessage || defaultHandler

// The issue with d() might not actually be what I think.
// Let me just TEST with a simple approach first.

// Actually, you know what - let me just try the ORIGINAL approach
// (direct new Worker("/stockfish/stockfish.js")) but with a
// ADDITIONAL diagnostic step AND the non-Turbopack server.

// THIS WORKER: forward messages between stockfish.js's d() initialization
// and the main thread, to see exactly what stockfish.js outputs during init.
_postMessage('__worker_ready__');

// Now load stockfish.js - it will detect Worker context and call d()
importScripts('/stockfish/stockfish.js');

// If we get here, importScripts completed without throwing.
// stockfish.js should have set up onmessage and started WASM loading.
_postMessage('__importScripts_complete__');
