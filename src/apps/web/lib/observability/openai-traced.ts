import OpenAI from 'openai';
import { wrapOpenAI } from 'langsmith/wrappers';

/**
 * Shared OpenAI client with optional LangSmith tracing (Phase 1).
 *
 * When LangSmith tracing is enabled, the client is wrapped with `wrapOpenAI` so
 * every `chat.completions` / `embeddings` call becomes a nested LLM span under
 * the surrounding LangGraph run — with token counts, latency, and prompts —
 * inside the `langgraph-rag` project. When tracing is OFF, `wrapOpenAI` is a
 * transparent passthrough, so this helper is safe to use everywhere with zero
 * behavior change.
 *
 * Enablement is env-driven (no code change to toggle):
 *   LANGSMITH_TRACING=true
 *   LANGSMITH_API_KEY=ls__...
 *   LANGSMITH_PROJECT=langgraph-rag   # defaulted below if unset
 *
 * Callers keep their existing lazy-singleton pattern; this just centralizes the
 * construction so tracing is wired in exactly one place.
 */

// Both the modern (LANGSMITH_*) and legacy (LANGCHAIN_*) flags enable tracing.
const tracingEnabled = (() => {
  const v = (process.env.LANGSMITH_TRACING ?? process.env.LANGCHAIN_TRACING_V2 ?? '')
    .toString()
    .toLowerCase();
  return v === 'true' || v === '1';
})();

// Guarantee the project name matches the Phase 1 decision even if the env var is
// omitted. Setting it here (before the tracer reads it) keeps all Shield AI
// traces in one place.
if (tracingEnabled && !process.env.LANGSMITH_PROJECT && !process.env.LANGCHAIN_PROJECT) {
  process.env.LANGSMITH_PROJECT = 'langgraph-rag';
}

let client: OpenAI | null = null;

/**
 * Returns a process-wide singleton OpenAI client, LangSmith-wrapped when tracing
 * is enabled. Throws if OPENAI_API_KEY is missing (same contract as the inline
 * factories this replaces).
 */
export function getTracedOpenAI(): OpenAI {
  if (client) return client;
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  const raw = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  client = tracingEnabled ? (wrapOpenAI(raw) as unknown as OpenAI) : raw;
  return client;
}

/** True when LangSmith tracing is active (for logging / conditional telemetry). */
export const isTracingEnabled = tracingEnabled;
