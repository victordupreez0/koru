import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '../../src/components/ProtectedRoute.jsx';
import { AuthProvider } from '../../src/contexts/AuthContext.jsx';

function renderAt(initial, session, ui) {
  if (session) localStorage.setItem('learnonline.auth', JSON.stringify(session));
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<div>landing</div>} />
          <Route path="/dashboard" element={<div>dashboard</div>} />
          <Route path="/secret" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => localStorage.clear());

  it('redirects to landing when unauthenticated', () => {
    renderAt('/secret', null, <ProtectedRoute><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('landing')).toBeInTheDocument();
  });

  it('renders children when authenticated and no role restriction', () => {
    renderAt('/secret', { userId: '1', role: 'student' }, <ProtectedRoute><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });

  it('redirects to dashboard when role not allowed', () => {
    renderAt('/secret', { userId: '1', role: 'student' }, <ProtectedRoute allowedRoles={['teacher']}><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('dashboard')).toBeInTheDocument();
  });

  it('renders children when role allowed', () => {
    renderAt('/secret', { userId: '1', role: 'teacher' }, <ProtectedRoute allowedRoles={['teacher']}><div>secret</div></ProtectedRoute>);
    expect(screen.getByText('secret')).toBeInTheDocument();
  });
});
