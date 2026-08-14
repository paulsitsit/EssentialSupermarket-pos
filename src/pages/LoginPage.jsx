import { useState } from 'react';
import { login, saveAuth } from '../api/auth';

export default function LoginPage({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await login(email, password);
      const token = res.token;
      const user = res.user || res;

      if (!token) {
        throw new Error('No token received');
      }

      saveAuth(token, user);
      onLoggedIn?.(user);
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div className="card" style={{ maxWidth: 360, margin: '80px auto' }}>
        <h1 style={{ fontSize: 20, marginBottom: 16 }}>Cashier POS – Login</h1>

        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: 12 }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Email</div>
            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cashier@essential.com"
            />
          </label>

          <label style={{ display: 'block', marginBottom: 16 }}>
            <div style={{ fontSize: 14, marginBottom: 4 }}>Password</div>
            <input
              className="input"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="error" style={{ marginBottom: 12 }}>{error}</div>}

          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ width: '100%' }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}