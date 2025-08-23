// src/components/CategoryGrid/categoryImages.js

// Import any images you already have. Replace with your real files.
import makeup from "../../assets/images/about1.jpg";
import skincare from "../../assets/images/about1.jpg";
import fragrance from "../../assets/images/about1.jpg";
import nails from "../../assets/images/about1.jpg";
import placeholder from "../../assets/images/about1.jpg";

// Map by *normalized name* or by ID if you prefer.
const byName = {
  makeup: { src: makeup, alt: "Makeup" },
  "skin care": { src: skincare, alt: "Skin Care" },
  skincare: { src: skincare, alt: "Skin Care" },
  fragrance: { src: fragrance, alt: "Fragrance" },
  nails: { src: nails, alt: "Nails" },
};

// If you want to map by database ID too, add here:
// const byId = { 1: { src: makeup, alt: "Makeup" }, ... };
const byId = {};

export function getCategoryImage(cat) {
  const nameKey = String(cat.name || "")
    .trim()
    .toLowerCase();
  return byId[cat.id] || byName[nameKey] || { src: placeholder, alt: cat.name };
}
