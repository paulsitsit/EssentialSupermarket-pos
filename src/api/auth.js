import client from './client';

/**
 * Login
 * POST /api/auth/login
 * Body: { email, password }
 * Response: { token, user: { id, name, role, email } }
 */
export async function login(email, password) {
  const res = await client.post('/auth/login', { email, password });
  return res.data;
}

/**
 * Logout (client-side only for now)
 */
export function logout() {
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser() {
  const userStr = localStorage.getItem('pos_user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

/**
 * Save auth data after login
 */
export function saveAuth(token, user) {
  localStorage.setItem('pos_token', token);
  localStorage.setItem('pos_user', JSON.stringify(user));
}