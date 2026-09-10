// src/pages/Signup.jsx — admin-only tool for creating accounts for other people.
// Self-service signup no longer exists: the site requires a login, so this
// never logs the admin out of their own session.
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';

const Signup = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [createdUsername, setCreatedUsername] = useState(null);

  const { signup, loading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    try {
      const result = await signup(username, password, email || null);
      if (result.success) {
        setCreatedUsername(result.user.username);
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');
      } else {
        setError(result.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Signup failed. Please check console for details.');
    }
  };

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

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <p style={{ color: 'var(--color-text-faint)', marginTop: '0.5rem' }}>Create an account for someone else</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {createdUsername && (
            <div style={{ backgroundColor: '#14532d', border: '1px solid #166534', borderRadius: '6px', padding: '0.75rem 1rem', color: '#bbf7d0', fontSize: '0.875rem' }}>
              Account created for "{createdUsername}".
            </div>
          )}

          {error && (
            <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #991b1b', borderRadius: '6px', padding: '0.75rem 1rem', color: '#fca5a5', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

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
              placeholder="Choose a username (min 3 characters)"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="email" style={labelStyle}>Email (optional)</label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="password" style={labelStyle}>Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Choose a password (min 6 characters)"
              style={inputStyle}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" style={labelStyle}>Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontSize: '1rem', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Signup;
