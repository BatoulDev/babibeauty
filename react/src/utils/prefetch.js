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

/* ---------------- Hover prefetch for /category/:id links ---------------- */

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
 * Install a delegated hover/focus/touch prefetch on any link that points to
 * /category/:id. Also works if the element (or a parent) has data-cat-id.
 * Call once at app startup.
 */
export function installCategoryHoverPrefetch({
  selector = 'a[href^="/category/"], a[href*="/category/"]',
  attr = "data-cat-id",
  delayMs = 80,
} = {}) {
  if (typeof window === "undefined" || typeof document === "undefined") return () => {};

  const seen = new Set(); // catIds we've already prefetched in this session

  const schedule = (catId) => {
    if (!Number.isFinite(catId) || seen.has(catId)) return;
    seen.add(catId);

    const runner = () =>
      prefetchCategoryFirstPage(catId)
        .then((res) => {
          // warm a few images for ultra-fast first paint
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
    // prefer explicit data attribute on the element or its parents
    let node = el;
    for (let i = 0; i < 3 && node; i += 1, node = node.parentElement) {
      const v = node?.getAttribute?.(attr);
      if (v) return Number(v);
    }
    // parse href (/category/:id)
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

    // tiny debounce so we don’t prefetch while the cursor is just passing over
    clearTimeout(a.__pf_timer);
    a.__pf_timer = setTimeout(() => schedule(id), delayMs);
  };

  document.addEventListener("mouseover", handler, { passive: true });
  // focusin doesn't need passive; leave options empty for widest support
  document.addEventListener("focusin", handler);
  document.addEventListener("touchstart", handler, { passive: true });

  // uninstaller
  return () => {
    document.removeEventListener("mouseover", handler);
    document.removeEventListener("focusin", handler);
    document.removeEventListener("touchstart", handler);
  };
}
