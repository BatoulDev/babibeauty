import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Home.css";
import CategoryGrid from "../../components/CategoryGrid/CategoryGrid";

// ✅ import About and Contact
import About from "../About/About";
import Contact from "../Contact/Contact";

import slide1 from "../../assets/images/slide2.jpg"; // Bag
import slide2 from "../../assets/images/slide1.jpeg"; // Perfume
import slide3 from "../../assets/images/slide3.jpeg"; // Nail Polish

export default function Home() {
  const [categories] = useState([
    { id: 9, name: "Bags" },
    { id: 5, name: "Bath & Body" },
    { id: 4, name: "Fragrance" },
    { id: 3, name: "Haircare" },
    { id: 1, name: "Makeup" },
    { id: 6, name: "Nails" },
    { id: 2, name: "Skincare" },
    { id: 7, name: "Tools & Accessories" },
  ]);

  return (
    <div className="container-fluid p-0">
      {/* === Category bar === */}
      <nav className="bb-catbar">
        <div className="container">
          <div className="bb-scroll" aria-label="Product categories">
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/category/${cat.id}`}
                className="btn btn-outline-light bb-catpill bb-catlink"
              >
                {cat.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* === Carousel === */}
      <div
        id="homeCarousel"
        className="carousel slide bb-carousel"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        <div className="carousel-inner">
          <div className="carousel-item active">
            <img src={slide1} alt="Handmade Bag" loading="lazy" className="d-block w-100 bb-hero" />
            <div className="carousel-caption bb-cap">
              <h2 className="fw-bold bb-cap-title">Fabiola Handmade Bag</h2>
              <p className="mb-2">Elegance for every day.</p>
              <NavLink to="/shop/bags" className="bb-cap-btn">Shop Bags</NavLink>
            </div>
          </div>

          <div className="carousel-item">
            <img src={slide2} alt="Signature Perfume" loading="lazy" className="d-block w-100 bb-hero" />
            <div className="carousel-caption bb-cap">
              <h2 className="fw-bold bb-cap-title">Signature Perfume</h2>
              <p className="mb-2">Long-lasting, alluring notes.</p>
              <NavLink to="/shop/perfume" className="bb-cap-btn">Shop Perfume</NavLink>
            </div>
          </div>

          <div className="carousel-item">
            <img src={slide3} alt="Burgundy Nail Polish" loading="lazy" className="d-block w-100 bb-hero" />
            <div className="carousel-caption bb-cap">
              <h2 className="fw-bold bb-cap-title">Burgundy Nail Polish</h2>
              <p className="mb-2">Rich color. Perfect finish.</p>
              <NavLink to="/shop/nails" className="bb-cap-btn">Shop Nails</NavLink>
            </div>
          </div>
        </div>

        {/* Controls */}
        <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev" aria-label="Previous slide">
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next" aria-label="Next slide">
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>

        {/* Dots */}
        <div className="carousel-indicators bb-dots">
          <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="0" className="active" aria-current="true" aria-label="Slide 1" />
          <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="1" aria-label="Slide 2" />
          <button type="button" data-bs-target="#homeCarousel" data-bs-slide-to="2" aria-label="Slide 3" />
        </div>
      </div>

      {/* === Category strip just below the carousel === */}
      <CategoryGrid title="Popular Categories" />

      {/* === About Section === */}
      <About />

      {/* === Contact Section === */}
      <Contact />
    </div>
  );
}
