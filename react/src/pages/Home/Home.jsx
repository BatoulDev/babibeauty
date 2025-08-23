// src/pages/Home.jsx
import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';

import slide1 from '../../assets/images/slide2.jpg';   // Bag
import slide2 from '../../assets/images/slide1.jpeg';  // Perfume
import slide3 from '../../assets/images/slide3.jpeg';  // Nail Polish

export default function Home() {
  const [categories] = useState([
    { id: 9, name: 'Bags' },
    { id: 5, name: 'Bath & Body' },
    { id: 4, name: 'Fragrance' },
    { id: 3, name: 'Haircare' },
    { id: 1, name: 'Makeup' },
    { id: 6, name: 'Nails' },
    { id: 2, name: 'Skincare' },
    { id: 7, name: 'Tools & Accessories' },
  ]);

  return (
    <div className="container-fluid p-0">
      {/* Category bar */}
      <nav className="bb-catbar">
        <div className="container">
          <div className="bb-catbar-track d-flex justify-content-center flex-wrap gap-2 py-2">
            {categories.map((cat) => (
              <NavLink
                key={cat.id}
                to={`/category/${cat.id}`}
                className="btn btn-outline-light btn-sm rounded-pill px-3 py-2 bb-catpill"
              >
                {cat.name}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Carousel */}
      <div
        id="homeCarousel"
        className="carousel slide bb-carousel"
        data-bs-ride="carousel"
        data-bs-interval="5000"
      >
        <div className="carousel-inner">
          {/* ITEM 1: BAG */}
          <div className="carousel-item active">
            <img src={slide1} alt="Handmade Bag" loading="lazy" className="d-block w-100" />
            <div className="carousel-caption bb-cap d-none d-md-block">
              <h2 className="fw-bold">Fabiola Handmade Bag</h2>
              <p>Elegance for every day.</p>
              <a href="/shop/bags" className="btn btn-light btn-sm">Shop Bags</a>
            </div>
          </div>

          {/* ITEM 2: PERFUME */}
          <div className="carousel-item">
            <img src={slide2} alt="Signature Perfume" loading="lazy" className="d-block w-100" />
            <div className="carousel-caption bb-cap d-none d-md-block">
              <h2 className="fw-bold">Signature Perfume</h2>
              <p>Long-lasting, alluring notes.</p>
              <a href="/shop/perfume" className="btn btn-light btn-sm">Shop Perfume</a>
            </div>
          </div>

          {/* ITEM 3: NAIL POLISH */}
          <div className="carousel-item">
            <img src={slide3} alt="Burgundy Nail Polish" loading="lazy" className="d-block w-100" />
            <div className="carousel-caption bb-cap d-none d-md-block">
              <h2 className="fw-bold">Burgundy Nail Polish</h2>
              <p>Rich color. Perfect finish.</p>
              <a href="/shop/nails" className="btn btn-light btn-sm">Shop Nails</a>
            </div>
          </div>
        </div>

        <button className="carousel-control-prev" type="button" data-bs-target="#homeCarousel" data-bs-slide="prev" aria-label="Previous slide">
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="visually-hidden">Previous</span>
        </button>
        <button className="carousel-control-next" type="button" data-bs-target="#homeCarousel" data-bs-slide="next" aria-label="Next slide">
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="visually-hidden">Next</span>
        </button>
      </div>
    </div>
  );
}
