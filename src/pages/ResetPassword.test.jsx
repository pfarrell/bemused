// src/pages/ResetPassword.test.jsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import ResetPassword from './ResetPassword';
import { apiService } from '../services/api';

vi.mock('../services/api', () => ({
  apiService: {
    validateResetToken: vi.fn(),
    resetPassword: vi.fn(),
  },
}));

const renderPage = (token = 'abc123') =>
  render(
    <MemoryRouter initialEntries={[`/reset-password/${token}`]}>
      <Routes>
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </MemoryRouter>
  );

describe('ResetPassword', () => {
  beforeEach(() => {
    apiService.validateResetToken.mockReset();
    apiService.resetPassword.mockReset();
  });

  test('shows an invalid-link message when the token does not validate', async () => {
    apiService.validateResetToken.mockResolvedValue({ data: { valid: false } });

    renderPage();

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument();
    expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
  });

  test('shows the new-password form when the token validates, and submits it', async () => {
    apiService.validateResetToken.mockResolvedValue({ data: { valid: true } });
    apiService.resetPassword.mockResolvedValue({ data: { ok: true } });

    renderPage('goodtoken');
    await screen.findByLabelText('New Password');

    await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(apiService.resetPassword).toHaveBeenCalledWith('goodtoken', 'newpass123');
    expect(await screen.findByText(/password has been reset/i)).toBeInTheDocument();
  });

  test('shows a mismatch error without calling the API when passwords differ', async () => {
    apiService.validateResetToken.mockResolvedValue({ data: { valid: true } });

    renderPage('goodtoken');
    await screen.findByLabelText('New Password');

    await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'somethingelse');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText(/do not match/i)).toBeInTheDocument();
    expect(apiService.resetPassword).not.toHaveBeenCalled();
  });

  test('shows the error returned by the API on a failed reset', async () => {
    apiService.validateResetToken.mockResolvedValue({ data: { valid: true } });
    apiService.resetPassword.mockRejectedValue({ response: { data: { error: 'This reset link is invalid or has expired' } } });

    renderPage('goodtoken');
    await screen.findByLabelText('New Password');

    await userEvent.type(screen.getByLabelText('New Password'), 'newpass123');
    await userEvent.type(screen.getByLabelText('Confirm New Password'), 'newpass123');
    await userEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(await screen.findByText('This reset link is invalid or has expired')).toBeInTheDocument();
  });
});
