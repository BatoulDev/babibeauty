// src/components/Footer.jsx
import React from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "./Footer.css";


export default function Footer() {
  return (
    <footer className="bb-footer border-top" role="contentinfo">
      <div className="container py-3 py-lg-4">
        <div className="row gy-3 align-items-center">
          {/* Left: Brand */}
          <div className="col-12 col-lg-4 text-center text-lg-start">
            <Link
              to="/"
              className="d-inline-flex align-items-center gap-2 text-decoration-none"
            >
              <img
                src={logo}
                alt="Babi Beauty"
                width="28"
                height="28"
                className="rounded-circle"
              />
              <span className="fw-semibold">Babi Beauty</span>
            </Link>
          </div>

          {/* Middle: Social */}
          <div className="col-12 col-lg-4 text-center">
            <div className="d-inline-flex align-items-center gap-3">
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram fs-5" /></a>
              <a href="#" aria-label="TikTok"><i className="bi bi-tiktok fs-5" /></a>
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook fs-5" /></a>
            </div>
          </div>

          {/* Right: Contact */}
          <div className="col-12 col-lg-4 text-center text-lg-end">
            <h6 className="mb-1">Get in touch</h6>
            <ul className="list-unstyled mt-2 mb-0 small">
              <li className="mb-1">
                <i className="bi bi-envelope me-2" />
                <a href="mailto:support@babibeauty.local" className="text-decoration-none">
                  support@babibeauty.local
                </a>
              </li>
              <li className="mb-1">
                <i className="bi bi-telephone me-2" />
                <a href="tel:+96100000000" className="text-decoration-none">
                  +961 00 000 000
                </a>
              </li>
              <li className="mb-0">
                <i className="bi bi-geo-alt me-2" />
                Beirut, Lebanon
              </li>
            </ul>
          </div>
        </div>

        <hr className="opacity-50 my-3" />

        <div className="text-center small opacity-75">
          © {new Date().getFullYear()} Babi Beauty
        </div>
      </div>
    </footer>
  );
}
