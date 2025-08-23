import React from "react";
import "./About.css";
import about1 from "../../assets/images/about1.jpg";
import about2 from "../../assets/images/about2.jpg";


export default function About() {
  return (
    <main className="about">
      {/* ===== Hero ===== */}
      <section className="about-hero">
        <div className="container">
          <h1 className="about-title">
            About <span className="accent">Babi Beauty</span>
          </h1>
          <p className="about-sub">
            Timeless beauty, crafted with care. We blend quality products with a
            warm customer experience—rooted in authenticity.
          </p>
        </div>
        <div className="watermark">STORY</div>
      </section>

      {/* ===== Why Us (text with side images) ===== */}
      <section className="why">
        <div className="container grid-2">
          <figure className="frame left">
            {/* replace src with your image */}
           <img src={about1} alt="Glow details" />

          </figure>

          <div className="why-copy">
            <p className="eyebrow">Why us?</p>
            <h2>Comfort, character, and care.</h2>
            <p>
              At <strong>Babi Beauty</strong>, we believe in everyday luxury.
              Our collections are curated to be gentle on skin, bold on style,
              and fair on price. We guide you with honest tips—not hype—so you
              can choose what truly fits you.
            </p>
            <p>
              From smooth browsing to thoughtful packaging and support, every
              step is designed to feel effortless. Your routine, elevated—with a
              touch of burgundy elegance.
            </p>
          </div>

          <figure className="frame right">
            {/* replace src with your image */}
         <img src={about2} alt="Glow details" />

          </figure>
        </div>
      </section>

      {/* ===== Values ===== */}
      <section className="values">
        <div className="container cards">
          <article className="card">
            <h3>Authentic</h3>
            <p>
              Ingredients and claims you can trust. We say what we mean, always.
            </p>
          </article>
          <article className="card">
            <h3>Comfort-first</h3>
            <p>
              Formulas that feel good and wear beautifully from day to night.
            </p>
          </article>
          <article className="card">
            <h3>Community</h3>
            <p>
              We listen, learn, and build with you—feedback shapes our roadmap.
            </p>
          </article>
          <article className="card">
            <h3>Care</h3>
            <p>
              Friendly support, fast help, and packaging that loves your shelf.
            </p>
          </article>
        </div>
      </section>

      {/* ===== Stats / ribbon ===== */}
      <section className="ribbon">
        <div className="container ribbon-grid">
          <div className="stat">
            <span className="num">10k+</span>
            <span className="label">Happy customers</span>
          </div>
          <div className="stat">
            <span className="num">98%</span>
            <span className="label">Satisfaction</span>
          </div>
          <div className="stat">
            <span className="num">48h</span>
            <span className="label">Avg. delivery</span>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta">
        <div className="container cta-wrap">
          <h3>Ready to glow?</h3>
          <p>Explore the collection and find your new everyday favorites.</p>
          <a className="btn-primary" href="/shop">Visit shop</a>
        </div>
      </section>
    </main>
  );
}
