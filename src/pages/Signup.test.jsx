import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import Signup from './Signup';

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '../stores/authStore';

const renderSignup = () =>
  render(
    <MemoryRouter initialEntries={['/signup']}>
      <Signup />
    </MemoryRouter>
  );

const fillAndSubmit = async () => {
  await userEvent.type(screen.getByLabelText('Username'), 'patuser');
  await userEvent.type(screen.getByLabelText('Password'), 'hunter22');
  await userEvent.type(screen.getByLabelText('Confirm Password'), 'hunter22');
  await userEvent.click(screen.getByRole('button', { name: /create account/i }));
};

describe('Signup', () => {
  beforeEach(() => {
    useAuthStore.mockReturnValue({ signup: vi.fn(), loading: false });
  });

  test('does not render a Continue with Google link — this is an admin tool, not self-serve signup', () => {
    renderSignup();
    expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
  });

  test('shows a confirmation with the created username and clears the form, without navigating away', async () => {
    const signup = vi.fn().mockResolvedValue({ success: true, user: { username: 'patuser' } });
    useAuthStore.mockReturnValue({ signup, loading: false });

    renderSignup();
    await fillAndSubmit();

    expect(await screen.findByText('Account created for "patuser".')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveValue('');
    expect(signup).toHaveBeenCalledWith('patuser', 'hunter22', null);
  });

  test('shows the error returned by the store on failure', async () => {
    const signup = vi.fn().mockResolvedValue({ success: false, error: 'Username already taken' });
    useAuthStore.mockReturnValue({ signup, loading: false });

    renderSignup();
    await fillAndSubmit();

    expect(await screen.findByText('Username already taken')).toBeInTheDocument();
  });
});
