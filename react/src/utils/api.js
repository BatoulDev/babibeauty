// src/utils/api.js
export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export async function fetchJson(path, { params, withCredentials = false, ...opts } = {}) {
  const url = new URL(path, API_BASE);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json", ...(opts.body && { "Content-Type": "application/json" }) },
    credentials: withCredentials ? "include" : "omit",
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ✅ add this in-memory cache
const _cache = new Map();
export async function cached(key, loader, ttlMs = 5 * 60 * 1000) {
  const hit = _cache.get(key);
  const now = Date.now();
  if (hit && now - hit.t < ttlMs) return hit.v;
  const v = await loader();
  _cache.set(key, { v, t: now });
  return v;
}
// (optional) clear cache: export function clearCache(key){ key ? _cache.delete(key) : _cache.clear(); }
