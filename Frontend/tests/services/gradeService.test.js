import { getStudentGrades, getCourseGrades } from '../../src/services/gradeService.js';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('gradeService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getStudentGrades hits the student endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getStudentGrades('s1');
    expect(lastFetchCall()[0]).toContain('/Grade/student/s1');
  });

  it('getCourseGrades hits the course endpoint', async () => {
    mockFetchOnce({ body: [] });
    await getCourseGrades('c1');
    expect(lastFetchCall()[0]).toContain('/Grade/course/c1');
  });

  it('throws on non-OK', async () => {
    mockFetchOnce({ ok: false, status: 500, body: { message: 'fail' } });
    await expect(getStudentGrades('s1')).rejects.toThrow('fail');
  });
});
