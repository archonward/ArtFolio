import { useState } from 'react';
import { createDemoSession } from '../services/authService';

function LoginPage({ onLoginSuccess }) {
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleEnterDemo = async () => {
    if (submitting) {
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      await createDemoSession();
      onLoginSuccess();
      return;
    } catch (err) {
      setError(err.message || 'Unable to enter the demo right now.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ArtFolio</h1>
        <p className="login-subtitle">
          Enter the demo workspace to access the portfolio dashboard.
        </p>

        <div className="login-demo-box">
          This build uses a temporary demo access flow. No username or password is displayed or entered in the client.
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <button
          type="button"
          className="button button-primary login-button"
          onClick={handleEnterDemo}
          disabled={submitting}
        >
          {submitting ? 'Entering Demo...' : 'Enter Demo App'}
        </button>
      </div>
    </div>
  );
}

export default LoginPage;
