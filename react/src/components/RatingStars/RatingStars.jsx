// src/components/RatingStars.jsx
import React from "react";
import "./RatingStars.css";

export default function RatingStars({ value = 0, count = 0 }) {
  const v = Math.max(0, Math.min(5, value || 0));
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;

  return (
    <div className="bb-stars" aria-label={`Rated ${v} out of 5`}>
      {Array.from({ length: full }).map((_, i) => <span key={`f${i}`} className="star full">★</span>)}
      {half ? <span className="star half">★</span> : null}
      {Array.from({ length: empty }).map((_, i) => <span key={`e${i}`} className="star empty">★</span>)}
      <span className="bb-stars-count">{count ? `(${count})` : ""}</span>
    </div>
  );
}
