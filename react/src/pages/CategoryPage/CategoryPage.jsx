// src/pages/CategoryPage/CategoryPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchJson } from "../../utils/api";
// ⬇️ match your actual folder name (lowercase "ratingstars")
import RatingStars from "../../components/RatingStars/RatingStars";
import "./CategoryPage.css";

export default function CategoryPage() {
  const { id } = useParams();                // category id from URL
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;                         // prevent setState after unmount/HMR
    setLoading(true);
    setErr("");

    fetchJson("/api/products", { params: { category_id: id } })
      .then((list) => { if (alive) setItems(Array.isArray(list) ? list : []); })
      .catch((e) => { if (alive) setErr(e?.message || "Failed to fetch"); })
      .finally(() => { if (alive) setLoading(false); });

    return () => { alive = false; };
  }, [id]);

  const list = loading
    ? Array.from({ length: 8 }).map((_, i) => ({ skeleton: true, id: `skel-${i}` }))
    : items;

  return (
    <div className="container bb-prod-wrap">
      <h1 className="bb-prod-title">Products</h1>
      {err && <div className="alert alert-danger">{err}</div>}

      <div className="bb-prod-grid">
        {list.map((p, idx) => (
          <article key={p.id} className={`bb-card ${p.skeleton ? "skeleton" : ""}`}>
            <div className="bb-imgbox">
              {!p.skeleton ? (
                <img
                  src={p.image_url}
                  alt={p.name}
                  decoding="async"
                  loading={idx < 6 ? "eager" : "lazy"}     // eager for first row
                fetchPriority={idx === 0 ? "high" : "auto"}

                  onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                />
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
              <button className="bb-btn">See Details</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
