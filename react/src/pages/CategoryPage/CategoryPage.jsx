// src/pages/CategoryPage/CategoryPage.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useParams, NavLink } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";
import {
  prefetchCategoryFirstPage,
  prefetchProductDetails,
  prefetchImages,
} from "../../utils/prefetch";

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
      if (
        [...head.querySelectorAll('link[rel="preload"][as="image"]')].some(
          (lnk) => lnk.getAttribute("href") === u
        )
      )
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
  const { id } = useParams(); // /category/:id (must be numeric for this page)
  const catId = Number(id);
  const validCat = Number.isFinite(catId) && catId > 0;

  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [firstFetchDone, setFirstFetchDone] = useState(false);

  const loadingRef = useRef(false);
  const sentinelRef = useRef(null);
  const controllerRef = useRef(null);

  // Normalize API responses into { arr, hasMore }
  const parseResponse = (res, pageNum) => {
    // Accept:
    // A) { data: [...], current_page, last_page }
    // B) { data: { data: [...], current_page, last_page } }
    // C) [...]
    const inner =
      Array.isArray(res)
        ? { data: res }
        : Array.isArray(res?.data)
        ? res
        : (res?.data && typeof res.data === "object")
        ? res.data
        : res || {};

    const arr = Array.isArray(inner?.data)
      ? inner.data
      : Array.isArray(inner)
      ? inner
      : [];

    const currentPage = Number(
      inner?.current_page ?? res?.current_page ?? res?.meta?.current_page ?? pageNum
    );
    const lastPage = Number(
      inner?.last_page ?? res?.last_page ?? res?.meta?.last_page ?? pageNum
    );
    return { arr, hasMore: currentPage < lastPage };
  };

  // Fetch products
  const loadPage = useCallback(
    async (pageNum, { silent = false } = {}) => {
      if (loadingRef.current) return;
      if (!validCat) return; // <- do nothing until catId is valid

      // cancel previous request
      if (controllerRef.current) controllerRef.current.abort("newer-request");
      const ctrl = new AbortController();
      controllerRef.current = ctrl;

      loadingRef.current = true;
      if (!silent) setLoading(true);

      let wasAborted = false;

      try {
        const qs = new URLSearchParams({
          category_id: String(catId),
          page: String(pageNum),
          per_page: "12",
          lite: "1",
        }).toString();

        const res = await fetchJson(`/api/products?${qs}`, {
          signal: ctrl.signal,
        });

        const { arr, hasMore } = parseResponse(res, pageNum);

        setItems((prev) => (pageNum === 1 ? arr : prev.concat(arr)));
        setHasMore(Boolean(hasMore));
        setErr("");

        prefetchImages(arr);
      } catch (e) {
        if (isAbortError(e)) {
          wasAborted = true;
        } else {
          setErr(e?.message || "Failed to fetch products.");
        }
      } finally {
        loadingRef.current = false;
        if (!wasAborted) {
          if (pageNum === 1) setFirstFetchDone(true);
          if (!silent) setLoading(false);
        }
      }
    },
    [catId, validCat]
  );

  /* ---------- Reset when category changes ---------- */
  useEffect(() => {
    // abort any in-flight request
    if (controllerRef.current) controllerRef.current.abort("category-change");

    // If catId is invalid (first render), keep skeletons & wait
    if (!validCat) {
      setItems([]);
      setPage(1);
      setHasMore(true);
      setErr("");
      setFirstFetchDone(false);
      setLoading(true);
      return;
    }

    // Valid category: hard reset and then fetch
    setItems([]);
    setPage(1);
    setHasMore(true);
    setErr("");
    setFirstFetchDone(false);
    setLoading(true);
  }, [validCat, catId]);

  /* ---------- Initial load: only run when catId is valid ---------- */
  useEffect(() => {
    if (!validCat) return;

    let canceled = false;

    async function init() {
      // fire-and-forget prefetch (no flag flips)
      prefetchCategoryFirstPage(catId)
        .then((pref) => {
          if (canceled) return;
          const { arr } = parseResponse(pref, 1);
          if (Array.isArray(arr) && arr.length) {
            setItems((prev) => (prev.length ? prev : arr));
            prefetchImages(arr);
          }
        })
        .catch(() => {});

      await loadPage(1, { silent: false });
    }

    init();

    return () => {
      canceled = true;
      if (controllerRef.current) controllerRef.current.abort("unmount");
    };
  }, [validCat, catId, loadPage]);

  // Infinite scroll
  useEffect(() => {
    if (!validCat || !hasMore) return;
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
  }, [validCat, hasMore, page, loadPage, catId]);

  // Preload first few images aggressively
  const firstUrls = useMemo(
    () =>
      (items || [])
        .slice(0, 4)
        .map((p) => p.image_url)
        .filter(Boolean),
    [items]
  );
  usePreloadImages(firstUrls, 3);

  // Skeletons: keep showing until we have a valid catId AND first successful load
  const showingSkeletons =
    (!validCat) || (items.length === 0 && (loading || !firstFetchDone));

  const list = showingSkeletons
    ? Array.from({ length: 8 }).map((_, i) => ({
        skeleton: true,
        id: `skel-${i}`,
      }))
    : items;

  // Count label
  const countLabel = !firstFetchDone
    ? "…"
    : `${items.length}${items.length > 0 && hasMore ? " +" : ""} items`;

  return (
    <div className="container bb-prod-wrap" key={validCat ? catId : "pending"}>
      <div className="bb-prod-head">
        <h1 className="bb-prod-title">Products</h1>
        <span className="bb-prod-count">{countLabel}</span>
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bb-prod-grid">
        {list.map((p, idx) => (
          <article
            key={p.id ?? `skel-${idx}`}
            className={`bb-card ${p.skeleton ? "skeleton" : ""}`}
          >
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
              {!p.skeleton && (
                <RatingStars
                  value={p.rating ?? 0}
                  count={p.reviews_count ?? 0}
                />
              )}
              <div className="bb-price">
                {p.skeleton ? "\u00A0" : `$${Number(p.price ?? 0).toFixed(2)}`}
              </div>
              {!p.skeleton && (
                <NavLink
                  to={`/product/${p.id}`}
                  state={{
                    pre: {
                      id: p.id,
                      name: p.name,
                      price: p.price,
                      image_url: p.image_url,
                    },
                  }}
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
