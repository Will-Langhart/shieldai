import { describe, expect, it, vi, beforeEach } from 'vitest';
import { Readable } from 'stream';
import { readAguiStream, type AguiEvent } from '../../../services/agui-stream';

// The loop is tested against scripted model turns and stub tools: no network.
vi.mock('../../llm', () => ({
  MODELS: { gentle: 'gentle-model', deep: 'deep-model', specialist: 'x' },
  streamToolRound: vi.fn(),
}));
vi.mock('../../scripture/tools', () => ({
  SCRIPTURE_FLOOR_TOOL: 'search',
  agentTools: () => [],
  toolStatus: (name: string, input: any) => `${name}:${input.reference ?? input.query}`,
  runAgentTool: vi.fn(async (name: string, input: any) => ({
    content: `${name} result`,
    ms: 1,
    widget: name === 'get_passage'
      ? { type: 'passage', data: { reference: input.reference, translation: 'KJV', verses: [], source: 'x', available: [] } }
      : undefined,
  })),
}));
vi.mock('../../scripture/verify', () => ({
  verifyReferencesExist: vi.fn(async () => ({ ok: true, checked: 1, hallucinated: [], misquoted: [], references: [], skipped: false })),
}));

import { runAgent } from '../run-agent';
import { AguiSink, PlainTextSink } from '../sink';
import { verifyReferencesExist } from '../../scripture/verify';

type Round = Parameters<typeof runAgent>[0]['round'];

/** Scripted model: first turn calls get_passage, second answers. */
function scriptedRound(answer = 'In the beginning was the Word (John 1:1).'): NonNullable<Round> {
  let turn = 0;
  return (async (_p: any, handlers: any = {}) => {
    turn += 1;
    if (turn === 1) {
      handlers.onText?.('Let me read it. ');
      handlers.onToolStart?.('tool_1', 'get_passage');
      const toolUse = { type: 'tool_use', id: 'tool_1', name: 'get_passage', input: { reference: 'John 1:1' } };
      return { content: [{ type: 'text', text: 'Let me read it. ' }, toolUse], text: 'Let me read it.', toolUses: [toolUse], stopReason: 'tool_use' };
    }
    handlers.onText?.(answer);
    return { content: [{ type: 'text', text: answer }], text: answer, toolUses: [], stopReason: 'end_turn' };
  }) as any;
}

async function capture(run: (out: { write(s: string): void }) => Promise<unknown>): Promise<AguiEvent[]> {
  let raw = '';
  await run({ write: (s: string) => { raw += s; } });
  const events: AguiEvent[] = [];
  await readAguiStream(Readable.toWeb(Readable.from([Buffer.from(raw)])) as any, e => events.push(e));
  return events;
}

const base = {
  system: 'sys',
  history: [],
  message: 'What does logos mean?',
  scriptureFloor: false,
  ctx: { message: 'What does logos mean?', userId: 'u1', cid: 'c1' },
  threadId: 't1',
};

describe('runAgent over AG-UI', () => {
  beforeEach(() => vi.mocked(verifyReferencesExist).mockClear());

  it('emits a well-formed event sequence for a tool round then an answer (gentle streams live)', async () => {
    let result: any;
    const events = await capture(async out => {
      result = await runAgent({ ...base, mode: 'gentle', sink: new AguiSink(out), round: scriptedRound() });
    });
    const types = events.map(e => (e.type === 'CUSTOM' ? `CUSTOM:${e.name}` : e.type));

    expect(types[0]).toBe('RUN_STARTED');
    expect(types.at(-1)).toBe('RUN_FINISHED');
    expect(types).toEqual([
      'RUN_STARTED',
      'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT',
      'TOOL_CALL_START',
      'TEXT_MESSAGE_END',
      'CUSTOM:tool_status', 'TOOL_CALL_ARGS', 'TOOL_CALL_END', 'TOOL_CALL_RESULT', 'CUSTOM:widget',
      'TEXT_MESSAGE_START', 'TEXT_MESSAGE_CONTENT', 'TEXT_MESSAGE_END',
      'RUN_FINISHED',
    ]);
    const widget = events.find(e => e.name === 'widget')!;
    expect(widget.value).toMatchObject({ toolCallId: 'tool_1', widget: { type: 'passage' } });
    expect(JSON.parse(events.find(e => e.type === 'TOOL_CALL_ARGS')!.delta)).toEqual({ reference: 'John 1:1' });
    expect(result.text).toBe('Let me read it.\n\nIn the beginning was the Word (John 1:1).');
    expect(result.widgets).toHaveLength(1);
  });

  it('runs the Scripture floor before the first model turn', async () => {
    const events = await capture(async out => {
      await runAgent({ ...base, mode: 'gentle', scriptureFloor: true, sink: new AguiSink(out), round: scriptedRound() });
    });
    const firstTool = events.find(e => e.type === 'TOOL_CALL_START')!;
    expect(firstTool.toolCallName).toBe('search');
    expect(events.indexOf(firstTool)).toBeLessThan(events.findIndex(e => e.type === 'TEXT_MESSAGE_START'));
  });

  it('buffers debate answers, drops pre-tool narration, and rewrites once on a bad reference', async () => {
    vi.mocked(verifyReferencesExist)
      .mockResolvedValueOnce({ ok: false, checked: 1, hallucinated: ['Hezekiah 3:4'], misquoted: [], references: [], skipped: false })
      .mockResolvedValueOnce({ ok: true, checked: 1, hallucinated: [], misquoted: [], references: [], skipped: false });

    let turn = 0;
    const scripted = scriptedRound('Bad cite Hezekiah 3:4.');
    const round = (async (p: any, h: any) => {
      turn += 1;
      if (turn <= 2) return scripted(p, h);
      return { content: [{ type: 'text', text: 'Fixed answer.' }], text: 'Fixed answer.', toolUses: [], stopReason: 'end_turn' };
    }) as any;

    let result: any;
    const events = await capture(async out => {
      result = await runAgent({ ...base, mode: 'debate', sink: new AguiSink(out), round });
    });
    const text = events.filter(e => e.type === 'TEXT_MESSAGE_CONTENT').map(e => e.delta).join('');
    expect(text).toBe('Fixed answer.');
    expect(events.some(e => e.name === 'activity')).toBe(true);
    expect(result.corrected).toBe(true);
    expect(result.text).toBe('Fixed answer.');
  });

  it('answers with tools off when the round cap is hit', async () => {
    const calls: any[] = [];
    const round = (async (p: any) => {
      calls.push(p.toolChoice);
      if (p.toolChoice?.type === 'none') return { content: [{ type: 'text', text: 'Done.' }], text: 'Done.', toolUses: [], stopReason: 'end_turn' };
      const toolUse = { type: 'tool_use', id: `t${calls.length}`, name: 'search', input: { query: 'x' } };
      return { content: [toolUse], text: '', toolUses: [toolUse], stopReason: 'tool_use' };
    }) as any;
    const result = await runAgent({ ...base, mode: 'gentle', sink: new PlainTextSink({ write() {} }), round });
    expect(calls.at(-1)).toEqual({ type: 'none' });
    expect(result.text).toBe('Done.');
  });
});

describe('PlainTextSink', () => {
  it('streams only prose, so plain-text clients see the same output as chat-rag', async () => {
    let raw = '';
    await runAgent({ ...base, mode: 'gentle', sink: new PlainTextSink({ write: s => { raw += s; } }), round: scriptedRound() });
    expect(raw.trim()).toBe('Let me read it. \n\nIn the beginning was the Word (John 1:1).');
  });
});

describe('needsScriptureFloor', () => {
  it('fires for substantive challenges, not small talk', async () => {
    const { needsScriptureFloor } = await import('../../../pages/api/chat-agent');
    expect(needsScriptureFloor('If God is good why is there evil?', 'logical')).toBe(true);
    expect(needsScriptureFloor('hello', 'philosophical')).toBe(false);
    expect(needsScriptureFloor('What does logos mean in John 1:1?', 'personal')).toBe(false);
  });
});
