// src/pages/ForgotPassword.jsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { apiService } from '../services/api';

const GENERIC_MESSAGE = 'If an account with that username has an email on file, a reset link has been sent.';

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

const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await apiService.forgotPassword(username);
    } catch (err) {
      console.error('Forgot-password request error:', err);
    } finally {
      // The backend always returns the same generic outcome regardless of
      // success/failure — showing the confirmation on both branches here
      // preserves that (a network error must not look different from "sent").
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Reset your password</p>
        </div>

        {submitted ? (
          <div style={{ textAlign: 'center', color: 'var(--color-text-primary)' }}>
            <p>{GENERIC_MESSAGE}</p>
            <p style={{ marginTop: '1.5rem' }}>
              <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to sign in</Link>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="username" style={labelStyle}>Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
            >
              {loading ? 'Sending...' : 'Send reset link'}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <p style={{ color: 'var(--color-text-faint)', fontSize: '0.875rem' }}>
            <Link to="/login" style={{ color: '#3b82f6', textDecoration: 'none' }}>Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
