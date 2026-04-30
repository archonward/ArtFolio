import { AUTH_TOKEN_STORAGE_KEY, apiFetch } from './api';

export async function createDemoSession() {
  const res = await apiFetch('/api/demo-session', {
    method: 'POST',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'Demo access failed.');
  }

  if (!data.token) {
    throw new Error('Demo access succeeded but no token was returned.');
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
