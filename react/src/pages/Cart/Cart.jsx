// src/pages/Cart/Cart.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get, patch, del, media } from "../../utils/api";
import "./Cart.css";

export default function Cart() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);     // server returns carts with product
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  // Voucher
  const [voucherInput, setVoucherInput] = useState("");
  const [appliedCode, setAppliedCode] = useState(null);

  // ✅ Selection (used for totals)
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const toggleOne = (id, checked) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const res = await get("/cart"); // { items, subtotal, count }
      const arr = res.items || [];
      setItems(arr);
      // Select all by default so totals show immediately
      setSelectedIds(new Set(arr.map((i) => i.id)));
    } catch (e) {
      if (e.status === 401) {
        navigate("/login", { state: { redirectTo: "/cart" } });
        return;
      }
      setErr(e?.message || "Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // If user clears voucher input, remove discount
  useEffect(() => {
    if (voucherInput.trim() === "") setAppliedCode(null);
  }, [voucherInput]);

  // ---- Totals depend on selection ----
  const selectedItems = useMemo(
    () => items.filter((it) => selectedIds.has(it.id)),
    [items, selectedIds]
  );

  const subtotal = useMemo(
    () => selectedItems.reduce((acc, it) => acc + Number(it.price) * Number(it.quantity), 0),
    [selectedItems]
  );

  // Flat shipping on small orders (only if something is selected)
  const shipping = subtotal > 0 && subtotal < 100 ? 5 : 0;

  const discountRate = appliedCode === "WHEAT10" ? 0.10 : 0;
  const discount = subtotal * discountRate;
  const total = Math.max(0, subtotal + shipping - discount);

  const fmt = (v) => `$${Number(v || 0).toFixed(2)}`;

  async function updateQty(cartId, nextQty) {
    if (nextQty < 1) return;
    const idx = items.findIndex((i) => i.id === cartId);
    if (idx === -1) return;

    const prev = items[idx];
    const snapshot = [...items];
    const updated = { ...prev, quantity: nextQty };
    const next = [...items];
    next[idx] = updated;
    setItems(next);
    setUpdatingId(cartId);

    try {
      await patch(`/cart/${cartId}`, { quantity: nextQty });
    } catch (e) {
      setItems(snapshot);
      if (e.status === 401) {
        navigate("/login", { state: { redirectTo: "/cart" } });
        return;
      }
      alert(e?.message || "Failed to update quantity.");
    } finally {
      setUpdatingId(null);
    }
  }

  async function removeItem(cartId) {
    const snapshot = items;
    setItems(items.filter((i) => i.id !== cartId));
    try {
      await del(`/cart/${cartId}`);
    } catch (e) {
      setItems(snapshot);
      alert(e?.message || "Failed to remove item.");
    }
    // also drop from selection
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cartId);
      return next;
    });
  }

  async function clearCart() {
    const snapshot = items;
    setItems([]);
    try {
      await del("/cart");
    } catch (e) {
      setItems(snapshot);
      alert(e?.message || "Failed to clear cart.");
    }
    setSelectedIds(new Set());
  }

  function applyVoucher() {
    const code = voucherInput.trim().toUpperCase();
    if (!code) return;
    if (code === "WHEAT10") setAppliedCode(code);
    else alert("Invalid code");
  }

  if (loading) {
    return (
      <div className="cart-page">
        <div className="cart-shell">
          <div className="cart-left">
            <div className="cart-skel" />
            <div className="cart-skel" />
            <div className="cart-skel" />
          </div>
          <aside className="cart-right">
            <div className="summary-card">
              <div className="sum-skel" />
              <div className="sum-skel" />
              <div className="sum-skel" />
            </div>
          </aside>
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <p className="cart-error">{err}</p>
          <button className="btn ghost" onClick={() => navigate("/")}>Back to shop</button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty">
          <h1 className="title">Your Cart</h1>
          <p className="muted">Your bag is empty. Let’s add something beautiful ✨</p>
          <button className="btn primary" onClick={() => navigate("/")}>Browse Products</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-head">
        <button className="link" onClick={() => navigate(-1)}>← Continue shopping</button>
        <h1 className="title">Your Cart</h1>
        <button className="link danger" onClick={clearCart}>
          <i className="bi bi-trash3"></i> Clear all
        </button>
      </div>

      <div className="cart-shell">
        {/* Left: items */}
        <div className="cart-left">
          {items.map((it) => {
            const src = it?.product?.image_path ? media(it.product.image_path) : "/placeholder.png";
            const line = Number(it.price) * Number(it.quantity);
            const checked = selectedIds.has(it.id);

            return (
              <div key={it.id} className="cart-row" data-checked={checked ? "1" : "0"}>
                {/* Top-right checkbox (doesn't change design) */}
                <label className="row-check" title="Select item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => toggleOne(it.id, e.target.checked)}
                    aria-label={`Select ${it?.product?.name || "item"}`}
                  />
                </label>

                <img className="thumb" src={src} alt={it?.product?.name || "Product"} />
                <div className="info">
                  <div className="name">{it?.product?.name || "Product"}</div>
                  <div className="meta">
                    <span className="price-each">{fmt(it.price)} <span className="x">/ each</span></span>
                  </div>
                  <div className="actions">
                    <div className="qty">
                      <button
                        className="qbtn"
                        disabled={updatingId === it.id || it.quantity <= 1}
                        onClick={() => updateQty(it.id, it.quantity - 1)}
                        aria-label="decrease"
                      >
                        <i className="bi bi-dash-lg"></i>
                      </button>
                      <span className="qvalue" aria-live="polite">{it.quantity}</span>
                      <button
                        className="qbtn"
                        disabled={updatingId === it.id}
                        onClick={() => updateQty(it.id, it.quantity + 1)}
                        aria-label="increase"
                      >
                        <i className="bi bi-plus-lg"></i>
                      </button>
                    </div>

                    <div className="line-total">{fmt(line)}</div>

                    <button
                      className="icon danger"
                      disabled={updatingId === it.id}
                      onClick={() => removeItem(it.id)}
                      title="Remove"
                    >
                      <i className="bi bi-trash3"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: summary */}
        <aside className="cart-right">
          <div className="summary-card">
            <h2 className="sum-title">Order Summary</h2>

            <div className="voucher">
              <input
                type="text"
                placeholder="Discount code (try WHEAT10)"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
              />
              <button className="btn mini" onClick={applyVoucher}>Apply</button>
            </div>

            {appliedCode && (
              <div className="muted" style={{ marginTop: 6 }}>
                Applied: <strong>{appliedCode}</strong> (10% off)
              </div>
            )}

            <div className="sum-row"><span>Sub Total</span><span>{fmt(subtotal)}</span></div>
            <div className="sum-row">
              <span>Discount</span>
              <span className={discount ? "good" : ""}>
                {discount ? `- ${fmt(discount)}` : fmt(0)}
              </span>
            </div>
            <div className="sum-row"><span>Delivery fee</span><span>{fmt(shipping)}</span></div>

            <div className="sum-divider" />
            <div className="sum-row total"><span>Total</span><span>{fmt(total)}</span></div>

            <div className="sum-note">
              <i className="bi bi-shield-check"></i>
              <span>30-day warranty against manufacturing defects.</span>
            </div>

            <button
              className="btn primary xl"
              disabled={selectedIds.size === 0}
              onClick={() =>
                navigate("/checkout", {
                  state: { selectedItemIds: Array.from(selectedIds) },
                })
              }
              title={selectedIds.size === 0 ? "Select at least one item" : "Checkout"}
            >
              Checkout Now
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
