import { useState } from 'react';

function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    const validUsername = 'testuser';
    const validPassword = 'testPassword';

    if (username === validUsername && password === validPassword) {
      sessionStorage.setItem('artfolio_logged_in', 'true');
      onLoginSuccess();
      return;
    }

    setError('Invalid username or password.');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">ArtFolio</h1>
        <p className="login-subtitle">
          Sign in to access the portfolio dashboard.
        </p>

        <div className="login-demo-box">
          <strong>Demo credentials</strong>
          <div>Username: testuser</div>
          <div>Password: testPassword</div>
        </div>

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
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;