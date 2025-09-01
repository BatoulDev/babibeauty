// src/pages/CategoryPage/CategoryPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, NavLink } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";
import { readPrefetchedCategoryFirstPage, prefetchProductDetails } from "../../utils/prefetch";

/* ---------------- helpers ---------------- */

const isAbortError = (e) =>
  e?.name === "AbortError" ||
  e?.code === 20 ||
  e?.message?.toLowerCase?.().includes("aborted");

function usePreloadImages(urls = [], count = 2) {
  useEffect(() => {
    if (!urls?.length) return;
    const head = document.head;
    const links = urls.slice(0, count).map((u) => {
      if (!u) return null;
      if ([...head.querySelectorAll('link[rel="preload"][as="image"]')].some(
        (lnk) => lnk.getAttribute("href") === u
      ))
        return null;
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = u;
      head.appendChild(l);
      return l;
    });
    return () => links.forEach((l) => l && head.removeChild(l));
  }, [urls, count]);
}

function SpeedyImage({ src, srcSet, sizes, alt, index }) {
  const [loaded, setLoaded] = useState(false);
  const eager = index < 4;
  return (
    <img
      className={loaded ? "bb-img is-loaded" : "bb-img"}
      alt={alt || ""}
      width={640}
      height={800}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      src={src}
      srcSet={srcSet || undefined}
      sizes={sizes || "(max-width: 640px) 48vw, (max-width: 1024px) 30vw, 22vw"}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        e.currentTarget.src = "/placeholder.png";
        e.currentTarget.srcset = "";
        setLoaded(true);
      }}
    />
  );
}

/* ---------------- page ---------------- */

export default function CategoryPage() {
  const { id } = useParams(); // /category/:id
  const catId = Number(id);

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // avoid header flashes
  const [firstFetchDone, setFirstFetchDone] = useState(false);

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const controllerRef = useRef(null); // keep a single in-flight request

  const parseResponse = (res, pageNum) => {
    const data = res?.data ?? res ?? [];
    const arr = Array.isArray(data) ? data : [];
    const currentPage = Number(res?.current_page ?? res?.meta?.current_page ?? pageNum);
    const lastPage = Number(res?.last_page ?? res?.meta?.last_page ?? pageNum);
    return { arr, hasMore: currentPage < lastPage };
  };

  const loadPage = useCallback(
    async (pageNum, { silent = false } = {}) => {
      if (loadingRef.current) return;
      if (!Number.isFinite(catId) || catId <= 0) {
        setErr("Invalid category id.");
        setLoading(false);
        return;
      }

      // abort any previous request before starting a new one
      if (controllerRef.current) controllerRef.current.abort("newer-request");
      const ctrl = new AbortController();
      controllerRef.current = ctrl;

      loadingRef.current = true;
      if (!silent) setLoading(true);
      try {
        const qs = new URLSearchParams({
          category_id: String(catId),
          page: String(pageNum),
          per_page: pageNum === 1 ? "12" : "24",
          lite: "1",
        }).toString();

        // ensure fetchJson forwards the signal to fetch()
        const res = await fetchJson(`/api/products?${qs}`, { signal: ctrl.signal });
        const { arr, hasMore } = parseResponse(res, pageNum);

        setItems((prev) => (pageNum === 1 ? arr : prev.concat(arr)));
        setHasMore(Boolean(hasMore));
        setErr("");
      } catch (e) {
        if (isAbortError(e)) {
          // Silent on aborts
          return;
        }
        setErr(e?.message || "Failed to fetch products.");
      } finally {
        if (pageNum === 1) setFirstFetchDone(true);
        if (!silent) setLoading(false);
        loadingRef.current = false;
      }
    },
    [catId]
  );

  // Reset when category changes
  useEffect(() => {
    if (controllerRef.current) controllerRef.current.abort("category-changed");

    setLoading(true);
    setFirstFetchDone(false);

    setItems([]);
    setPage(1);
    setHasMore(true);
    setErr("");
    try {
      window.scrollTo({ top: 0, behavior: "instant" });
    } catch {}

    // paint prefetched first page immediately (if present)
    const pref = readPrefetchedCategoryFirstPage(catId);
    if (pref) {
      const data = pref?.data ?? pref ?? [];
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
      setLoading(false);
      setFirstFetchDone(true);
      // Revalidate in background
      loadPage(1, { silent: true });
    } else {
      loadPage(1);
    }

    return () => {
      if (controllerRef.current) controllerRef.current.abort("unmount");
    };
  }, [catId, loadPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;

    let ticking = false;
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (ticking) return;
        if (first.isIntersecting && hasMore && !loadingRef.current) {
          ticking = true;
          const next = page + 1;
          setPage(next);
          loadPage(next).finally(() => {
            ticking = false;
          });
        }
      },
      { rootMargin: "800px 0px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, page, loadPage]);

  // Preload first few images
  const firstUrls = useMemo(
    () => (items || []).slice(0, 4).map((p) => p.image_url).filter(Boolean),
    [items]
  );
  usePreloadImages(firstUrls, 3);

  // skeletons while loading
  const list =
    items.length === 0 && loading
      ? Array.from({ length: 8 }).map((_, i) => ({ skeleton: true, id: `skel-${i}` }))
      : items;

  // header count label
  const countLabel = !firstFetchDone
    ? "…"
    : `${items.length}${items.length > 0 && hasMore ? " +" : ""} items`;

  return (
    <div className="container bb-prod-wrap">
      <div className="bb-prod-head">
        <h1 className="bb-prod-title">Products</h1>
        <span className="bb-prod-count">{countLabel}</span>
      </div>

      {/* Only show real errors (ignore aborts) */}
      {err && <div className="alert alert-danger">{err}</div>}

      {/* 🔕 Removed the "No products found" message completely */}

      <div className="bb-prod-grid">
        {list.map((p, idx) => (
          <article key={p.id ?? `skel-${idx}`} className={`bb-card ${p.skeleton ? "skeleton" : ""}`}>
            <div className="bb-imgbox">
              {!p.skeleton ? (
                <SpeedyImage src={p.image_url} srcSet={p.image_srcset} alt={p.name} index={idx} />
              ) : (
                <div className="bb-img-skel" />
              )}
            </div>

            <div className="bb-card-body">
              <h3 className="bb-name">{p.skeleton ? "\u00A0" : p.name}</h3>
              {!p.skeleton && <RatingStars value={p.rating ?? 0} count={p.reviews_count ?? 0} />}
              <div className="bb-price">
                {p.skeleton ? "\u00A0" : `$${Number(p.price ?? 0).toFixed(2)}`}
              </div>
              {!p.skeleton && (
                <NavLink
                  to={`/product/${p.id}`}
                  state={{ pre: { id: p.id, name: p.name, price: p.price, image_url: p.image_url } }}
                  className="bb-btn bb-btn-link"
                  onMouseEnter={() => prefetchProductDetails(p.id)}
                  onTouchStart={() => prefetchProductDetails(p.id)}
                  onFocus={() => prefetchProductDetails(p.id)}
                >
                  See Details
                </NavLink>
              )}
            </div>
          </article>
        ))}
      </div>

      <div ref={sentinelRef} style={{ height: 1 }} />

      {!loading && hasMore && items.length > 0 && (
        <div className="bb-load-more">
          <button
            className="bb-btn"
            onClick={() => {
              const n = page + 1;
              setPage(n);
              loadPage(n);
            }}
          >
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
