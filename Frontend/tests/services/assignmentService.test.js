import { getStudentAssignments, getAssignmentById, getCourseAssignments } from '../../src/services/assignmentService.jsx';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('assignmentService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getStudentAssignments hits the student endpoint', async () => {
    mockFetchOnce({ body: [{ id: 'a1' }] });
    await getStudentAssignments('s1');
    expect(lastFetchCall()[0]).toContain('/Assignment/student/s1');
  });

  it('getAssignmentById hits the singular endpoint', async () => {
    mockFetchOnce({ body: { id: 'a1' } });
    const result = await getAssignmentById('a1');
    expect(result.id).toBe('a1');
  });

  it('getCourseAssignments hits the course endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getCourseAssignments('c1');
    expect(lastFetchCall()[0]).toContain('/Assignment/course/c1');
  });

  it('surfaces backend error messages', async () => {
    mockFetchOnce({ ok: false, status: 500, body: { message: 'boom' } });
    await expect(getStudentAssignments('s1')).rejects.toThrow('boom');
  });
});
