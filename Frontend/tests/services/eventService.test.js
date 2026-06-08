import { getAllEvents, getEventById, createEvent, updateEvent, deleteEvent, getEvents } from '../../src/services/eventService.jsx';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('eventService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getAllEvents returns events', async () => {
    mockFetchOnce({ body: [{ id: 'e1' }] });
    const result = await getAllEvents();
    expect(result).toHaveLength(1);
  });

  it('getEvents is an alias for getAllEvents', () => {
    expect(getEvents).toBe(getAllEvents);
  });

  it('getEventById GETs the singular endpoint', async () => {
    mockFetchOnce({ body: { id: 'e1' } });
    await getEventById('e1');
    expect(lastFetchCall()[0]).toContain('/Event/e1');
  });

  it('createEvent POSTs event body', async () => {
    mockFetchOnce({ body: { id: 'e2' } });
    await createEvent({ title: 'T' });
    const [, opts] = lastFetchCall();
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body).title).toBe('T');
  });

  it('updateEvent throws on non-OK', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(updateEvent('e1', {})).rejects.toThrow(/Failed to update event/);
  });

  it('deleteEvent throws on non-OK', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(deleteEvent('e1')).rejects.toThrow(/Failed to delete event/);
  });

  it('deleteEvent resolves on OK', async () => {
    mockFetchOnce({ ok: true });
    await expect(deleteEvent('e1')).resolves.toBeUndefined();
  });
});
