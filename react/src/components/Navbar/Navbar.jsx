// src/components/Navbar/Navbar.jsx
import { NavLink, Link } from "react-router-dom";
import logo from "../../assets/images/logo.png";
import "./Navbar.css";

export default function Navbar({ isAuthenticated }) {
  const linkCls = ({ isActive }) =>
    "nav-link px-2 px-lg-3" + (isActive ? " active" : "");

  return (
    <nav className="navbar navbar-expand-lg sticky-top border-bottom custom-navbar navbar-dark">
      <div className="container-fluid px-3 px-lg-4">
        {/* Brand */}
        <Link to="/" className="navbar-brand d-flex align-items-center">
          <img
            src={logo}
            alt="Babi Beauty"
            width="60"
            height="40"
            className="me-2"
          />
          <span className="bb-badge bb-wordmark">Babi Beauty</span>
        </Link>

        {/* Toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon" />
        </button>

        <div className="collapse navbar-collapse fs-5" id="mainNavbar">
          {/* Right-side nav */}
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-3">
            <li className="nav-item">
              <NavLink to="/" end className={linkCls}>
                Home
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className={linkCls}>
                About
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/contact" className={linkCls}>
                Contact
              </NavLink>
            </li>

            {/* 🆕 Book Experts */}
            <li className="nav-item">
            <NavLink to="/experts/book" className="btn bb-btn">Book an Expert</NavLink>


            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink to="/dashboard" className={linkCls}>
                    <i className="bi bi-speedometer2 me-1" />
                    Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/logout" className="btn btn-outline-danger btn-sm">
                    <i className="bi bi-box-arrow-right me-1" />
                    Logout
                  </NavLink>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink to="/login" className="btn bb-btn-outline">
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/signup" className="btn bb-btn">
                    Sign Up
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
