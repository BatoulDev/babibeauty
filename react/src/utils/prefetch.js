// src/utils/prefetch.js
import { fetchJson } from "./api";

const mem = new Map(); // key -> { _type: "data" | "promise", payload, ts }
const TTL_MS = 2 * 60 * 1000; // 2 minutes
const VERSION = "v1"; // bump to invalidate all localStorage caches on deploy

const now = () => Date.now();
const kCat = (catId) => `${VERSION}::cat:${catId}:p1:lite`;
const kProd = (id) => `${VERSION}::prod:${id}:fast`;

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
  } catch {
    return null;
  }
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

  const m = mem.get(key);
  if (fresh(m)) return m.payload;
  if (m && m._type === "promise") return m.payload;

  const ls = readLS(key);
  if (ls) {
    mem.set(key, { _type: "data", payload: ls, ts: now() });
    return ls;
  }

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
    .catch((e) => {
      mem.delete(key);
      throw e;
    });

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
    if (ls?.image_url && typeof Image !== "undefined") {
      try {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = ls.image_url;
      } catch {}
    }
    return ls;
  }

  const p = fetchJson(`/api/products/${id}`)
    .then((res) => {
      mem.set(key, { _type: "data", payload: res, ts: now() });
      writeLS(key, res);
      if (res?.image_url && typeof Image !== "undefined") {
        try {
          const img = new Image();
          img.decoding = "async";
          img.loading = "eager";
          img.src = res.image_url;
        } catch {}
      }
      return res;
    })
    .catch((e) => {
      mem.delete(key);
      throw e;
    });

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

/* ---------------- Hover prefetch / warm images ---------------- */
function warmImages(urls = [], max = 6) {
  try {
    urls.slice(0, max).forEach((u) => {
      if (!u) return;
      const img = new Image();
      img.decoding = "async";
      img.loading = "eager";
      img.src = u;
    });
  } catch {}
}

/**
 * Prefetch/warm product images in the background.
 * Safe to call with any array of product objects that have `image_url`.
 */
export function prefetchImages(products = []) {
  if (!Array.isArray(products)) return;
  try {
    products.forEach((p) => {
      if (p?.image_url) {
        const img = new Image();
        img.decoding = "async";
        img.loading = "eager";
        img.src = p.image_url;
      }
    });
  } catch {}
}

/* ---------------- Hover prefetch for /category/:id links ---------------- */
export function installCategoryHoverPrefetch({
  selector = 'a[href^="/category/"], a[href*="/category/"]',
  attr = "data-cat-id",
  delayMs = 80,
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const seen = new Set();

  const schedule = (catId) => {
    if (!Number.isFinite(catId) || seen.has(catId)) return;
    seen.add(catId);

    const runner = () =>
      prefetchCategoryFirstPage(catId)
        .then((res) => {
          const data = res?.data ?? res ?? [];
          const arr = Array.isArray(data) ? data : [];
          const urls = arr.map((p) => p.image_url).filter(Boolean);
          warmImages(urls, 6);
        })
        .catch(() => {});

    if ("requestIdleCallback" in window) {
      requestIdleCallback(runner, { timeout: 300 });
    } else {
      setTimeout(runner, 0);
    }
  };

  const getIdFrom = (el) => {
    let node = el;
    for (let i = 0; i < 3 && node; i += 1, node = node.parentElement) {
      const v = node?.getAttribute?.(attr);
      if (v) return Number(v);
    }
    const href = el.getAttribute && el.getAttribute("href");
    if (!href) return null;
    const m = href.match(/\/category\/(\d+)(?:\D|$)/);
    return m ? Number(m[1]) : null;
  };

  const handler = (e) => {
    const a = e.target.closest?.(selector);
    if (!a) return;

    const id = getIdFrom(a);
    if (!Number.isFinite(id)) return;

    clearTimeout(a.__pf_timer);
    a.__pf_timer = setTimeout(() => schedule(id), delayMs);
  };

  document.addEventListener("mouseover", handler, { passive: true });
  document.addEventListener("focusin", handler);
  document.addEventListener("touchstart", handler, { passive: true });

  return () => {
    document.removeEventListener("mouseover", handler);
    document.removeEventListener("focusin", handler);
    document.removeEventListener("touchstart", handler);
  };
}
