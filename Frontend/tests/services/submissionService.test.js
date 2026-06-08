import {
  getStudentSubmissions,
  getAssignmentSubmissions,
  getCourseSubmissions,
  getSubmissionForAssignment,
  createSubmission,
  updateSubmission,
} from '../../src/services/submissionService.jsx';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('submissionService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getStudentSubmissions hits student endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getStudentSubmissions('s1');
    expect(lastFetchCall()[0]).toContain('/Submission/student/s1');
  });

  it('getAssignmentSubmissions hits assignment endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getAssignmentSubmissions('a1');
    expect(lastFetchCall()[0]).toContain('/Submission/assignment/a1');
  });

  it('getCourseSubmissions hits course endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getCourseSubmissions('c1');
    expect(lastFetchCall()[0]).toContain('/Submission/course/c1');
  });

  it('getSubmissionForAssignment returns the matching one', async () => {
    mockFetchOnce({ body: [
      { id: 's1', assignmentId: 'a1' },
      { id: 's2', assignmentId: 'a2' },
    ] });
    const result = await getSubmissionForAssignment('stu', 'a2');
    expect(result.id).toBe('s2');
  });

  it('getSubmissionForAssignment returns null if none', async () => {
    mockFetchOnce({ body: [] });
    const result = await getSubmissionForAssignment('stu', 'a1');
    expect(result).toBeNull();
  });

  it('createSubmission POSTs and defaults status', async () => {
    mockFetchOnce({ body: { id: 's1' } });
    await createSubmission({ assignmentId: 'a1', studentId: 's1', fileUrl: 'u' });
    const [, opts] = lastFetchCall();
    expect(JSON.parse(opts.body).status).toBe('Submitted');
  });

  it('updateSubmission throws on non-OK', async () => {
    mockFetchOnce({ ok: false, status: 500 });
    await expect(updateSubmission('s1', { fileUrl: 'u', status: 'X' })).rejects.toThrow('Failed to update submission.');
  });
});
