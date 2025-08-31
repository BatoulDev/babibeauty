// src/utils/api.js

/* ------------------ API Root ------------------ */
export const ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
export const API = ORIGIN + "/api";

/* If you authenticate with cookies, set VITE_AUTH_MODE=cookie */
const WITH_CREDENTIALS = String(import.meta.env.VITE_AUTH_MODE || "").toLowerCase() === "cookie";

/* ------------------ Auth Token ------------------ */
let AUTH_TOKEN = localStorage.getItem("auth_token") || null;

// expose global setter (e.g. call window.__setAuthToken(token) after login)
window.__setAuthToken = function (t) {
  AUTH_TOKEN = t || null;
  if (t) localStorage.setItem("auth_token", t);
  else localStorage.removeItem("auth_token");
};

export function setToken(t) { window.__setAuthToken(t); }

// ✅ always read from storage in case another tab/page updated it
export function getToken() {
  return localStorage.getItem("auth_token") || AUTH_TOKEN || null;
}

/* ------------------ Internals ------------------ */
// ✅ read fresh token every request
function authHeaders() {
  const t = getToken();
  return t ? { Authorization: "Bearer " + t } : {};
}
function apiUrl(path) {
  return API + (path.charAt(0) === "/" ? path : ("/" + path));
}
function baseHeaders(extra) {
  var merged = Object.assign({ Accept: "application/json" }, authHeaders());
  if (extra) merged = Object.assign(merged, extra);
  return merged;
}

function firstValidationError(errors) {
  if (!errors) return null;
  var keys = Object.keys(errors);
  if (!keys.length) return null;
  var arr = errors[keys[0]];
  if (Array.isArray(arr) && arr.length) return arr[0];
  return null;
}

/** Parse body once, handle 204, surface Laravel 422 nicely */
async function handle(res) {
  var text = "";
  try { text = await res.text(); } catch (e) {}
  var data = null;
  if (text) {
    try { data = JSON.parse(text); } catch (e) {}
  }

  if (!res.ok) {
    var message = null;
    if (data && data.errors) {
      var fv = firstValidationError(data.errors);
      if (fv) message = fv;
    }
    if (!message && data && data.message) message = data.message;
    if (!message) message = text || res.statusText;

    var err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  // 204 or empty body
  return data;
}

async function req(method, path, body, extraHeaders) {
  var init = {
    method: method,
    headers: baseHeaders(body != null ? Object.assign({ "Content-Type": "application/json" }, extraHeaders || {}) : (extraHeaders || {})),
    credentials: WITH_CREDENTIALS ? "include" : "omit"
  };
  if (body != null) init.body = JSON.stringify(body);
  var res = await fetch(apiUrl(path), init);
  return handle(res);
}

/* ------------------ HTTP ------------------ */
export async function get(path)         { return req("GET", path); }
export async function post(path, body)  { return req("POST", path, body); }
export async function put(path, body)   { return req("PUT", path, body); }
export async function patch(path, body) { return req("PATCH", path, body); }
export async function del(path)         { return req("DELETE", path); }

/* ------------------ Back-compat fetcher ------------------ */
/**
 * fetchJson supports:
 *  - "products" or "/products"     -> ${ORIGIN}/api/products
 *  - "/api/products"               -> ${ORIGIN}/api/products
 *  - "https://..."                 -> absolute URL untouched
 */
export async function fetchJson(path, init) {
  init = init || {};
  var url;
  if (path.indexOf("http") === 0) {
    url = path;
  } else if (path.indexOf("/api") === 0) {
    url = ORIGIN + path;
  } else {
    url = apiUrl(path);
  }

  var headers = baseHeaders(init.headers || {});
  var res = await fetch(url, Object.assign({}, init, { headers: headers, credentials: WITH_CREDENTIALS ? "include" : "omit" }));
  return handle(res);
}

/* ------------------ Simple in-memory cache ------------------ */
const CACHE = new Map();
/**
 * Cache GET responses for ttlMs (default 60s)
 * Usage: cached("/categories"), cached("products?category_id=3", 120000)
 */
export async function cached(path, ttlMs) {
  if (typeof ttlMs !== "number") ttlMs = 60000;
  var key = "GET " + path;
  var now = Date.now();
  var hit = CACHE.get(key);
  if (hit && (now - hit.time) < ttlMs) return hit.data;

  var data;
  if (path.indexOf("http") === 0 || path.indexOf("/api") === 0) {
    data = await fetchJson(path);
  } else {
    data = await get(path);
  }

  CACHE.set(key, { time: now, data: data });
  return data;
}

/* ------------------ localStorage cache + prefetch ------------------ */
function _cacheKey(path) {
  var full =
    path.indexOf("http") === 0
      ? path
      : path.indexOf("/api") === 0
      ? ORIGIN + path
      : apiUrl(path);
  return "L1::" + full;
}

/** Read-through cache stored in localStorage (default TTL 5 min) */
export async function cachedLocal(path, ttlMs) {
  ttlMs = typeof ttlMs === "number" ? ttlMs : 300000;
  var key = _cacheKey(path);
  try {
    var raw = localStorage.getItem(key);
    if (raw) {
      var rec = JSON.parse(raw);
      if (Date.now() - rec.t < ttlMs) return rec.d;
    }
  } catch (e) {}
  var data = await fetchJson(path);
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); } catch (e) {}
  return data;
}

/** Fire-and-forget warm-up */
export function prefetch(path) {
  return cachedLocal(path, 300000).then(function () {});
}

/* ------------------ Media helper ------------------ */
/** Build a URL for files under /storage (accepts full URLs too) */
export function media(path) {
  path = path || "";
  if (!path) return "";
  return path.indexOf("http") === 0 ? path : (ORIGIN + "/storage/" + path.replace(/^\/+/, ""));
}
