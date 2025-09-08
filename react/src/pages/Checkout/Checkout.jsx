// src/pages/Checkout/Checkout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { get, post, media } from "../../utils/api";
import "./Checkout.css";

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();

  // From Cart page
  const selectedItemIds = location.state?.selectedItemIds || []; // cart row IDs
  const cartVoucherCode = (location.state?.voucherCode || localStorage.getItem("voucher_code") || "").toUpperCase();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [ship, setShip] = useState({
    full_name: "",
    email: "",
    phone: "",
    address1: "",
    country: "Lebanon",
  });

  const [payMethod, setPayMethod] = useState("card");

  // Prefill user info if logged in
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

  // Load all cart rows, then keep only the selected IDs
  useEffect(() => {
    (async () => {
      try {
        const res = await get("/cart"); // { items: [ {id, product:{name,image_path}, price, quantity}, ... ] }
        const arr = res?.items || [];
        const filtered = selectedItemIds.length
          ? arr.filter((i) => selectedItemIds.includes(i.id))
          : [];
        if (filtered.length === 0) {
          navigate("/cart");
          return;
        }
        setItems(filtered);
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
  }, [navigate, selectedItemIds]);

  // Read-only summary (server will recompute anyway)
  const subtotal = useMemo(
    () => items.reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0),
    [items]
  );
  const shipping = subtotal > 0 && subtotal < 100 ? 5 : 0;
  const discount = cartVoucherCode === "WHEAT10" ? subtotal * 0.1 : 0;
  const total = Math.max(0, subtotal + shipping - discount);
  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  function onShipChange(e) {
    const { name, value } = e.target;
    setShip((s) => ({ ...s, [name]: value }));
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (submitting) return;

    if (!ship.full_name || !ship.email || !ship.address1) {
      alert("Please fill your name, email and address.");
      return;
    }

    setSubmitting(true);
    try {
      // Send only cart row IDs + quantities; server uses the carts table.
      const payload = {
        shipping: ship,
        payment_method: payMethod,
        voucher_code: cartVoucherCode || null,
        items: items.map((i) => ({ id: i.id, quantity: i.quantity })), // cart row IDs
      };

      const res = await post("/checkout", payload);

      if (res?.payment_url) {
        window.location.href = res.payment_url;
        return;
      }

      if (res?.order_id) {
        localStorage.removeItem("voucher_code");
        alert(`Order #${res.order_id} created. Total: ${fmt(res.total)}`);
        navigate("/", { replace: true });
        return;
      }

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
          <button className="btn ghost" onClick={() => navigate("/cart")}>Back to cart</button>
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
                <input type="radio" name="pay" checked={payMethod === "card"} onChange={() => setPayMethod("card")} />
                <span>Card (Stripe)</span>
              </label>
              <label className={`pill ${payMethod === "cod" ? "active" : ""}`}>
                <input type="radio" name="pay" checked={payMethod === "cod"} onChange={() => setPayMethod("cod")} />
                <span>Cash on Delivery</span>
              </label>
            </div>

            <button type="submit" className="btn primary xl" disabled={submitting}>
              {submitting ? "Processing..." : "Pay now"}
            </button>
          </section>
        </form>

        {/* Right: read-only summary */}
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
            {cartVoucherCode && <div className="sum-row"><span>Discount ({cartVoucherCode})</span><span>{discount ? `- ${fmt(discount)}` : fmt(0)}</span></div>}
            <div className="sum-row"><span>Delivery fee</span><span>{fmt(shipping)}</span></div>
            <div className="sum-divider" />
            <div className="sum-row total"><span>Total</span><span>{fmt(total)}</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
