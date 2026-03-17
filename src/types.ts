// ============================================================
// types.ts — All TypeScript interfaces for the AI QA Workbench
// ============================================================
// A TypeScript "interface" is like a blueprint that describes
// the shape of an object. If you say a variable is of type
// TestResult, TypeScript will warn you if you forget a field
// or use the wrong data type.
// ============================================================

export type Verdict = "pass" | "fail" | "partial";
// "type" with a union ( | ) means the value can only be one
// of these exact strings. TypeScript will error if you try
// to use "maybe" or any other string.

export type Severity = "low" | "med" | "high";

export type BugStatus = "open" | "closed";

export interface TestRun {
  // A TestRun is created when the user clicks "Run test"
  prompt: string;        // The text the user typed
  model: string;         // e.g. "claude-sonnet-4-6"
  modelValue: string;    // The actual API model string
  category: string;      // e.g. "Edge case"
  aiResponse: string;    // What the AI said back
  elapsed: string;       // How long the API took, e.g. "1.2s"
  timestamp: string;     // Human-readable time string
}

export interface TestResult extends TestRun {
  // TestResult extends TestRun — it has everything TestRun has,
  // PLUS the evaluation fields added after the tester reviews it.
  id: number;            // Unique ID (we use Date.now())
  verdict: Verdict;
  rating: number;        // 0–5 stars (0 means not rated)
  notes: string;         // Tester's written observations
}

export interface Bug {
  id: number;
  title: string;
  severity: Severity;
  description: string;
  status: BugStatus;
  timestamp: string;
  linkedTestId?: number; // Optional — if bug came from a test result
  // The "?" means this field is optional. TypeScript won't
  // complain if it's missing.
}

export interface AppState {
  // AppState holds everything the app needs to remember.
  // In a real app you'd store this in a database or localStorage.
  results: TestResult[];
  bugs: Bug[];
  apiKey: string;
}

export interface Metrics {
  // Derived from AppState — computed, never stored directly
  total: number;
  passed: number;
  failed: number;
  partial: number;
  avgRating: number | null; // null when no ratings exist yet
  passRate: number | null;
}
