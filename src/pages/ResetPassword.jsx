// src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiService } from '../services/api';

const inputStyle = {
  width: '100%',
  padding: '0.625rem 0.75rem',
  backgroundColor: 'var(--color-bg-surface)',
  border: '1px solid var(--color-border-strong)',
  borderRadius: '6px',
  color: 'var(--color-text-primary)',
  fontSize: '1rem',
  boxSizing: 'border-box',
};

const labelStyle = {
  display: 'block',
  color: 'var(--color-text-primary)',
  fontSize: '0.875rem',
  fontWeight: '500',
  marginBottom: '0.375rem',
};

const errorBannerStyle = {
  backgroundColor: '#7f1d1d',
  border: '1px solid #991b1b',
  borderRadius: '6px',
  padding: '0.75rem 1rem',
  color: '#fca5a5',
  fontSize: '0.875rem',
};

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiService.validateResetToken(token)
      .then((res) => {
        if (!cancelled) setValid(Boolean(res.data?.valid));
      })
      .catch(() => {
        if (!cancelled) setValid(false);
      })
      .finally(() => {
        if (!cancelled) setValidating(false);
      });
    return () => { cancelled = true; };
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);
    try {
      await apiService.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--color-text-faint)' }}>Checking your reset link...</p>
      </div>
    );
  }

  if (done) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>Your password has been reset.</p>
          <button
            onClick={() => navigate('/login')}
            style={{ marginTop: '1.5rem', padding: '0.75rem 1.5rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '500', cursor: 'pointer' }}
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (!valid) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
        <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
          <p style={{ color: 'var(--color-text-primary)' }}>This reset link is invalid or has expired.</p>
          <p style={{ marginTop: '1.5rem' }}>
            <Link to="/forgot-password" style={{ color: '#3b82f6', textDecoration: 'none' }}>Request a new link</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Choose a new password</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div style={errorBannerStyle}>{error}</div>}

          <div>
            <label htmlFor="newPassword" style={labelStyle}>New Password</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Choose a new password (min 6 characters)"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm New Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your new password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '500', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.6 : 1 }}
          >
            {submitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
