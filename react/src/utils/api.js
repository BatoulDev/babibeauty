// src/utils/api.js

/* ------------------ API Root ------------------ */
export const ORIGIN = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
export const API = ORIGIN + "/api";

/* ------------------ Auth Token ------------------ */
let AUTH_TOKEN = localStorage.getItem("auth_token") || null;

// expose global setter (e.g. call window.__setAuthToken(token) after login)
window.__setAuthToken = function (t) {
  AUTH_TOKEN = t || null;
  if (t) localStorage.setItem("auth_token", t);
  else localStorage.removeItem("auth_token");
};

export function setToken(t) { window.__setAuthToken(t); }
export function getToken() { return AUTH_TOKEN; }

/* ------------------ Internals ------------------ */
function authHeaders() {
  return AUTH_TOKEN ? { Authorization: "Bearer " + AUTH_TOKEN } : {};
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
    headers: baseHeaders(body != null ? Object.assign({ "Content-Type": "application/json" }, extraHeaders || {}) : (extraHeaders || {}))
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
  var res = await fetch(url, Object.assign({}, init, { headers: headers }));
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

/* ------------------ Media helper ------------------ */
/** Build a URL for files under /storage (accepts full URLs too) */
export function media(path) {
  path = path || "";
  if (!path) return "";
  return path.indexOf("http") === 0 ? path : (ORIGIN + "/storage/" + path.replace(/^\/+/, ""));
}
