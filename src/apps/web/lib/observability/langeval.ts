import { SpanStatusCode, trace, type Span, type Tracer } from '@opentelemetry/api';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BasicTracerProvider, BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

/**
 * Sends Claude calls to langeval as OpenTelemetry spans.
 *
 * This sits alongside the LangSmith tracing in `lib/llm.ts` rather than replacing it: the two
 * answer different questions, and turning one off to try the other would mean losing the history.
 * Both are off unless their env vars are set, so a machine without either runs untouched.
 *
 * Deliberately a **private tracer provider**, not the global one. A global provider would make
 * every page render and outbound fetch a langeval trace; this way only model calls leave the app.
 * That also means it cannot fight with anything else that registers a global provider later.
 *
 * Set to enable:
 *   LANGEVAL_OTLP_ENDPOINT=https://<host>/otlp/v1/traces
 *   LANGEVAL_API_KEY=lge_...            (a project key with the `ingest` scope)
 *   LANGEVAL_SERVICE_NAME=shieldai-web  (optional; defaults to shieldai-web)
 */

let provider: BasicTracerProvider | null = null;
let tracer: Tracer | null = null;
let started = false;

/** Whether spans will actually be sent. Reads env each call so tests can flip it. */
export function isLangevalEnabled(): boolean {
  return Boolean(process.env.LANGEVAL_OTLP_ENDPOINT && process.env.LANGEVAL_API_KEY);
}

function getTracer(): Tracer | null {
  if (!isLangevalEnabled()) return null;
  if (started) return tracer;
  started = true;

  try {
    provider = new BasicTracerProvider({
      resource: resourceFromAttributes({
        'service.name': process.env.LANGEVAL_SERVICE_NAME || 'shieldai-web',
        'deployment.environment.name': process.env.VERCEL_ENV || process.env.NODE_ENV || 'local',
      }),
      spanProcessors: [
        new BatchSpanProcessor(
          new OTLPTraceExporter({
            url: process.env.LANGEVAL_OTLP_ENDPOINT,
            headers: { Authorization: `Bearer ${process.env.LANGEVAL_API_KEY}` },
          })
        ),
      ],
    });
    tracer = provider.getTracer('shieldai');
  } catch (err) {
    // Observability must never take the app down with it.
    console.warn('[langeval] tracing disabled:', err);
    tracer = null;
  }
  return tracer;
}

/** What a caller tells us about the call it is about to make. */
export interface ModelCall {
  model: string;
  system?: string;
  messages: Array<{ role: string; content: string }>;
  maxTokens?: number;
  /** Groups the turns of one conversation together in langeval. */
  threadId?: string;
  userId?: string;
  /** Which part of the product this is — shows up as the span name. */
  operation?: string;
}

/** What the model gave back. Token counts are Anthropic's `usage` block. */
export interface ModelResult {
  text: string;
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
}

// Long prompts are cut before they are sent, not in the database: a trace is for reading, and
// shipping a 200KB retrieval context on every span costs bandwidth for no added insight.
const PREVIEW_LIMIT = 8000;

function clip(text: string): string {
  return text.length <= PREVIEW_LIMIT ? text : `${text.slice(0, PREVIEW_LIMIT)}…`;
}

function record(span: Span, call: ModelCall, result: ModelResult): void {
  span.setAttribute('gen_ai.response.model', result.model || call.model);
  span.setAttribute('output.value', clip(result.text));
  if (result.inputTokens != null) span.setAttribute('gen_ai.usage.input_tokens', result.inputTokens);
  if (result.outputTokens != null) {
    span.setAttribute('gen_ai.usage.output_tokens', result.outputTokens);
  }
  if (result.cacheReadTokens != null) {
    span.setAttribute('gen_ai.usage.cache_read_input_tokens', result.cacheReadTokens);
  }
  if (result.cacheWriteTokens != null) {
    span.setAttribute('gen_ai.usage.cache_creation_input_tokens', result.cacheWriteTokens);
  }
}

/**
 * Run `fn` inside a langeval LLM span.
 *
 * When tracing is off this is `fn()` and nothing else — no provider is built, no env is read
 * twice, and the call site does not have to branch.
 */
export async function traceModelCall<T>(
  call: ModelCall,
  fn: () => Promise<T>,
  describe: (value: T) => ModelResult
): Promise<T> {
  const t = getTracer();
  if (!t) return fn();

  const conversation = call.messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  const span = t.startSpan(call.operation ? `chat ${call.operation}` : `chat ${call.model}`, {
    attributes: {
      'openinference.span.kind': 'LLM',
      'gen_ai.operation.name': 'chat',
      'gen_ai.request.model': call.model,
      'input.value': clip(call.system ? `system: ${call.system}\n${conversation}` : conversation),
      ...(call.maxTokens ? { 'gen_ai.request.max_tokens': call.maxTokens } : {}),
      ...(call.threadId ? { 'langeval.thread_id': call.threadId } : {}),
      ...(call.userId ? { 'langeval.user_id': call.userId } : {}),
    },
  });

  try {
    const value = await fn();
    record(span, call, describe(value));
    return value;
  } catch (err) {
    // A failed call is the one most worth having in the trace.
    span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
    span.recordException(err instanceof Error ? err : new Error(String(err)));
    throw err;
  } finally {
    span.end();
  }
}

/**
 * Push anything buffered.
 *
 * Spans are batched, and a serverless instance can freeze the moment a response is sent — so a
 * route that does not flush loses the trace it just produced. Call this from `res.on('close')`
 * or after the response in a long-lived server.
 */
export async function flushLangeval(): Promise<void> {
  try {
    await provider?.forceFlush();
  } catch {
    /* a lost trace must never fail a request */
  }
}

/** The active span, so a caller can hang tool or retrieval spans under the model call. */
export function currentSpan(): Span | undefined {
  return trace.getActiveSpan();
}
