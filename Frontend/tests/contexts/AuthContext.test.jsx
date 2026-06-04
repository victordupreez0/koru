import '@testing-library/jest-dom';
import { act, render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext.jsx';

function Probe() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="isAuth">{String(auth.isAuthenticated)}</span>
      <span data-testid="role">{auth.role || 'none'}</span>
      <button onClick={() => auth.login({ userId: '1', role: 'student' })}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => localStorage.clear());

  it('starts unauthenticated when no session in storage', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('isAuth')).toHaveTextContent('false');
    expect(screen.getByTestId('role')).toHaveTextContent('none');
  });

  it('login persists session to localStorage and updates state', () => {
    render(<AuthProvider><Probe /></AuthProvider>);
    act(() => screen.getByText('login').click());
    expect(screen.getByTestId('isAuth')).toHaveTextContent('true');
    expect(screen.getByTestId('role')).toHaveTextContent('student');
    expect(JSON.parse(localStorage.getItem('learnonline.auth'))).toMatchObject({ role: 'student' });
  });

  it('logout clears storage and state', () => {
    localStorage.setItem('learnonline.auth', JSON.stringify({ userId: '1', role: 'teacher' }));
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('isAuth')).toHaveTextContent('true');
    act(() => screen.getByText('logout').click());
    expect(screen.getByTestId('isAuth')).toHaveTextContent('false');
    expect(localStorage.getItem('learnonline.auth')).toBeNull();
  });

  it('recovers from corrupt localStorage value', () => {
    localStorage.setItem('learnonline.auth', 'not-json');
    render(<AuthProvider><Probe /></AuthProvider>);
    expect(screen.getByTestId('isAuth')).toHaveTextContent('false');
  });

  it('useAuth throws when used outside provider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});
