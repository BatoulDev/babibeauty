// src/utils/auth.js
const ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const API_ROOT = `${ORIGIN}/api`;
const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

export function setAuthToken(token) {
  window.__setAuthToken?.(token);
}

export function getAuthToken() {
  return localStorage.getItem(TOKEN_KEY) || null;
}

export function getAuthUser() {
  try { return JSON.parse(localStorage.getItem(USER_KEY) || "null"); } catch { return null; }
}

export function logout() {
  setAuthToken(null);
  localStorage.removeItem(USER_KEY);
}

export async function login(email, password) {
  const res = await fetch(`${API_ROOT}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ email, password, device_name: "web" }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || "Login failed";
    throw new Error(msg);
  }

  // Persist token & user for the whole app
  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  setAuthToken(data.token);

  return data; // { message, user, token, token_type }
}
