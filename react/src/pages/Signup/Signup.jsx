// src/pages/Signup.jsx
import React, { useRef, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";
import glitter from "../../assets/images/car.jpeg"; // background

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";
const REGISTER_ENDPOINT = "/api/auth/register";              // ✅ correct endpoint
const GOOGLE_REDIRECT   = "/auth/google/redirect";

const ADMIN_EMAIL = "admin@babibeauty.test";
const ADMIN_PASS  = "Admin@12345";

export default function Signup() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState({});
  const [msg, setMsg]           = useState("");

  const burgundy = "#561C24";
  const lighter  = "#6f2730";
  const blush    = "#F8EDEE";
  const textOnB  = "#FFFFFF";

  // Refs for tooltips
  const nameRef     = useRef(null);
  const emailRef    = useRef(null);
  const passRef     = useRef(null);
  const cpassRef    = useRef(null);
  const submitRef   = useRef(null);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: null }));
  };

  // Bootstrap tooltip helper (works if Bootstrap bundle is loaded globally)
  const showTip = (ref, text) => {
    if (!ref?.current || !window?.bootstrap) return;
    ref.current.setAttribute("data-bs-toggle", "tooltip");
    ref.current.setAttribute("data-bs-placement", "top");
    ref.current.setAttribute("data-bs-title", text);
    const tip = new window.bootstrap.Tooltip(ref.current, { trigger: "manual" });
    tip.show();
    setTimeout(() => { try { tip.hide(); tip.dispose(); } catch {} }, 2200);
  };

  // Client-side validation for UX (backend still validates)
  const clientValidate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your full name.";
    if (!form.email.trim()) e.email = "Please enter your email address.";
    if (!form.password) e.password = "Please enter a password.";
    if (!form.password_confirmation) e.password_confirmation = "Please confirm your password.";
    if (form.password && form.password.length < 8) e.password = "Password must be at least 8 characters.";
    if (form.password && form.password_confirmation && form.password !== form.password_confirmation) {
      e.password_confirmation = "Passwords don’t match.";
    }
    setErrors(e);

    // Tooltips on first submit when empty/invalid
    if (e.name) showTip(nameRef, e.name);
    else if (e.email) showTip(emailRef, e.email);
    else if (e.password) showTip(passRef, e.password);
    else if (e.password_confirmation) showTip(cpassRef, e.password_confirmation);

    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    setMsg("");
    if (!clientValidate()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${REGISTER_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        credentials: "include",
        body: JSON.stringify(form),
      });

      const isJson = res.headers.get("content-type")?.includes("application/json");
      const data = isJson ? await res.json() : null;

      if (!res.ok) {
        if (res.status === 422 && data?.errors) {
          setErrors(data.errors);
          // Optional: nudge with a tooltip on the first field that has a backend error
          if (data.errors.name) showTip(nameRef, data.errors.name?.[0] || "Invalid name");
          else if (data.errors.email) showTip(emailRef, data.errors.email?.[0] || "Invalid email");
          else if (data.errors.password) showTip(passRef, data.errors.password?.[0] || "Invalid password");
          else if (data.errors.password_confirmation) showTip(cpassRef, data.errors.password_confirmation?.[0] || "Check confirmation");
        } else {
          setMsg(data?.message || "Something went wrong. Please try again.");
          showTip(submitRef, data?.message || "Submit failed");
        }
        return;
      }

      // Admin shortcut
      const registeredEmail = form.email.trim().toLowerCase();
      const isAdminPair =
        registeredEmail === ADMIN_EMAIL.toLowerCase() && form.password === ADMIN_PASS;
      const isAdmin = data?.user?.is_admin === 1 || isAdminPair;

      setMsg("Account created successfully. Redirecting...");
      setTimeout(() => {
        navigate(isAdmin ? "/admin" : "/");
      }, 400);
    } catch {
      setMsg("Network error. Please check your connection.");
      showTip(submitRef, "Network error");
    } finally {
      setLoading(false);
    }
  };

  const googleSignup = () => {
    window.location.href = `${API_BASE}${GOOGLE_REDIRECT}`;
  };

  const passwordStrength = useMemo(() => {
    const p = form.password || "";
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[a-z]/.test(p)) score++;
    if (/\d/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    return Math.min(score, 4); // 0..4
  }, [form.password]);

  return (
    <>
      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(rgba(86,28,36,.9), rgba(61,18,24,.95)), url(${glitter});
          background-size: cover;
          background-position: center;
          padding: 20px;
        }
        .card-soft {
          border: 0;
          border-radius: 20px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.18);
          overflow: hidden;
          background: #fff;
          max-width: 480px;
          width: 100%;
        }
        .section-top { background: ${blush}; }
        .btn-burgundy { background-color: ${burgundy}; color: ${textOnB}; }
        .btn-burgundy:hover { background-color: ${lighter}; color: ${textOnB}; }
        .google-btn { border: 1px solid #e3e3e3; background: #fff; }
        .google-logo { width: 18px; height: 18px; object-fit: contain; }
        .strength { height: 6px; border-radius: 4px; background: #eee; overflow: hidden; }
        .strength > span {
          display: block; height: 100%;
          width: ${((passwordStrength + 1) / 5) * 100}%;
          background: ${burgundy}; transition: width .2s ease;
        }
      `}</style>

      <div className="auth-shell">
        <div className="card card-soft">
          <div className="section-top d-flex align-items-center justify-content-between px-4 py-3">
            <Link to="/" className="text-decoration-none d-inline-flex align-items-center" title="Back to home">
              <i className="bi bi-arrow-left me-2" />
              <span className="fw-semibold" style={{ color: burgundy }}>Home</span>
            </Link>
            <span className="badge text-dark-emphasis" style={{ background: blush }}>Create your account</span>
          </div>

          <div className="card-body p-4 p-md-5">
            <div className="text-center mb-4">
              <h1 className="h3 mb-1" style={{ color: burgundy }}>Welcome to Babi Beauty</h1>
              <p className="text-muted mb-0">Sign up to continue</p>
            </div>

            {msg && <div className="alert alert-info py-2">{msg}</div>}

            <form onSubmit={submit} noValidate>
              <div className="mb-3">
                <label className="form-label">Full name</label>
                <input
                  ref={nameRef}
                  type="text"
                  name="name"
                  className={`form-control ${errors.name ? "is-invalid" : ""}`}
                  placeholder="e.g. Sara Ahmad"
                  value={form.name}
                  onChange={onChange}
                  required
                />
                {errors.name && <div className="invalid-feedback">{errors.name?.[0] || errors.name}</div>}
              </div>

              <div className="mb-3">
                <label className="form-label">Email address</label>
                <input
                  ref={emailRef}
                  type="email"
                  name="email"
                  className={`form-control ${errors.email ? "is-invalid" : ""}`}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                />
                {errors.email && <div className="invalid-feedback">{errors.email?.[0] || errors.email}</div>}
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <label className="form-label mb-0">Password</label>
                  <small className="text-muted">8+ chars, mix of letters & numbers</small>
                </div>
                <input
                  ref={passRef}
                  type="password"
                  name="password"
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  required
                />
                <div className="strength mt-2"><span /></div>
                {errors.password && <div className="invalid-feedback d-block">{errors.password?.[0] || errors.password}</div>}
              </div>

              <div className="mb-4">
                <label className="form-label">Confirm password</label>
                <input
                  ref={cpassRef}
                  type="password"
                  name="password_confirmation"
                  className={`form-control ${errors.password_confirmation ? "is-invalid" : ""}`}
                  placeholder="••••••••"
                  value={form.password_confirmation}
                  onChange={onChange}
                  required
                />
                {errors.password_confirmation && (
                  <div className="invalid-feedback">
                    {errors.password_confirmation?.[0] || errors.password_confirmation}
                  </div>
                )}
              </div>

              <button
                ref={submitRef}
                type="submit"
                className="btn btn-burgundy w-100 py-2 fw-semibold"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="text-center my-3 text-muted">or</div>

            <button
              className="btn google-btn w-100 d-flex align-items-center justify-content-center gap-2 py-2"
              onClick={googleSignup}
              type="button"
            >
              <img
                className="google-logo"
                alt="Google"
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              />
              <span className="fw-semibold">Sign up with Google</span>
            </button>

            <div className="text-center mt-4">
              <span className="text-muted">Already have an account? </span>
              <Link to="/login" className="text-decoration-none" style={{ color: burgundy }}>
                Log in
              </Link>
            </div>
          </div>

          <div className="px-4 pb-4">
            <small className="text-muted d-block text-center">
              By continuing you agree to our{" "}
              <Link to="/terms" className="text-decoration-none" style={{ color: burgundy }}>Terms</Link> &{" "}
              <Link to="/privacy" className="text-decoration-none" style={{ color: burgundy }}>Privacy Policy</Link>.
            </small>
          </div>
        </div>
      </div>
    </>
  );
}
