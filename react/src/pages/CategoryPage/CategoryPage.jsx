// src/pages/CategoryPage/CategoryPage.jsx
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useParams, NavLink } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";

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
  const { id } = useParams();                 // /category/:id
  const catId = Number(id) || "";             // normalize (avoid "undefined")
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);

  const loadPage = useCallback(async (pageNum) => {
    if (loadingRef.current || !catId) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      // 🔑 Build query string explicitly (don’t rely on fetchJson params)
      const qs = new URLSearchParams({
        category_id: String(catId),
        page: String(pageNum),
        per_page: "24",
      }).toString();

      const res = await fetchJson(`/api/products?${qs}`);

      // Support both paginated and raw arrays
      const data = res?.data ?? res?.items ?? res ?? [];
      const arr = Array.isArray(data) ? data : [];

      setItems((prev) => (pageNum === 1 ? arr : prev.concat(arr)));

      // Determine pagination
      const lastPage =
        res?.last_page ??
        res?.meta?.last_page ??
        (res?.links ? (res?.links?.next ? pageNum + 1 : pageNum) : pageNum);

      setHasMore(pageNum < Number(lastPage));
    } catch (e) {
      setErr(e?.message || "Failed to fetch");
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
    window.scrollTo({ top: 0, behavior: "instant" });
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
              <button className="bb-btn" disabled={p.skeleton}>
                <NavLink to={`/product/${p.id}`} className="bb-btn-link">See Details</NavLink>
              </button>
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
