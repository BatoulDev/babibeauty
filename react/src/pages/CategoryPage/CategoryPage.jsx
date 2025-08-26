// src/pages/CategoryPage/CategoryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";

/* ----------------------------- helpers ----------------------------- */

/** Preload the first N images so the browser starts fetching immediately */
function usePreloadImages(urls = [], count = 8) {
  useEffect(() => {
    if (!urls?.length) return;
    const head = document.head;
    const links = urls.slice(0, count).map((u) => {
      // avoid duplicate preloads for same URL
      if (
        [...head.querySelectorAll('link[rel="preload"][as="image"]')].some(
          (lnk) => lnk.getAttribute("href") === u
        )
      ) {
        return null;
      }
      const l = document.createElement("link");
      l.rel = "preload";
      l.as = "image";
      l.href = u;
      head.appendChild(l);
      return l;
    });
    return () => {
      links.forEach((l) => l && head.removeChild(l));
    };
  }, [urls, count]);
}

/** Fast image: always sets src (so it queues ASAP), but:
 *  - first 4 are eager + high priority (top row)
 *  - others are lazy so below-the-fold doesn’t compete
 */
function SpeedyImage({ src, alt, index }) {
  const [loaded, setLoaded] = useState(false);

  const eager = index < 4; // top row
  return (
    <img
      // your CSS (.bb-imgbox img) controls the visual size; this class is harmless
      className={loaded ? "bb-img is-loaded" : "bb-img"}
      alt={alt}
      // intrinsic hints (don’t change display size)
      width={800}
      height={1000}
      decoding="async"
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      // IMPORTANT: set src immediately so the browser queues the request now
      src={src}
      onLoad={() => setLoaded(true)}
      onError={(e) => {
        e.currentTarget.src = "/placeholder.png";
        setLoaded(true);
      }}
    />
  );
}

/* ----------------------------- page ----------------------------- */

export default function CategoryPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");

    fetchJson("/api/products", { params: { category_id: id } })
      .then((list) => {
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        if (!alive) return;
        setErr(e?.message || "Failed to fetch");
      })
      .finally(() => alive && setLoading(false));

    return () => {
      alive = false;
    };
  }, [id]);

  // skeleton placeholders while loading
  const list = loading
    ? Array.from({ length: 8 }).map((_, i) => ({ skeleton: true, id: `skel-${i}` }))
    : items;

  // Preload first 8 images right after data arrives (faster first paint)
  const firstUrls = useMemo(
    () => (items || []).slice(0, 8).map((p) => p.image_url).filter(Boolean),
    [items]
  );
  usePreloadImages(firstUrls, 8);

  return (
    <div className="container bb-prod-wrap">
      <div className="bb-prod-head">
        <h1 className="bb-prod-title">Products</h1>
        {!loading && (
          <span className="bb-prod-count">({items?.length ?? 0})</span>
        )}
      </div>

      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bb-prod-grid">
        {list.map((p, idx) => (
          <article key={p.id} className={`bb-card ${p.skeleton ? "skeleton" : ""}`}>
            <div className="bb-imgbox">
              {!p.skeleton ? (
                <SpeedyImage src={p.image_url} alt={p.name} index={idx} />
              ) : (
                <div className="bb-img-skel" />
              )}
            </div>

            <div className="bb-card-body">
              <h3 className="bb-name">{p.skeleton ? "\u00A0" : p.name}</h3>

              {!p.skeleton && (
                <RatingStars value={p.rating ?? 0} count={p.reviews_count ?? 0} />
              )}

              <div className="bb-price">
                {p.skeleton ? "\u00A0" : `$${Number(p.price ?? 0).toFixed(2)}`}
              </div>

              <button className="bb-btn" disabled={p.skeleton}>
                See Details
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
