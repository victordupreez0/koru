import { getNotes, getNoteById, createNote, updateNote, deleteNote } from '../../src/services/noteService.jsx';
import { lastFetchCall } from '../helpers/fetchMock.js';

function mockFetchOnceText({ ok = true, status = 200, body = {} } = {}) {
  const fetchSpy = jest.fn().mockResolvedValue({
    ok,
    status,
    text: async () => JSON.stringify(body),
  });
  global.fetch = fetchSpy;
  return fetchSpy;
}

describe('noteService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getNotes returns parsed JSON', async () => {
    mockFetchOnceText({ body: [{ id: 'n1' }] });
    const result = await getNotes();
    expect(result).toEqual([{ id: 'n1' }]);
  });

  it('getNoteById encodes path id', async () => {
    mockFetchOnceText({ body: { id: 'a b' } });
    await getNoteById('a b');
    expect(lastFetchCall()[0]).toContain('/Note/a%20b');
  });

  it('createNote POSTs payload', async () => {
    mockFetchOnceText({ body: { id: 'n2' } });
    await createNote({ title: 'T', content: 'C' });
    const [, opts] = lastFetchCall();
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toEqual({ title: 'T', content: 'C' });
  });

  it('updateNote PUTs payload', async () => {
    mockFetchOnceText({ body: {} });
    await updateNote('n1', { title: 'T2' });
    const [, opts] = lastFetchCall();
    expect(opts.method).toBe('PUT');
  });

  it('deleteNote DELETEs', async () => {
    mockFetchOnceText({ body: {} });
    await deleteNote('n1');
    const [, opts] = lastFetchCall();
    expect(opts.method).toBe('DELETE');
  });

  it('throws on error response', async () => {
    mockFetchOnceText({ ok: false, status: 500, body: { message: 'fail' } });
    await expect(getNotes()).rejects.toThrow('fail');
  });
});
