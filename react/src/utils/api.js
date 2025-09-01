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
  let merged = { Accept: "application/json", ...authHeaders() };
  if (extra) merged = { ...merged, ...extra };
  return merged;
}

function firstValidationError(errors) {
  if (!errors) return null;
  const keys = Object.keys(errors);
  if (!keys.length) return null;
  const arr = errors[keys[0]];
  if (Array.isArray(arr) && arr.length) return arr[0];
  return null;
}

/** Parse body once, handle 204, surface Laravel 422 nicely */
async function handle(res) {
  let text = "";
  try { text = await res.text(); } catch {}
  let data = null;
  if (text) {
    try { data = JSON.parse(text); } catch {}
  }

  if (!res.ok) {
    let message = null;
    if (data && data.errors) {
      const fv = firstValidationError(data.errors);
      if (fv) message = fv;
    }
    if (!message && data && data.message) message = data.message;
    if (!message) message = text || res.statusText;

    const err = new Error(message);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  // 204 or empty body
  return data;
}

async function req(method, path, body, extraHeaders) {
  const init = {
    method,
    headers: baseHeaders(body != null ? { "Content-Type": "application/json", ...(extraHeaders || {}) } : (extraHeaders || {})),
    credentials: WITH_CREDENTIALS ? "include" : "omit",
    // IMPORTANT: don't kill HTTP caching on GETs
    ...(method === "GET" ? { cache: "default" } : {}),
  };
  if (body != null) init.body = JSON.stringify(body);
  const res = await fetch(apiUrl(path), init);
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
 *
 * Options:
 *  - params: { k: v } to be appended as query string
 *  - timeout: ms (default 10000)
 *  - cache: (let browser decide; don't set "no-store" unless you must)
 */
const INFLIGHT = new Map(); // key -> Promise
function makeKey(method, url) { return `${method} ${url}`; }

export async function fetchJson(path, init = {}) {
  // build URL
  let url;
  if (path.indexOf("http") === 0) {
    url = path;
  } else if (path.indexOf("/api") === 0) {
    url = ORIGIN + path;
  } else {
    url = apiUrl(path);
  }

  // merge params into URL if provided
  if (init.params && typeof init.params === "object") {
    const usp = new URL(url, window.location.origin);
    for (const [k, v] of Object.entries(init.params)) {
      if (v !== undefined && v !== null) usp.searchParams.set(k, String(v));
    }
    url = usp.toString();
  }

  const method = (init.method || "GET").toUpperCase();
  const headers = baseHeaders(init.headers || {});
  const credentials = WITH_CREDENTIALS ? "include" : "omit";

  // default timeout for fetch (abort after X ms)
  const timeoutMs = typeof init.timeout === "number" ? init.timeout : 10000;
  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  let timeoutId = null;
  if (controller && timeoutMs > 0) {
    timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  }

  // GET de-duplication: share in-flight identical GETs
  const canDedupe = method === "GET" && !init.body;
  const inflightKey = canDedupe ? makeKey(method, url) : null;
  if (canDedupe && INFLIGHT.has(inflightKey)) {
    return INFLIGHT.get(inflightKey);
  }

  const fetchInit = {
    ...init,
    method,
    headers,
    credentials,
    // don’t override cache unless caller explicitly sets it
    cache: init.cache || "default",
    signal: controller ? controller.signal : undefined,
  };

  // Never pass our custom keys down
  delete fetchInit.params;
  delete fetchInit.timeout;

  const p = fetch(url, fetchInit)
    .then((res) => handle(res))
    .finally(() => {
      if (timeoutId) clearTimeout(timeoutId);
      if (inflightKey) INFLIGHT.delete(inflightKey);
    });

  if (inflightKey) INFLIGHT.set(inflightKey, p);

  return p;
}

/* ------------------ Simple in-memory cache ------------------ */
const CACHE = new Map();
/**
 * Cache GET responses for ttlMs (default 60s)
 * Usage: cached("/categories"), cached("products?category_id=3", 120000)
 */
export async function cached(path, ttlMs) {
  if (typeof ttlMs !== "number") ttlMs = 60000;
  const key = "GET " + path;
  const now = Date.now();
  const hit = CACHE.get(key);
  if (hit && (now - hit.time) < ttlMs) return hit.data;

  let data;
  if (path.indexOf("http") === 0 || path.indexOf("/api") === 0) {
    data = await fetchJson(path);
  } else {
    data = await get(path);
  }

  CACHE.set(key, { time: now, data: data });
  return data;
}

/* ------------------ localStorage cache + prefetch ------------------ */
function _fullUrl(path) {
  return path.indexOf("http") === 0
    ? path
    : path.indexOf("/api") === 0
    ? ORIGIN + path
    : apiUrl(path);
}
function _cacheKey(path) { return "L1::" + _fullUrl(path); }

/** Read-through cache stored in localStorage (default TTL 5 min) */
export async function cachedLocal(path, ttlMs) {
  ttlMs = typeof ttlMs === "number" ? ttlMs : 300000;
  const key = _cacheKey(path);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const rec = JSON.parse(raw);
      if (Date.now() - rec.t < ttlMs) return rec.d;
    }
  } catch {}
  const data = await fetchJson(path);
  try { localStorage.setItem(key, JSON.stringify({ t: Date.now(), d: data })); } catch {}
  return data;
}

/** Fire-and-forget warm-up */
export function prefetch(path) {
  return cachedLocal(path, 300000).then(() => {});
}

/* ------------------ Media helper ------------------ */
/** Build a URL for files under /storage (accepts full URLs too) */
export function media(path) {
  path = path || "";
  if (!path) return "";
  return path.indexOf("http") === 0 ? path : (ORIGIN + "/storage/" + path.replace(/^\/+/, ""));
}
