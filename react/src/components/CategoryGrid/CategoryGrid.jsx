import React from "react";
import { NavLink } from "react-router-dom";
import "./CategoryGrid.css";

/**
 * props:
 *  - title?: string
 *  - categories: Array<{ id:number|string, name:string, image?:string }>
 *      image should be an imported asset (e.g., import bags from ".../bags.jpg")
 *      or an absolute/relative URL.
 */
export default function CategoryGrid({ title = "Popular Categories", categories = [] }) {
  return (
    <section className="cat-section">
      <div className="container">
        <p className="cat-eyebrow">Shop by Categories</p>
        <h2 className="cat-title">{title}</h2>

        <div className="cat-grid">
          {categories.map((c) => (
            <NavLink
              key={c.id}
              to={`/category/${c.id}`}
              className="cat-card"
              aria-label={`Browse ${c.name}`}
            >
              <div className="oval">
                {c.image ? (
                  <img src={c.image} alt={c.name} />
                ) : (
                  <div className="placeholder">{c.name}</div>
                )}
              </div>
              <div className="cat-name">{c.name}</div>
            </NavLink>
          ))}
        </div>
      </div>
    </section>
  );
}
