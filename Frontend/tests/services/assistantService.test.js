import { createSseParser, streamAssistant } from '../../src/services/assistantService.js';

function streamOf(chunks) {
  const enc = new TextEncoder();
  let i = 0;
  return {
    getReader: () => ({
      read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }),
      cancel: jest.fn(),
    }),
  };
}
const mockStream = (chunks, extra = {}) => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, status: 200, body: streamOf(chunks), ...extra });
};

const RESULT = { ok: true, message: 'Hello **there**', question: 'Which course?', context: { summary: 'your 2 courses' }, provider: 'deepseek', fallback: false };

describe('createSseParser', () => {
  it('handles chunks split mid-line and comments', () => {
    const events = [];
    const p = createSseParser((e) => events.push(e));
    const text = ': ok\n\nevent: stage\ndata: {"stage":"reading","text":"Hi"}\n\n';
    for (const ch of text) p.push(ch);
    expect(events).toEqual([{ event: 'stage', data: '{"stage":"reading","text":"Hi"}' }]);
  });

  it('handles CRLF and multi-line data', () => {
    const events = [];
    const p = createSseParser((e) => events.push(e));
    p.push('event: result\r\ndata: a\r\ndata: b\r\n\r\n');
    expect(events).toEqual([{ event: 'result', data: 'a\nb' }]);
  });
});

describe('streamAssistant', () => {
  afterEach(() => jest.resetAllMocks());

  it('emits stages then resolves the result', async () => {
    const sse = [
      ': ok\n\n',
      'event: stage\ndata: {"stage":"reading","text":"Rea',
      'ding"}\n\nevent: stage\ndata: {"stage":"planning","text":"Working out a reply"}\n\n',
      `event: result\ndata: ${JSON.stringify(RESULT)}\n\n`,
    ];
    mockStream(sse);
    const stages = [];
    const res = await streamAssistant({ messages: [{ role: 'user', content: 'hi' }], userId: 'u', role: 'student', onStage: (s) => stages.push(s.text) });
    expect(stages).toEqual(['Reading', 'Working out a reply']);
    expect(res).toMatchObject({ ok: true, message: 'Hello **there**', question: 'Which course?', fallback: false });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/Assistant/chat/stream');
    expect(JSON.parse(opts.body).mode).toBe('standard');
  });

  it('returns ok:false when the stream ends without a result', async () => {
    mockStream([': ok\n\n', 'event: stage\ndata: {"stage":"reading","text":"x"}\n\n']);
    const res = await streamAssistant({ messages: [], userId: 'u', role: 'student' });
    expect(res.ok).toBe(false);
    expect(res.error).toBeTruthy();
  });

  it('returns ok:false for a malformed result', async () => {
    mockStream(['event: result\ndata: {"ok":true,"message":""}\n\n']);
    const res = await streamAssistant({ messages: [], userId: 'u', role: 'student' });
    expect(res.ok).toBe(false);
  });

  it('passes through a server error result', async () => {
    mockStream(['event: result\ndata: {"ok":false,"error":"Both down."}\n\n']);
    expect(await streamAssistant({ messages: [], userId: 'u', role: 'student' })).toEqual({ ok: false, error: 'Both down.' });
  });

  it('resolves ok:false on non-2xx and network errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect((await streamAssistant({ messages: [] })).ok).toBe(false);
    global.fetch = jest.fn().mockRejectedValue(new TypeError('failed'));
    expect((await streamAssistant({ messages: [] })).ok).toBe(false);
  });

  it('rejects with AbortError when aborted', async () => {
    const err = new Error('x'); err.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(err);
    await expect(streamAssistant({ messages: [] })).rejects.toMatchObject({ name: 'AbortError' });
  });
});
