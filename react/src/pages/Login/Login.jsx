import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../Signup/Signup.css";                          // ✅ keep your styles
import glitter from "../../assets/images/glitter.jpg";  // ✅ same background

// --- Config ---
const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000").replace(/\/+$/, "");
const LOGIN_ENDPOINT = "/api/auth/login";              // ✅ token endpoint (no cookie flow)
const GOOGLE_REDIRECT = "/auth/google/redirect";       // leave as-is if you use it

// Optional admin shortcut
const ADMIN_EMAIL = "admin@babibeauty.test";
const ADMIN_PASS  = "Admin@12345";

// Keys used elsewhere (BookExpert reads "auth_token")
const TOKEN_KEY = "auth_token";
const USER_KEY  = "auth_user";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm]     = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors]   = useState({});
  const [msg, setMsg]         = useState("");

  const burgundy = "#561C24";
  const lighter  = "#6f2730";
  const blush    = "#F8EDEE";
  const textOnB  = "#FFFFFF";

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const goGoogle = () => {
    window.location.href = `${API_BASE}${GOOGLE_REDIRECT}`;
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMsg("");
    setErrors({});

    try {
      // ✅ TOKEN LOGIN (no cookies, no csrf call)
      const res = await fetch(`${API_BASE}${LOGIN_ENDPOINT}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          device_name: "web",            // optional, nice for Sanctum tokens
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // shape: { message, errors? }
        if (data?.errors) setErrors(data.errors);
        setMsg(data?.message || "Login failed");
        return;
      }

      // shape: { message, user, token, token_type }
      const token = data.token;
      const user  = data.user;

      // ✅ Persist for whole app (BookExpert reads this)
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user || null));
      if (typeof window.__setAuthToken === "function") {
        window.__setAuthToken(token); // keep in-memory copy for current tab
      }

      setMsg("Logged in successfully.");

      // Keep your admin redirect logic
      if (form.email === ADMIN_EMAIL && form.password === ADMIN_PASS) {
        navigate("/admin", { replace: true });
      } else {
        navigate("/", { replace: true });   // or navigate("/book") if you prefer
      }
    } catch (err) {
      setMsg("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="auth-page"
      style={{
        minHeight: "100vh",
        background: `linear-gradient(0deg, ${burgundy}aa, ${burgundy}aa), url(${glitter}) center/cover no-repeat fixed`,
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <div
        className="auth-card shadow-lg"
        style={{
          width: "100%",
          maxWidth: 600,
          background: textOnB,
          borderRadius: 18,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            background: burgundy,
            color: textOnB,
            padding: "22px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <Link to="/" style={{ color: textOnB, textDecoration: "none", fontSize: 20 }}>
              <i className="bi bi-arrow-left-circle"></i> Home
            </Link>
            <div>
              <h1 style={{ fontSize: 22, margin: 0, letterSpacing: 0.3 }}>
                Welcome back ✨
              </h1>
              <p style={{ margin: "6px 0 0", opacity: 0.9 }}>
                Login to your Babi Beauty account
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ padding: 24 }}>
          {msg && (
            <div
              className="alert"
              style={{
                background: blush,
                borderLeft: `4px solid ${burgundy}`,
                padding: "10px 12px",
                marginBottom: 16,
                color: "#5d3333",
                borderRadius: 8,
              }}
            >
              {msg}
            </div>
          )}

          {/* Email */}
          <div className="mb-3">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className={`form-control ${errors.email ? "is-invalid" : ""}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              autoComplete="email"
              required
            />
            {errors.email && (
              <div className="invalid-feedback">
                {Array.isArray(errors.email) ? errors.email[0] : String(errors.email)}
              </div>
            )}
          </div>

          {/* Password */}
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className={`form-control ${errors.password ? "is-invalid" : ""}`}
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              autoComplete="current-password"
              required
            />
            {errors.password && (
              <div className="invalid-feedback">
                {Array.isArray(errors.password) ? errors.password[0] : String(errors.password)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="d-flex align-items-center justify-content-between mb-3">
            <Link to="/forgot-password" style={{ color: lighter, textDecoration: "none" }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn w-100"
            disabled={loading}
            style={{
              background: burgundy,
              color: textOnB,
              padding: "10px 12px",
              borderRadius: 12,
              border: "none",
              fontWeight: 600,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {/* Divider */}
          <div className="text-center my-3" style={{ color: "#777" }}>
            <span>or</span>
          </div>

          {/* Google */}
          <button
            type="button"
            onClick={goGoogle}
            className="btn w-100"
            style={{
              background: "#ffffff",
              color: "#333",
              padding: "10px 12px",
              borderRadius: 12,
              border: "1px solid #ddd",
              fontWeight: 600,
            }}
          >
            Continue with Google
          </button>

          {/* Footer */}
          <div className="text-center mt-3">
            <span>Don’t have an account? </span>
            <Link to="/signup" style={{ color: lighter, textDecoration: "none", fontWeight: 600 }}>
              Create one
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
