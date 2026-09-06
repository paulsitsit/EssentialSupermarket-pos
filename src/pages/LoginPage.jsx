import { useState } from 'react';
import {
  login,
  saveAuth
} from '../api/auth';

const POS_ALLOWED_ROLES = [
  'cashier',
  'admin',
  'manager'
];

export default function LoginPage({
  onLoggedIn
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] =
    useState('');
  const [loading, setLoading] =
    useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();

    setLoading(true);
    setError('');

    try {
      const response = await login(
        email,
        password
      );

      const token = response?.token;
      const account = response?.account;

      if (!token || !account) {
        throw new Error(
          'Invalid login response from the server.'
        );
      }

      const role = String(
        account.role || ''
      ).toLowerCase();

      if (!POS_ALLOWED_ROLES.includes(role)) {
        throw new Error(
          'This account is not authorized to access the Point of Sale system.'
        );
      }

      saveAuth(token, account);

      onLoggedIn?.(account);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        'Login failed';

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <div
        className="card"
        style={{
          maxWidth: 360,
          margin: '80px auto'
        }}
      >
        <h1
          style={{
            fontSize: 20,
            marginBottom: 8
          }}
        >
          Essential Supermarket POS
        </h1>

        <p
          style={{
            marginTop: 0,
            marginBottom: 16,
            color: '#666',
            fontSize: 14
          }}
        >
          Cashier sign-in
        </p>

        <form onSubmit={handleSubmit}>
          <label
            style={{
              display: 'block',
              marginBottom: 12
            }}
          >
            <div
              style={{
                fontSize: 14,
                marginBottom: 4
              }}
            >
              Email
            </div>

            <input
              className="input"
              type="email"
              required
              value={email}
              onChange={event =>
                setEmail(event.target.value)
              }
              placeholder="cashier@essential.com"
              autoComplete="username"
            />
          </label>

          <label
            style={{
              display: 'block',
              marginBottom: 16
            }}
          >
            <div
              style={{
                fontSize: 14,
                marginBottom: 4
              }}
            >
              Password
            </div>

            <input
              className="input"
              type="password"
              required
              minLength="8"
              value={password}
              onChange={event =>
                setPassword(event.target.value)
              }
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </label>

          {error && (
            <div
              className="error"
              style={{
                marginBottom: 12
              }}
            >
              {error}
            </div>
          )}

          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{
              width: '100%'
            }}
          >
            {loading
              ? 'Signing in…'
              : 'Sign in to POS'}
          </button>
        </form>
      </div>
    </div>
  );
}