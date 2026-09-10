import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AdminSignups from './AdminSignups';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    getSignups: vi.fn(),
    markSignupsSeen: vi.fn(),
  },
}));

const renderSignups = () =>
  render(
    <MemoryRouter>
      <AdminSignups />
    </MemoryRouter>
  );

const passwordSignup = {
  id: 1, username: 'newuser', email: 'newuser@example.com', method: 'password',
  created_at: '2026-09-10T00:00:00Z',
};

const googleSignup = {
  id: 2, username: 'gsignup', email: 'gsignup@example.com', method: 'google',
  created_at: '2026-09-09T00:00:00Z',
};

describe('AdminSignups', () => {
  test('renders rows with username, email, method, and created date', async () => {
    apiService.getSignups.mockResolvedValue({
      data: { signups: [passwordSignup], pagination: { page: 1, limit: 25, total: 1, totalPages: 1 } },
    });
    apiService.markSignupsSeen.mockResolvedValue({ data: { success: true } });
    renderSignups();

    await screen.findByText('newuser');
    expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
    expect(screen.getByText('password')).toBeInTheDocument();
  });

  test('shows rows from different signup methods', async () => {
    apiService.getSignups.mockResolvedValue({
      data: { signups: [passwordSignup, googleSignup], pagination: { page: 1, limit: 25, total: 2, totalPages: 1 } },
    });
    apiService.markSignupsSeen.mockResolvedValue({ data: { success: true } });
    renderSignups();

    await screen.findByText('newuser');
    expect(screen.getByText('gsignup')).toBeInTheDocument();
    expect(screen.getByText('google')).toBeInTheDocument();
  });

  test('marks signups seen on mount, clearing the badge', async () => {
    apiService.getSignups.mockResolvedValue({
      data: { signups: [passwordSignup], pagination: { page: 1, limit: 25, total: 1, totalPages: 1 } },
    });
    apiService.markSignupsSeen.mockResolvedValue({ data: { success: true } });
    renderSignups();

    await screen.findByText('newuser');
    expect(apiService.markSignupsSeen).toHaveBeenCalled();
  });

  test('shows an empty state when there are no signups', async () => {
    apiService.getSignups.mockResolvedValue({
      data: { signups: [], pagination: { page: 1, limit: 25, total: 0, totalPages: 0 } },
    });
    apiService.markSignupsSeen.mockResolvedValue({ data: { success: true } });
    renderSignups();

    expect(await screen.findByText('No signups yet')).toBeInTheDocument();
  });
});
