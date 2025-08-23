import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';

export default function Footer() {
  return (
    <footer className="footer border-top fixed-bottom shadow-sm" role="contentinfo">
      <div className="container py-3" style={{ minHeight: 64 }}>
        <div className="row align-items-center g-3">

          {/* Left: Brand + Social */}
          <div className="col-12 col-md-6 d-flex flex-column flex-md-row align-items-center justify-content-between justify-content-md-start">
            <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none">
              <img src={logo} alt="Babi Beauty" width="28" height="28" className="rounded-circle" />
              <span className="fw-semibold">Babi Beauty</span>
            </Link>

            <div className="d-flex gap-3 mt-2 mt-md-0 ms-md-3">
              <a href="#" aria-label="Instagram"><i className="bi bi-instagram fs-5" /></a>
              <a href="#" aria-label="TikTok"><i className="bi bi-tiktok fs-5" /></a>
              <a href="#" aria-label="Facebook"><i className="bi bi-facebook fs-5" /></a>
            </div>
          </div>

          {/* Right: Get in touch (right-aligned on md+) */}
         <div className="col-12 col-md-6 text-md-center">

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

        {/* Bottom row */}
        <div className="border-top mt-3 pt-2">
          <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center small">
            <span>© {new Date().getFullYear()} Babi Beauty</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
