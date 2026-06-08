import { getStudentCourses, getTeacherCourses } from '../../src/services/courseService.jsx';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('courseService', () => {
  afterEach(() => jest.resetAllMocks());

  it('getStudentCourses GETs the enrollment endpoint', async () => {
    mockFetchOnce({ body: [{ id: 'e1' }] });
    const data = await getStudentCourses('student-1');
    expect(data).toHaveLength(1);
    expect(lastFetchCall()[0]).toContain('/Enrollment/student/student-1');
  });

  it('getTeacherCourses GETs the course teacher endpoint', async () => {
    mockFetchOnce({ body: [{ id: 'c1' }] });
    await getTeacherCourses('t1');
    expect(lastFetchCall()[0]).toContain('/Course/teacher/t1');
  });

  it('throws on non-OK response', async () => {
    mockFetchOnce({ ok: false, status: 404, body: { message: 'nope' } });
    await expect(getStudentCourses('x')).rejects.toThrow('nope');
  });
});
