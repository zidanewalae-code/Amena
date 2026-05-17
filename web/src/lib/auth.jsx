import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

function readTokenPayload(rawToken) {
  try {
    const tokenPart = rawToken.split('.')[1];
    if (!tokenPart) {
      return null;
    }

    const normalized = tokenPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    return JSON.parse(window.atob(padded));
  } catch {
    return null;
  }
}

function readStoredUser() {
  const rawUser = window.localStorage.getItem('amena_user');
  const rawToken = window.localStorage.getItem('amena_token');
  const tokenPayload = rawToken ? readTokenPayload(rawToken) : null;
  let storedUser = null;

  try {
    storedUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    storedUser = null;
  }

  return {
    user: storedUser
      ? {
          ...storedUser,
          role: tokenPayload?.role || storedUser.role
        }
      : null,
    token: rawToken || null
  };
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = readStoredUser();
    setToken(stored.token);
    setUser(stored.user);
    setReady(true);
  }, []);

  function login(authPayload) {
    window.localStorage.setItem('amena_token', authPayload.token);
    window.localStorage.setItem('amena_user', JSON.stringify(authPayload.user));
    setToken(authPayload.token);
    setUser(authPayload.user);
  }

  function logout() {
    window.localStorage.removeItem('amena_token');
    window.localStorage.removeItem('amena_user');
    setToken(null);
    setUser(null);
  }

  const value = { token, user, ready, login, logout, isAuthed: Boolean(token) };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}