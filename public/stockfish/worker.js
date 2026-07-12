/**
 * Stockfish Web Worker entry point.
 *
 * This file is served as a static asset from /stockfish/worker.js.
 * It loads the stockfish.wasm glue code via importScripts and
 * manually wires the UCI message handler.
 *
 * The stockfish.wasm v0.10.0 factory function (Stockfish) does NOT
 * auto-register an onmessage handler. We must create the engine and
 * bridge UCI commands/responses between the Worker's message API
 * and Stockfish's internal message queue.
 */

// Log uncaught Worker errors back to the main thread so we can see
// if WASM loading or the Stockfish() call itself fails.
self.addEventListener("error", function (e) {
  self.postMessage("__worker_error__ " + e.message);
});
self.addEventListener("unhandledrejection", function (e) {
  self.postMessage("__worker_unhandled__ " + (e.reason || "unknown"));
});

importScripts("/stockfish/stockfish.js");

// Verify Stockfish factory function exists
if (typeof Stockfish !== "function") {
  self.postMessage("__worker_error__ Stockfish is not a function (type=" + typeof Stockfish + ")");
  throw new Error("Stockfish factory not found after importScripts");
}

// Create the Stockfish engine instance.
// Stockfish is a factory function defined by stockfish.js after
// importScripts completes. It compiles the WASM module and sets up
// the UCI command queue internally.
var engine;
try {
  engine = Stockfish();
} catch (e) {
  self.postMessage("__worker_error__ Stockfish() threw synchronously: " + e.message);
  throw e;
}

// If engine.ready exists (it's a Promise in newer stockfish.wasm
// builds), wire error forwarding so WASM compilation failures are
// visible on the main thread.
if (engine.ready) {
  engine.ready.catch(function (err) {
    self.postMessage("__worker_error__ engine.ready rejected: " + (err.message || err));
  });
}

// Forward UCI responses (engine → main thread).
// Stockfish uses addMessageListener to notify callers when the
// engine has output (e.g. "uciok", "info score cp ...", "bestmove ...").
engine.addMessageListener(function (line) {
  self.postMessage(line);
});

// Forward UCI commands (main thread → engine).
// The main thread sends UCI strings via worker.postMessage().
// Stockfish processes these through its internal command queue.
self.onmessage = function (event) {
  if (typeof event.data === "string" && event.data.startsWith("__")) {
    return; // ignore internal meta-messages
  }
  engine.postMessage(event.data);
};
