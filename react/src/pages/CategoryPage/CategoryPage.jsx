// src/pages/CategoryPage/CategoryPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, NavLink } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";
import { readPrefetchedCategoryFirstPage } from "../../utils/prefetch";
import { prefetchProductDetails } from "../../utils/prefetch";

/* ---------------- helpers ---------------- */

function usePreloadImages(urls = [], count = 2) {
  useEffect(() => {
    if (!urls?.length) return;
    const head = document.head;
    const links = urls.slice(0, count).map((u) => {
      if (!u) return null;
      if ([...head.querySelectorAll('link[rel="preload"][as="image"]')].some(
        (lnk) => lnk.getAttribute("href") === u
      )) return null;
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

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const parseResponse = (res, pageNum) => {
    const data = res?.data ?? res ?? [];
    const arr = Array.isArray(data) ? data : [];
    const currentPage = Number(res?.current_page ?? res?.meta?.current_page ?? pageNum);
    const lastPage = Number(res?.last_page ?? res?.meta?.last_page ?? pageNum);
    return { arr, hasMore: currentPage < lastPage };
  };

  const loadPage = useCallback(async (pageNum) => {
    if (loadingRef.current) return;
    if (!Number.isFinite(catId) || catId <= 0) {
      setErr("Invalid category id.");
      setLoading(false);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    try {
      // small first paint + lite payload
      const qs = new URLSearchParams({
        category_id: String(catId),
        page: String(pageNum),
        per_page: pageNum === 1 ? "12" : "24",
        lite: "1",
      }).toString();

      const res = await fetchJson(`/api/products?${qs}`);
      const { arr, hasMore } = parseResponse(res, pageNum);

      setItems((prev) => (pageNum === 1 ? arr : prev.concat(arr)));
      setHasMore(Boolean(hasMore));
      setErr("");
    } catch (e) {
      setErr(e?.message || "Failed to fetch products.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [catId]);

  // Reset when category changes
  useEffect(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setErr("");
    try { window.scrollTo({ top: 0, behavior: "instant" }); } catch {}

    // If we have prefetched data for this category, paint immediately
    const pref = readPrefetchedCategoryFirstPage(catId);
    if (pref) {
      const data = pref?.data ?? pref ?? [];
      const arr = Array.isArray(data) ? data : [];
      setItems(arr);
      setLoading(false);
      // Revalidate in the background to keep fresh
      setTimeout(() => loadPage(1), 0);
      return;
    }

    loadPage(1);
  }, [catId, loadPage]);

  // Infinite scroll sentinel
  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loadingRef.current) {
        const next = page + 1;
        setPage(next);
        loadPage(next);
      }
    }, { rootMargin: "800px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, page, loadPage]);

  // Preload first few images
  const firstUrls = useMemo(
    () => (items || []).slice(0, 4).map((p) => p.image_url).filter(Boolean),
    [items]
  );
  usePreloadImages(firstUrls, 2);

  const list =
    items.length === 0 && loading
      ? Array.from({ length: 8 }).map((_, i) => ({ skeleton: true, id: `skel-${i}` }))
      : items;

  return (
    <div className="container bb-prod-wrap">
      <div className="bb-prod-head">
        <h1 className="bb-prod-title">Products</h1>
        <span className="bb-prod-count">
          {items.length} {hasMore ? "+" : ""} items
        </span>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bb-prod-grid">
        {list.map((p, idx) => (
          <article key={p.id ?? `skel-${idx}`} className={`bb-card ${p.skeleton ? "skeleton" : ""}`}>
            <div className="bb-imgbox">
              {!p.skeleton ? (
                <SpeedyImage
                  src={p.image_url}
                  srcSet={p.image_srcset}
                  alt={p.name}
                  index={idx}
                />
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

      {!loading && hasMore && (
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
