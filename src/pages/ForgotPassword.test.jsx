import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ForgotPassword from './ForgotPassword';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: { forgotPassword: vi.fn() },
}));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPassword />
    </MemoryRouter>
  );

describe('ForgotPassword', () => {
  beforeEach(() => {
    apiService.forgotPassword.mockReset();
  });

  test('submits the entered username and shows the generic confirmation message', async () => {
    apiService.forgotPassword.mockResolvedValue({ data: { message: 'ignored' } });

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'patuser');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(apiService.forgotPassword).toHaveBeenCalledWith('patuser');
    expect(await screen.findByText(/if an account with that username has an email on file/i)).toBeInTheDocument();
  });

  test('shows the same generic confirmation message even if the request fails', async () => {
    apiService.forgotPassword.mockRejectedValue(new Error('network error'));

    renderPage();
    await userEvent.type(screen.getByLabelText('Username'), 'patuser');
    await userEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    expect(await screen.findByText(/if an account with that username has an email on file/i)).toBeInTheDocument();
  });
});
