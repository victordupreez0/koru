import { loginUser, updateUserProfile, changeUserPassword, loginWithGoogle } from '../../src/services/authService.jsx';
import { mockFetchOnce, lastFetchCall } from '../helpers/fetchMock.js';

describe('authService', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loginUser', () => {
    it('returns user data when role matches', async () => {
      mockFetchOnce({ body: { userId: '1', role: 'student' } });
      const data = await loginUser({ email: 'a@x.com', password: 'p', expectedRole: 'student' });
      expect(data.userId).toBe('1');
    });

    it('rejects when role mismatches', async () => {
      mockFetchOnce({ body: { role: 'teacher' } });
      await expect(loginUser({ email: 'a@x.com', password: 'p', expectedRole: 'student' })).rejects.toThrow(/correct login portal/);
    });

    it('throws the backend message on failure', async () => {
      mockFetchOnce({ ok: false, status: 401, body: { message: 'Invalid email or password' } });
      await expect(loginUser({ email: 'a@x.com', password: 'wrong' })).rejects.toThrow('Invalid email or password');
    });

    it('falls back to generic error when body has no message', async () => {
      mockFetchOnce({ ok: false, status: 500, body: {} });
      await expect(loginUser({ email: 'a@x.com', password: 'p' })).rejects.toThrow('Something went wrong.');
    });
  });

  describe('updateUserProfile', () => {
    it('PUTs to the profile endpoint with encoded id', async () => {
      mockFetchOnce({ body: { id: 'abc' } });
      await updateUserProfile('id with space', { email: 'a@x.com' });
      const [url, opts] = lastFetchCall();
      expect(url).toContain('/User/profile/id%20with%20space');
      expect(opts.method).toBe('PUT');
    });
  });

  describe('changeUserPassword', () => {
    it('POSTs current and new password', async () => {
      mockFetchOnce({ body: { message: 'ok' } });
      await changeUserPassword('u1', { currentPassword: 'old', newPassword: 'new' });
      const [url, opts] = lastFetchCall();
      expect(url).toContain('/User/change-password/u1');
      expect(opts.method).toBe('POST');
      expect(JSON.parse(opts.body)).toEqual({ currentPassword: 'old', newPassword: 'new' });
    });
  });

  describe('loginWithGoogle', () => {
    it('sends credential and role', async () => {
      mockFetchOnce({ body: { userId: '1' } });
      await loginWithGoogle('credential-x', 'teacher');
      const [, opts] = lastFetchCall();
      expect(JSON.parse(opts.body)).toEqual({ credential: 'credential-x', role: 'teacher' });
    });

    it('defaults role to student', async () => {
      mockFetchOnce({ body: {} });
      await loginWithGoogle('credential-x');
      const [, opts] = lastFetchCall();
      expect(JSON.parse(opts.body).role).toBe('student');
    });
  });
});
