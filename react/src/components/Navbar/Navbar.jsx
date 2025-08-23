import { NavLink, Link } from 'react-router-dom';
import logo from '../../assets/images/logo.png';
import "./Navbar.css";

export default function Navbar({ isAuthenticated }) {
  const linkCls = ({ isActive }) =>
    'nav-link px-2 px-lg-3' + (isActive ? ' active' : '');

  return (
   <nav className="navbar navbar-expand-lg sticky-top border-bottom custom-navbar navbar-dark">

      {/* container-fluid pushes brand to the very left edge */}
      {/* Tip: set px-0 if you want it 100% flush with the viewport */}
      <div className="container-fluid px-3 px-lg-4">
        {/* Brand */}
        <Link className="navbar-brand d-flex align-items-center" to="/">
          <img src={logo} alt="Babi Beauty" width="60" height="40" className="me-2" />
        <Link className="navbar-brand d-flex align-items-center" to="/">
  <span className="bb-badge bb-wordmark">Babi Beauty</span>
</Link>

        </Link>

        {/* Toggler (visible on dark bg because of navbar-dark) */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#mainNavbar"
          aria-controls="mainNavbar"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse fs-5" id="mainNavbar">
          {/* Right side links with spacing */}
          <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-3">
            <li className="nav-item">
              <NavLink to="/" end className={linkCls}>Home</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/about" className={linkCls}>About</NavLink>
            </li>
            <li className="nav-item">
              <NavLink to="/contact" className={linkCls}>Contact</NavLink>
            </li>

            {isAuthenticated ? (
              <>
                <li className="nav-item">
                  <NavLink to="/dashboard" className={linkCls}>
                    <i className="bi bi-speedometer2 me-1"></i>Dashboard
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink to="/logout" className="btn btn-outline-danger btn-sm">
                    <i className="bi bi-box-arrow-right me-1"></i>Logout
                  </NavLink>
                </li>
              </>
            ) : (
              <>
              <ul className="navbar-nav ms-auto align-items-lg-center gap-2 gap-lg-3">
  {/* ...other links... */}

  {/* Outline login (brand border, fills on hover) */}
  <li className="nav-item">
    <NavLink to="/login" className="btn bb-btn-outline">
      Login
    </NavLink>
  </li>

  {/* Solid sign up */}
  <li className="nav-item">
    <NavLink to="/signup" className="btn bb-btn">
      Sign Up
    </NavLink>
  </li>
</ul>

              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
