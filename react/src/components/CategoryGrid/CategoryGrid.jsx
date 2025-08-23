// src/components/CategoryGrid/CategoryGrid.jsx
import React, { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import "./CategoryGrid.css";
import { getCategoryImage } from "./categoryImages";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

// Expected API response (example):
// GET /api/categories -> [{ id:1, name:"Makeup", slug:"makeup" }, ...]
export default function CategoryGrid({ title = "Popular Categories" }) {
  const [cats, setCats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE}/api/categories`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (!isMounted) return;
        // Keep only id + name + slug to be safe
        const cleaned = (Array.isArray(data) ? data : data?.data || []).map(
          (c) => ({ id: c.id, name: c.name, slug: c.slug || String(c.id) })
        );
        setCats(cleaned);
      })
      .catch(() => setErr("Could not load categories."))
      .finally(() => setLoading(false));
    return () => (isMounted = false);
  }, []);

  return (
    <section className="cat-section" aria-label="Shop by Categories">
      <div className="container">
        <p className="cat-eyebrow">Shop by Categories</p>
        <h2 className="cat-title">{title}</h2>

        {loading && (
          <div className="cat-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div className="cat-skeleton" key={i} />
            ))}
          </div>
        )}

        {!loading && err && <p className="cat-error">{err}</p>}

        {!loading && !err && (
          <div className="cat-grid">
            {cats.map((c) => {
              const img = getCategoryImage(c);
              return (
                <NavLink
                  key={c.id}
                  to={`/category/${c.slug}`}
                  className="cat-card"
                  aria-label={`Browse ${c.name}`}
                >
                  <div className="oval">
                    <img src={img.src} alt={img.alt || c.name} loading="lazy" />
                  </div>
                  <div className="cat-name">{c.name}</div>
                </NavLink>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
