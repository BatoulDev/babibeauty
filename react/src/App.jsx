// src/App.jsx
import React, { useEffect, useState } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

import Home from './pages/Home/Home';
import Contact from './pages/Contact/Contact';
import About from './pages/About/About';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import NotFound from './pages/NotFound/NotFound';
import CategoryPage from "./pages/CategoryPage/CategoryPage";

// Logout page that signs out then redirects
function Logout({ onLogout }) {
  const navigate = useNavigate();
  useEffect(() => {
    Promise.resolve(onLogout?.()).finally(() => {
      navigate('/login', { replace: true });
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const location = useLocation();

  // Hide header/footer on auth screens
  const hideHeaderFooter = ['/login', '/signup'].includes(location.pathname);

  const handleLogout = async () => {
    setIsAuthenticated(false);
  };

  return (
    <>
      {!hideHeaderFooter && <Navbar isAuthenticated={isAuthenticated} />}

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/logout" element={<Logout onLogout={handleLogout} />} />
         <Route path="/category/:id" element={<CategoryPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!hideHeaderFooter && <Footer />}
    </>
  );
}
