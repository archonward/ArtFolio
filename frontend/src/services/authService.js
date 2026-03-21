import { AUTH_TOKEN_STORAGE_KEY, apiFetch } from './api';

export async function login(username, password) {
  const res = await apiFetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Login failed.');
  }

  if (!data.token) {
    throw new Error('Login succeeded but no token was returned.');
  }

  sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, data.token);

  return data;
}

export function isLoggedIn() {
  return Boolean(sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY));
}

export function logout() {
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}
