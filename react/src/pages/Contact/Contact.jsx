import React, { useState } from "react";
import "./Contact.css";

export default function Contact() {
  const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [errors, setErrors] = useState({}); // Laravel validation errors
  const [serverError, setServerError] = useState("");

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((prev) => ({ ...prev, [e.target.name]: undefined })); // clear field error as user types
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setServerError("");

    try {
      const res = await fetch(`${API_BASE}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(form),
        credentials: "include", // ok if you’re using Sanctum; otherwise remove
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        // Laravel validation errors come as { errors: { field: [msg] } }
        if (data?.errors) setErrors(data.errors);
        throw new Error(data?.message || "Failed to send message");
      }

      // Success
      setSuccess(data?.message || "Thanks! Your message was received.");
      setForm({ name: "", email: "", message: "" });
      setErrors({});
    } catch (err) {
      setServerError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-page">
      {/* Hero Banner */}
      <div className="contact-hero text-center">
        <h1 className="contact-title">Get in Touch</h1>
        <p className="contact-subtitle">
          We'd love to hear from you — whether it’s a question, feedback, or a
          collaboration idea.
        </p>
      </div>

      {/* Contact Section */}
      <div className="container contact-container py-5">
        <div className="row g-4">
          {/* Contact Form */}
          <div className="col-lg-7">
            <div className="contact-card p-4 shadow-sm">
              <h3 className="mb-3">Send us a Message</h3>

              {/* Alerts */}
              {success && (
                <div className="alert alert-success" role="alert">
                  {success}
                </div>
              )}
              {serverError && (
                <div className="alert alert-danger" role="alert">
                  {serverError}
                </div>
              )}

              <form onSubmit={onSubmit} noValidate>
                {/* Name */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="name">Your Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Enter your name"
                    value={form.name}
                    onChange={onChange}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name[0]}</div>
                  )}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="email">Email Address</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Enter your email"
                    value={form.email}
                    onChange={onChange}
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email[0]}</div>
                  )}
                </div>

                {/* Message */}
                <div className="mb-3">
                  <label className="form-label" htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    className={`form-control ${errors.message ? "is-invalid" : ""}`}
                    rows="5"
                    placeholder="Write your message..."
                    value={form.message}
                    onChange={onChange}
                  />
                  {errors.message && (
                    <div className="invalid-feedback">{errors.message[0]}</div>
                  )}
                </div>

                <button
                  type="submit"
                  className="btn bb-btn w-100"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

          {/* Contact Info */}
          <div className="col-lg-5">
            <div className="contact-info p-4 shadow-sm">
              <h3 className="mb-4">Contact Information</h3>
              <p><i className="bi bi-geo-alt-fill me-2"></i> Beirut, Lebanon</p>
              <p><i className="bi bi-envelope-fill me-2"></i> support@babibeauty.com</p>
              <p><i className="bi bi-telephone-fill me-2"></i> +961 76 123 456</p>
              <hr />
              <h5 className="mb-3">Follow Us</h5>
              <div className="social-links">
                <a href="#"><i className="bi bi-instagram"></i></a>
                <a href="#"><i className="bi bi-facebook"></i></a>
                <a href="#"><i className="bi bi-tiktok"></i></a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
