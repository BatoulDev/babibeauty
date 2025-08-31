// src/pages/Checkout/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, post, media } from "../../utils/api";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Prefill from localStorage (carried from Cart)
  const [voucherCode, setVoucherCode] = useState(
    localStorage.getItem("voucher_code") || ""
  );

  // Shipping form (city + postal removed)
  const [ship, setShip] = useState({
    full_name: "",
    email: "",
    phone: "",
    address1: "",
    country: "Lebanon",
  });

  // Prefill name/email from logged-in user if available
  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth_user");
      if (raw) {
        const u = JSON.parse(raw);
        setShip((s) => ({
          ...s,
          full_name: u?.name || s.full_name,
          email: u?.email || s.email,
        }));
      }
    } catch {}
  }, []);

  // Payment method
  const [payMethod, setPayMethod] = useState("card"); // 'card' | 'cod'

  useEffect(() => {
    (async () => {
      try {
        const res = await get("/cart"); // { items, subtotal, count }
        if (!res?.items?.length) {
          navigate("/cart");
          return;
        }
        setItems(res.items || []);
      } catch (e) {
        if (e.status === 401) {
          navigate("/login", { state: { redirectTo: "/checkout" } });
          return;
        }
        setErr(e?.message || "Failed to load cart.");
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  // Totals — consistent with cart page
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0),
    [items]
  );
  const shipping = subtotal > 0 && subtotal < 100 ? 5 : 0;
  const discount =
    voucherCode?.trim().toUpperCase() === "WHEAT10" ? subtotal * 0.1 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  // persist voucher (so if they go back & forth it stays)
  useEffect(() => {
    const v = (voucherCode || "").trim();
    if (v) localStorage.setItem("voucher_code", v);
    else localStorage.removeItem("voucher_code");
  }, [voucherCode]);

  function onShipChange(e) {
    const { name, value } = e.target;
    setShip((s) => ({ ...s, [name]: value }));
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (submitting) return;

    // quick client validation
    if (!ship.full_name || !ship.email || !ship.address1) {
      alert("Please fill your name, email and address.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        shipping: ship,
        payment_method: payMethod,        // 'card' or 'cod'
        voucher_code: voucherCode?.trim() || null,
      };

      const res = await post("/checkout", payload);

      // If you implement real card payments, provider will redirect user out.
      // Configure provider "return_url" to your frontend "/" to land at home.
      if (res?.payment_url) {
        window.location.href = res.payment_url;
        return;
      }

      // COD (or simplified flow): order created on backend
      if (res?.order_id) {
        localStorage.removeItem("voucher_code");     // clean up
        alert(`Order #${res.order_id} created. Thank you!`);
        navigate("/", { replace: true });            // ⬅️ go home
        return;
      }

      // Fallback
      alert("Order created.");
      navigate("/", { replace: true });
    } catch (e) {
      if (e.status === 401) {
        navigate("/login", { state: { redirectTo: "/checkout" } });
        return;
      }
      alert(e?.message || "Checkout failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="chk-page">
        <div className="chk-shell">
          <div className="chk-left">
            <div className="chk-skel" /><div className="chk-skel" /><div className="chk-skel" />
          </div>
          <aside className="chk-right">
            <div className="sum-card"><div className="sum-skel" /><div className="sum-skel" /><div className="sum-skel" /></div>
          </aside>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="chk-page">
        <div className="chk-empty">
          <p className="chk-error">{err}</p>
          <button className="btn ghost" onClick={() => navigate("/cart")}>
            Back to cart
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chk-page">
      <div className="chk-head">
        <button className="link" onClick={() => navigate(-1)}>← Back</button>
        <h1 className="title">Checkout</h1>
        <div />
      </div>

      <div className="chk-shell">
        {/* Left: Shipping + Payment */}
        <form className="chk-left" onSubmit={submitOrder}>
          <section className="card">
            <h2 className="card-title">Shipping details</h2>
            <div className="grid">
              <div className="field">
                <label>Full name</label>
                <input name="full_name" value={ship.full_name} onChange={onShipChange} required />
              </div>
              <div className="field">
                <label>Email</label>
                <input type="email" name="email" value={ship.email} onChange={onShipChange} required />
              </div>
              <div className="field">
                <label>Phone</label>
                <input name="phone" value={ship.phone} onChange={onShipChange} />
              </div>
              <div className="field">
                <label>Address</label>
                <input name="address1" value={ship.address1} onChange={onShipChange} required />
              </div>
              <div className="field">
                <label>Country</label>
                <input name="country" value={ship.country} onChange={onShipChange} />
              </div>
            </div>
          </section>

          <section className="card">
            <h2 className="card-title">Payment</h2>
            <div className="pay-choices">
              <label className={`pill ${payMethod === "card" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="pay"
                  checked={payMethod === "card"}
                  onChange={() => setPayMethod("card")}
                />
                <span>Card (Stripe)</span>
              </label>
              <label className={`pill ${payMethod === "cod" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="pay"
                  checked={payMethod === "cod"}
                  onChange={() => setPayMethod("cod")}
                />
                <span>Cash on Delivery</span>
              </label>
            </div>

            <div className="voucher">
              <input
                type="text"
                placeholder="Discount code (try WHEAT10)"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value)}
              />
            </div>

            <button type="submit" className="btn primary xl" disabled={submitting}>
              {submitting ? "Processing..." : "Pay now"}
            </button>
          </section>
        </form>

        {/* Right: Summary */}
        <aside className="chk-right">
          <div className="sum-card">
            <h2 className="sum-title">Order Summary</h2>

            <div className="sum-items">
              {items.map((it) => {
                const src = it?.product?.image_path ? media(it.product.image_path) : "/placeholder.png";
                const line = Number(it.price) * Number(it.quantity);
                return (
                  <div className="sum-row item" key={it.id}>
                    <img className="sum-thumb" src={src} alt={it?.product?.name || "Product"} />
                    <div className="sum-info">
                      <div className="sum-name">{it?.product?.name || "Product"}</div>
                      <div className="sum-meta">Qty {it.quantity} × ${Number(it.price).toFixed(2)}</div>
                    </div>
                    <div className="sum-line">${line.toFixed(2)}</div>
                  </div>
                );
              })}
            </div>

            <div className="sum-divider" />

            <div className="sum-row"><span>Sub total</span><span>{fmt(subtotal)}</span></div>
            <div className="sum-row"><span>Discount</span><span>{discount ? `- ${fmt(discount)}` : fmt(0)}</span></div>
            <div className="sum-row"><span>Delivery fee</span><span>{fmt(shipping)}</span></div>

            <div className="sum-divider" />

            <div className="sum-row total"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
