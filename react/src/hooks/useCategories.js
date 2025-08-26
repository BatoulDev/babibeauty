// src/hooks/useCategories.js
import { useEffect, useState } from "react";
import { cached, fetchJson } from "../utils/api";

// Show these immediately so first-time visitors don't wait.
const FALLBACK = [
  { id: 9, name: "Bags" },
  { id: 5, name: "Bath & Body" },
  { id: 4, name: "Fragrance" },
  { id: 3, name: "Haircare" },
  { id: 1, name: "Makeup" },
  { id: 6, name: "Nails" },
  { id: 2, name: "Skincare" },
  { id: 7, name: "Tools & Accessories" },
];

export function useCategories() {
  const [categories, setCategories] = useState(FALLBACK);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;               // avoid setState after unmount/HMR
    setLoading(true);
    setError("");

    cached("categories", () => fetchJson("/api/categories"))
      .then((list) => {
        if (!alive) return;
        const clean = Array.isArray(list)
          ? list.map(({ id, name }) => ({ id, name }))
          : [];
        setCategories(clean.length ? clean : FALLBACK);
      })
      .catch((e) => {
        if (!alive) return;
        setError(e?.message || "Failed to load categories");
        setCategories(FALLBACK);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => { alive = false; };
  }, []);

  return { categories, loading, error };
}
