// src/pages/ProductDetails/ProductDetails.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams, NavLink, useNavigate } from "react-router-dom";
import { fetchJson } from "../../utils/api";
import RatingStars from "../../components/RatingStars/RatingStars";
import "./ProductDetails.css";

function SpeedyImage({ src, srcSet, alt }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      className={loaded ? "pd-img is-loaded" : "pd-img"}
      alt={alt || ""}
      width={900}
      height={1100}
      decoding="async"
      loading="eager"
      fetchPriority="high"
      src={src}
      srcSet={srcSet || undefined}
      onLoad={() => setLoaded(true)}
      onError={(e) => { e.currentTarget.src = "/placeholder.png"; setLoaded(true); }}
    />
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    fetchJson(`/api/products/${id}`)
      .then((res) => { if (alive) setData(res); })
      .catch((e) => { if (alive) setErr(e?.message || "Failed to load product"); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id]);

  if (loading) {
    return <div className="pd-container"><div className="pd-skel" /></div>;
  }
  if (err) {
    return <div className="pd-container"><div className="pd-error">{err}</div></div>;
  }
  if (!data) return null;

  const {
    name, description, price, image_url, image_srcset,
    brand, category, rating, reviews_count, reviews = []
  } = data;

  return (
    <div className="pd-container">
      <nav className="pd-breadcrumbs">
        <button className="pd-link" onClick={() => navigate(-1)}>← Back</button>
        
      </nav>

      <div className="pd-grid">
        <div className="pd-media">
          <SpeedyImage src={image_url} srcSet={image_srcset} alt={name} />
        </div>

        <div className="pd-info">
          <h1 className="pd-title">{name}</h1>

          <div className="pd-meta">
            {brand && <span className="pd-chip">Brand: {brand}</span>}
            {category && <span className="pd-chip">Category: {category}</span>}
          </div>

          <div className="pd-rating">
            <RatingStars value={rating ?? 0} count={reviews_count ?? 0} />
            {reviews_count ? <span className="pd-rcount">({reviews_count})</span> : null}
          </div>

          <div className="pd-price">${Number(price || 0).toFixed(2)}</div>

          <p className="pd-desc">{description || "No description available."}</p>

          <div className="pd-actions">
            <button className="pd-btn pd-primary">Purchase</button>
            <button className="pd-btn pd-ghost" onClick={() => navigate(-1)}>Continue Shopping</button>
          </div>
        </div>
      </div>

      <section className="pd-reviews">
        <div className="pd-rev-head">
          <h2>Customer Reviews</h2>
          <div className="pd-rev-score">
            <span className="pd-score-num">{(rating ?? 0).toFixed(1)}</span>
            <span className="pd-score-text">out of 5</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="pd-empty">No reviews yet.</p>
        ) : (
          <ul className="pd-rev-list">
            {reviews.map((r) => (
              <li key={r.id} className="pd-rev-item">
                <div className="pd-rev-row">
                  <div className="pd-rev-user">{r.user}</div>
                  <div className="pd-rev-stars"><RatingStars value={r.rating} /></div>
                </div>
                <p className="pd-rev-comment">{r.comment}</p>
                {r.created_at && <div className="pd-rev-date">{new Date(r.created_at).toLocaleDateString()}</div>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
