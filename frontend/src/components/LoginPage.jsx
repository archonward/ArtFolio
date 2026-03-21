import { useState } from 'react';
import { login } from '../services/authService';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await login(username, password);
      onLoginSuccess();
      return;
    } catch (err) {
      setError(err.message || 'Invalid username or password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ArtFolio</h1>
        <p className="login-subtitle">
          Sign in to access the portfolio dashboard.
        </p>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                setError('');
              }}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="button button-primary login-button">
            {submitting ? 'Signing In...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
