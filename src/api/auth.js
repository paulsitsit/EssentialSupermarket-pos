import client from './client';

const POS_ALLOWED_ROLES = [
  'cashier',
  'admin',
  'manager'
];

function isAllowedPosUser(user) {
  const role = String(
    user?.role || ''
  ).toLowerCase();

  return POS_ALLOWED_ROLES.includes(role);
}

export async function login(email, password) {
  const response = await client.post(
    '/auth/login',
    {
      email,
      password
    }
  );

  return response.data;
}

export function logout() {
  localStorage.removeItem('pos_token');
  localStorage.removeItem('pos_user');
}

export function getCurrentUser() {
  const userString =
    localStorage.getItem('pos_user');

  if (!userString) {
    return null;
  }

  try {
    const user = JSON.parse(userString);

    if (!isAllowedPosUser(user)) {
      logout();
      return null;
    }

    return user;
  } catch {
    logout();
    return null;
  }
}

export function saveAuth(token, user) {
  if (!token || !isAllowedPosUser(user)) {
    throw new Error(
      'Invalid POS authentication data.'
    );
  }

  localStorage.setItem('pos_token', token);

  localStorage.setItem(
    'pos_user',
    JSON.stringify(user)
  );
}