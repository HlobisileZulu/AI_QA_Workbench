// ============================================================
// api.ts — Handles all communication with AI model APIs
// ============================================================
// Separating API calls into their own file means:
// 1. You can swap out the API without touching UI code
// 2. You can mock this file in tests
// 3. All error handling is in one place
// ============================================================

import { TestRun } from "./types";

// The Anthropic API response shape — only the fields we need.
// TypeScript lets you define exactly what you expect from
// external APIs, catching surprises at compile time.
interface AnthropicResponse {
  content: Array<{ type: string; text?: string }>;
  error?: { message: string };
}

// MOCK_RESPONSES simulates other models (GPT-4o, Gemini) for
// demo purposes — in production you'd add those real API calls.
const MOCK_RESPONSES: Record<string, string> = {
  "mock-gpt4o":
    "[Mock: GPT-4o] This is a simulated response. In production, connect the OpenAI API here using the same pattern as the Anthropic call below.",
  "mock-gemini":
    "[Mock: Gemini 1.5 Pro] This is a simulated response. In production, use the Google Generative AI SDK here.",
};

// The main function. "async" means it returns a Promise —
// the caller can "await" it to get the result when ready.
export async function callModel(
  prompt: string,
  modelValue: string,
  apiKey: string
): Promise<{ response: string; elapsed: string }> {
  const startTime = Date.now();

  // Handle mock models first — no API call needed
  if (modelValue.startsWith("mock-")) {
    await delay(600); // Simulate network latency
    return {
      response: MOCK_RESPONSES[modelValue] ?? "[Mock response]",
      elapsed: formatElapsed(startTime),
    };
  }

  if (!apiKey || !apiKey.startsWith("sk-ant-")) {
    return {
      response:
        "No valid API key. Paste your Anthropic key (sk-ant-...) in the bar at the top.",
      elapsed: "0s",
    };
  }

  // Real Anthropic API call
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        // This header is required for direct browser-to-API calls.
        // In production, route through your own backend instead.
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: modelValue,
        max_tokens: 1000,
        system:
          "You are an AI model being tested by a QA tester. Answer the prompt directly and helpfully.",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    // "as AnthropicResponse" is a TypeScript type assertion —
    // we tell TypeScript what shape to expect from the JSON.
    const data = (await res.json()) as AnthropicResponse;

    if (data.error) {
      return {
        response: `API error: ${data.error.message}`,
        elapsed: formatElapsed(startTime),
      };
    }

    // Extract text from the content array
    const text = data.content
      .filter((b) => b.type === "text")
      .map((b) => b.text ?? "")
      .join("");

    return { response: text, elapsed: formatElapsed(startTime) };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      response: `Network error: ${message}`,
      elapsed: formatElapsed(startTime),
    };
  }
}

// ── Helpers ──────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatElapsed(startTime: number): string {
  return ((Date.now() - startTime) / 1000).toFixed(1) + "s";
}
