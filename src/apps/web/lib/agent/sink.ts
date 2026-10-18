import { EventType, type BaseEvent } from '@ag-ui/core';
import { EventEncoder } from '@ag-ui/encoder';
import type { WidgetEnvelope } from '../scripture/widgets';

/**
 * Where the agent loop reports what it is doing. The loop knows nothing about
 * HTTP: the AG-UI sink turns its calls into protocol events for the web chat,
 * and the plain-text sink keeps today's text-only stream for mobile and older
 * clients.
 */
export interface AgentSink {
  runStarted(threadId: string, runId: string): void;
  state(snapshot: Record<string, unknown>): void;
  textStart(messageId: string): void;
  textDelta(messageId: string, delta: string): void;
  textEnd(messageId: string): void;
  toolStart(toolCallId: string, name: string, parentMessageId?: string): void;
  /** Human-readable progress line once the call's arguments are known. */
  toolStatus(toolCallId: string, status: string): void;
  toolArgs(toolCallId: string, json: string): void;
  toolEnd(toolCallId: string): void;
  toolResult(messageId: string, toolCallId: string, content: string): void;
  widget(envelope: WidgetEnvelope): void;
  /** A non-tool step the user should know about, e.g. checking citations. */
  activity(label: string): void;
  runFinished(threadId: string, runId: string): void;
  runError(message: string): void;
}

/** Minimal writable surface, so tests can capture output without an HTTP response. */
export interface Writable {
  write(chunk: string): unknown;
}

export class AguiSink implements AgentSink {
  private encoder = new EventEncoder();

  constructor(private out: Writable) {}

  private emit(event: { type: EventType } & Record<string, unknown>) {
    this.out.write(this.encoder.encodeSSE({ timestamp: Date.now(), ...event } as BaseEvent));
  }

  runStarted(threadId: string, runId: string) { this.emit({ type: EventType.RUN_STARTED, threadId, runId }); }
  state(snapshot: Record<string, unknown>) { this.emit({ type: EventType.STATE_SNAPSHOT, snapshot }); }
  textStart(messageId: string) { this.emit({ type: EventType.TEXT_MESSAGE_START, messageId, role: 'assistant' }); }
  textDelta(messageId: string, delta: string) { if (delta) this.emit({ type: EventType.TEXT_MESSAGE_CONTENT, messageId, delta }); }
  textEnd(messageId: string) { this.emit({ type: EventType.TEXT_MESSAGE_END, messageId }); }
  toolStart(toolCallId: string, toolCallName: string, parentMessageId?: string) {
    this.emit({ type: EventType.TOOL_CALL_START, toolCallId, toolCallName, ...(parentMessageId ? { parentMessageId } : {}) });
  }
  toolStatus(toolCallId: string, status: string) { this.emit({ type: EventType.CUSTOM, name: 'tool_status', value: { toolCallId, status } }); }
  toolArgs(toolCallId: string, delta: string) { this.emit({ type: EventType.TOOL_CALL_ARGS, toolCallId, delta }); }
  toolEnd(toolCallId: string) { this.emit({ type: EventType.TOOL_CALL_END, toolCallId }); }
  toolResult(messageId: string, toolCallId: string, content: string) {
    this.emit({ type: EventType.TOOL_CALL_RESULT, messageId, toolCallId, content, role: 'tool' });
  }
  widget(envelope: WidgetEnvelope) { this.emit({ type: EventType.CUSTOM, name: 'widget', value: envelope }); }
  activity(label: string) { this.emit({ type: EventType.CUSTOM, name: 'activity', value: { label } }); }
  runFinished(threadId: string, runId: string) { this.emit({ type: EventType.RUN_FINISHED, threadId, runId }); }
  runError(message: string) { this.emit({ type: EventType.RUN_ERROR, message }); }
}

/** Text-only output: the answer's prose, nothing else. Matches the chat-rag stream. */
export class PlainTextSink implements AgentSink {
  private wroteText = false;

  constructor(private out: Writable) {}

  textDelta(_messageId: string, delta: string) {
    if (!delta) return;
    this.wroteText = true;
    this.out.write(delta);
  }
  textEnd() {
    // Separate prose from consecutive model turns (narration before a tool call, then the answer).
    if (this.wroteText) this.out.write('\n\n');
    this.wroteText = false;
  }
  runError(message: string) { this.out.write(`\n\n${message}`); }

  runStarted() {}
  state() {}
  textStart() {}
  toolStart() {}
  toolStatus() {}
  toolArgs() {}
  toolEnd() {}
  toolResult() {}
  widget() {}
  activity() {}
  runFinished() {}
}
