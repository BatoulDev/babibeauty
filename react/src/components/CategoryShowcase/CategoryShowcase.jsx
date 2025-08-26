// src/components/CategoryShowcase/CategoryShowcase.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import { useCategories } from "../../hooks/useCategories";
import "./CategoryShowcase.css";

// ✅ Correct imports for your actual files
import imgBags from "../../assets/images/gridbags.jpg";
import imgBath from "../../assets/images/gridbathbody.jpg";
import imgFrag from "../../assets/images/gridfragrance.jpg";
import imgHair from "../../assets/images/gridhaircare.jpg";
import imgMakeup from "../../assets/images/gridmakeup.jpg";
import imgNails from "../../assets/images/gridnails.jpg";
import imgSkin from "../../assets/images/gridskincare.jpg";
import imgTools from "../../assets/images/gridtools.jpg";

// map DB ids -> images
const imageById = {
  9: imgBags,        // Bags
  5: imgBath,        // Bath & Body
  4: imgFrag,        // Fragrance
  3: imgHair,        // Haircare
  1: imgMakeup,      // Makeup
  6: imgNails,       // Nails
  2: imgSkin,        // Skincare
  7: imgTools,       // Tools & Accessories
};

export default function CategoryShowcase() {
  const { categories } = useCategories();

  return (
    <section className="bb-cats">
      <div className="container">
        <p className="bb-cats-eyebrow">Our Categories</p>
        <h3 className="bb-cats-title">
          Shop By <span>Category</span>
        </h3>

       <div className="bb-cats-row">
          {categories.map((c) => {
            const img = imageById[c.id] || null;
            return (
              <NavLink
                key={c.id}
                to={`/category/${c.id}`}
                className="bb-cat-card"
                aria-label={`Browse ${c.name}`}
              >
                <div className="bb-cat-oval">
                  {img ? (
                    <img src={img} alt={c.name} loading="lazy" />
                  ) : (
                    <div className="bb-cat-oval-fallback" aria-hidden="true" />
                  )}
                </div>
                <div className="bb-cat-name">{c.name}</div>
              </NavLink>
            );
          })}
        </div>
      </div>
    </section>
  );
}
