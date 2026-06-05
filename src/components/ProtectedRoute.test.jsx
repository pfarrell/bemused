import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';

const initialAuthState = {
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  loading: false,
};

const renderRoute = (authOverrides = {}, requireAdmin = false) => {
  useAuthStore.setState({ ...initialAuthState, ...authOverrides });
  return render(
    <MemoryRouter>
      <ProtectedRoute requireAdmin={requireAdmin}>
        <div>Protected Content</div>
      </ProtectedRoute>
    </MemoryRouter>
  );
};

beforeEach(() => {
  useAuthStore.setState(initialAuthState);
});

describe('ProtectedRoute', () => {
  test('does not render children when unauthenticated', () => {
    renderRoute({ isAuthenticated: false });
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', () => {
    renderRoute({ isAuthenticated: true, user: { id: 1, username: 'pat', admin: false } });
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  test('shows loading indicator while auth is initializing', () => {
    renderRoute({ loading: true });
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('shows access denied for authenticated non-admin when requireAdmin is true', () => {
    renderRoute(
      { isAuthenticated: true, isAdmin: false, user: { id: 1, username: 'pat', admin: false } },
      true
    );
    expect(screen.getByText('Access Denied')).toBeInTheDocument();
  });

  test('does not show protected content to non-admin when requireAdmin is true', () => {
    renderRoute(
      { isAuthenticated: true, isAdmin: false, user: { id: 1, username: 'pat', admin: false } },
      true
    );
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  test('renders children for admin user when requireAdmin is true', () => {
    renderRoute(
      { isAuthenticated: true, isAdmin: true, user: { id: 1, username: 'admin', admin: true } },
      true
    );
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
