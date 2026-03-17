// ============================================================
// state.ts — Central state management
// ============================================================
// This file owns the app's data. All other modules read from
// and write to state through the functions exported here.
// This is called the "single source of truth" pattern —
// one place where all your data lives.
// ============================================================

import { AppState, TestResult, Bug } from "./types";

// The state object lives here. The "let" means it can be
// reassigned; but we export functions to mutate it, not
// the object itself — this keeps changes controlled.
let state: AppState = {
  results: [],
  bugs: [],
  apiKey: "",
};

// ── Getters ─────────────────────────────────────────────────
// We return copies of arrays with [...arr] so that code
// outside this file can't accidentally mutate the originals.

export function getState(): Readonly<AppState> {
  return state;
}

export function getResults(): TestResult[] {
  return [...state.results];
}

export function getBugs(): Bug[] {
  return [...state.bugs];
}

export function getApiKey(): string {
  return state.apiKey;
}

// ── Setters ─────────────────────────────────────────────────

export function setApiKey(key: string): void {
  state.apiKey = key;
}

export function addResult(result: TestResult): void {
  state.results = [...state.results, result];
}

export function removeResult(id: number): void {
  state.results = state.results.filter((r) => r.id !== id);
  // .filter returns a new array containing only items where
  // the condition is true. Items where r.id === id are dropped.
}

export function addBug(bug: Bug): void {
  state.bugs = [...state.bugs, bug];
}

export function toggleBugStatus(id: number): void {
  state.bugs = state.bugs.map((b) =>
    b.id === id
      ? { ...b, status: b.status === "open" ? "closed" : "open" }
      : b
  );
  // .map returns a new array. For the matching bug we use
  // spread { ...b } to copy all fields, then override "status".
  // For every other bug we return it unchanged (the : b part).
}

// ── Computed metrics ─────────────────────────────────────────
// These are pure functions — they take data and return a
// result without modifying anything. Easy to test!

export function computeMetrics() {
  const results = state.results;
  const total = results.length;
  const passed = results.filter((r) => r.verdict === "pass").length;
  const failed = results.filter((r) => r.verdict === "fail").length;
  const partial = results.filter((r) => r.verdict === "partial").length;
  const rated = results.filter((r) => r.rating > 0);
  const avgRating =
    rated.length > 0
      ? rated.reduce((sum, r) => sum + r.rating, 0) / rated.length
      : null;
  const passRate = total > 0 ? (passed / total) * 100 : null;

  return { total, passed, failed, partial, avgRating, passRate };
}
