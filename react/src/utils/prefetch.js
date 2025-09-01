// react/src/utils/prefetch.js
import { fetchJson } from "./api";

const mem = new Map(); // key -> { _type: "data" | "promise", payload, ts }
const TTL_MS = 2 * 60 * 1000; // 2 minutes
const VERSION = "v1"; // bump to invalidate all localStorage caches on deploy

const now = () => Date.now();
const kCat = (catId) => `${VERSION}::cat:${catId}:p1:lite`;
const kProd = (id)   => `${VERSION}::prod:${id}:fast`;

function fresh(entry) {
  return entry && entry._type === "data" && now() - entry.ts < TTL_MS;
}

function readLS(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (now() - (obj.ts || 0) > TTL_MS) return null;
    return obj.payload || null;
  } catch { return null; }
}

function writeLS(key, payload) {
  try {
    localStorage.setItem(key, JSON.stringify({ ts: now(), payload }));
  } catch {}
}

/* ---------------- Category page 1 (lite) ---------------- */

export async function prefetchCategoryFirstPage(catId) {
  if (!catId) return;
  const key = kCat(catId);

  // memory hit
  const m = mem.get(key);
  if (fresh(m)) return m.payload;
  if (m && m._type === "promise") return m.payload;

  // localStorage hit
  const ls = readLS(key);
  if (ls) {
    mem.set(key, { _type: "data", payload: ls, ts: now() });
    return ls;
  }

  // fetch
  const qs = new URLSearchParams({
    category_id: String(catId),
    page: "1",
    per_page: "12",
    lite: "1",
  }).toString();

  const p = fetchJson(`/api/products?${qs}`)
    .then((res) => {
      mem.set(key, { _type: "data", payload: res, ts: now() });
      writeLS(key, res);
      return res;
    })
    .catch((e) => { mem.delete(key); throw e; });

  mem.set(key, { _type: "promise", payload: p, ts: now() });
  return p;
}

export function readPrefetchedCategoryFirstPage(catId) {
  const key = kCat(catId);
  const m = mem.get(key);
  if (fresh(m)) return m.payload;
  const ls = readLS(key);
  if (ls) {
    mem.set(key, { _type: "data", payload: ls, ts: now() });
    return ls;
  }
  return null;
}

/* ---------------- Product details (fast) ---------------- */

export async function prefetchProductDetails(id) {
  if (!id) return;
  const key = kProd(id);

  const m = mem.get(key);
  if (fresh(m)) return m.payload;
  if (m && m._type === "promise") return m.payload;

  const ls = readLS(key);
  if (ls) {
    mem.set(key, { _type: "data", payload: ls, ts: now() });
    // warm image asynchronously
    if (ls?.image_url && typeof Image !== "undefined") {
      try { const img = new Image(); img.decoding = "async"; img.loading = "eager"; img.src = ls.image_url; } catch {}
    }
    return ls;
  }

  const p = fetchJson(`/api/products/${id}`)
    .then((res) => {
      mem.set(key, { _type: "data", payload: res, ts: now() });
      writeLS(key, res);
      if (res?.image_url && typeof Image !== "undefined") {
        try { const img = new Image(); img.decoding = "async"; img.loading = "eager"; img.src = res.image_url; } catch {}
      }
      return res;
    })
    .catch((e) => { mem.delete(key); throw e; });

  mem.set(key, { _type: "promise", payload: p, ts: now() });
  return p;
}

export function readPrefetchedProductDetails(id) {
  const key = kProd(id);
  const m = mem.get(key);
  if (fresh(m)) return m.payload;
  const ls = readLS(key);
  if (ls) {
    mem.set(key, { _type: "data", payload: ls, ts: now() });
    return ls;
  }
  return null;
}
