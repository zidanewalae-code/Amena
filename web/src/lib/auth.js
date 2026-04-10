// Lightweight auth storage helpers for web pages.
const AUTH_KEY = 'amena_auth';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getStoredAuth() {
  if (!canUseStorage()) return null;
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch (_error) {
    return null;
  }
}

function saveAuth(authPayload) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(authPayload || {}));
}

function saveToken(token) {
  const current = getStoredAuth() || {};
  saveAuth({ ...current, token: token || '' });
}

function clearAuth() {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(AUTH_KEY);
}

export { AUTH_KEY, getStoredAuth, saveAuth, saveToken, clearAuth };
