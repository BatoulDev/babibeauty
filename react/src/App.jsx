// src/App.jsx
import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";

import Navbar from "./components/Navbar/Navbar";
import Footer from "./components/Footer/Footer";

import Home from "./pages/Home/Home";
import Contact from "./pages/Contact/Contact";
import About from "./pages/About/About";
import Login from "./pages/Login/Login";
import Signup from "./pages/Signup/Signup";
import NotFound from "./pages/NotFound/NotFound";
import CategoryPage from "./pages/CategoryPage/CategoryPage";
import ProductDetails from "./pages/ProductDetails/ProductDetails";
import BookExpert from "./pages/BookExpert/BookExpert";
import Cart from "./pages/Cart/Cart";
import Checkout from "./pages/Checkout/Checkout";

import { installCategoryHoverPrefetch } from "./utils/prefetch";

const TOKEN_KEY = "auth_token";

// Helpers
function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Guarded route wrapper (redirects to /login if not logged in)
function RequireAuth({ children }) {
  const token = getToken();
  const location = useLocation();
  if (!token) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }
  return children;
}

// Logout page
function Logout({ onLogout }) {
  const navigate = useNavigate();
  useEffect(() => {
    Promise.resolve(onLogout?.()).finally(() => {
      navigate("/login", { replace: true });
    });
  }, [onLogout, navigate]);

  return (
    <div className="container py-5 text-center">
      <div className="spinner-border" role="status" aria-hidden="true" />
      <p className="mt-3 text-muted">Signing you out…</p>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getToken());
  const location = useLocation();

  // Hide header/footer on login/signup screens
  const hideHeaderFooter = ["/login", "/signup"].includes(location.pathname);

  // Keep auth state in sync with token changes
  useEffect(() => {
    const sync = () => setIsAuthenticated(!!getToken());
    sync(); // run on mount + route change

    // Listen for cross-tab/localStorage changes
    const onStorage = (e) => {
      if (e.key === TOKEN_KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    // Listen for custom events after login/logout
    const onAuthChange = () => sync();
    window.addEventListener("auth:changed", onAuthChange);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("auth:changed", onAuthChange);
    };
  }, [location.pathname]);

  // Logout handler
  const handleLogout = async () => {
    try {
      localStorage.removeItem("auth_user");
      localStorage.removeItem(TOKEN_KEY);
      if (typeof window.__setAuthToken === "function") {
        window.__setAuthToken(null);
      }
      // Notify listeners
      window.dispatchEvent(new Event("auth:changed"));
    } finally {
      setIsAuthenticated(false);
    }
  };

  return (
    <>
      {!hideHeaderFooter && <Navbar isAuthenticated={isAuthenticated} />}

      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/logout" element={<Logout onLogout={handleLogout} />} />

          {/* Shop & product routes */}
          <Route path="/category/:id" element={<CategoryPage />} />
          <Route path="/product/:id" element={<ProductDetails />} />

          {/* Protected routes (only when logged in) */}
          <Route
            path="/experts/book"
            element={
              <RequireAuth>
                <BookExpert />
              </RequireAuth>
            }
          />
          <Route
            path="/cart"
            element={
              <RequireAuth>
                <Cart />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout"
            element={
              <RequireAuth>
                <Checkout />
              </RequireAuth>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
    </>
  );
}
