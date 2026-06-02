import { getCourseAnnouncements, createAnnouncement, deleteAnnouncement } from '../../src/services/announcementService.js';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('announcementService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getCourseAnnouncements GETs the right URL', async () => {
    mockFetchOnce({ body: [] });
    await getCourseAnnouncements('c1');
    expect(lastFetchCall()[0]).toContain('/Announcement/course/c1');
  });

  it('createAnnouncement POSTs JSON', async () => {
    mockFetchOnce({ body: { id: 'a1' } });
    await createAnnouncement({ title: 'Hi' });
    const [, opts] = lastFetchCall();
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body).title).toBe('Hi');
  });

  it('deleteAnnouncement DELETEs by id', async () => {
    mockFetchOnce({ body: {} });
    await deleteAnnouncement('a1');
    const [url, opts] = lastFetchCall();
    expect(url).toContain('/Announcement/a1');
    expect(opts.method).toBe('DELETE');
  });
});
