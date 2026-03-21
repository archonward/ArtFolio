const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const AUTH_TOKEN_STORAGE_KEY = 'artfolio_auth_token';

export function buildApiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  if (!API_BASE_URL) {
    return normalizedPath;
  }

  return `${API_BASE_URL}${normalizedPath}`;
}

export function getAuthToken() {
  return sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
}

export function clearAuthToken() {
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

export async function apiFetch(path, options = {}) {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(buildApiUrl(path), {
    ...options,
    headers,
  });
}
