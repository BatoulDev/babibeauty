// src/pages/BookExpert/BookExpert.jsx
import React, { useEffect, useMemo, useState } from "react";
import { ORIGIN, post, cachedLocal, prefetch, fetchJson } from "../../utils/api";
import "./BookExpert.css";

/* ------------------ helpers ------------------ */
function fmtDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}
function pad(n) { return String(n).padStart(2, "0"); }

function makeSlots() {
  const out = [];
  for (let h = 9; h <= 18; h++) {
    out.push(pad(h) + ":00");
    out.push(h === 18 ? "18:30" : pad(h) + ":30");
  }
  return out;
}
const ALL_SLOTS = makeSlots();

function endFromStart(startHHMM) {
  if (!startHHMM) return "";
  const [h, m] = startHHMM.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + 30);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

function toLocalDateTime(dateStr, timeStr) { return dateStr + " " + timeStr + ":00"; }

function withinWorkingHours(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  const mins = h * 60 + m;
  return mins >= 9 * 60 && mins <= 18 * 60 + 30;
}

function avatarUrl(e) {
  if (e?.avatar_url?.startsWith?.("http")) return e.avatar_url;
  if (e?.avatar_path?.startsWith?.("http")) return e.avatar_path;
  if (e?.avatar_path) return ORIGIN + "/storage/" + e.avatar_path;
  return "https://via.placeholder.com/56x56.png?text=BE";
}

export default function BookExpert() {
  const [experts, setExperts] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [date, setDate] = useState(fmtDate(new Date()));
  const [taken, setTaken] = useState([]);     // array of "HH:MM"
  const [start, setStart] = useState("");     // "HH:MM"
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const active = useMemo(() => experts.find(e => e.id === activeId) || null, [experts, activeId]);

  /* ---------- Experts: cached + prefetch reviews for first few ---------- */
  useEffect(() => {
    cachedLocal("/beauty-experts", 300000)
      .then((r) => {
        const list = r?.data || r || [];
        setExperts(list);
        if (list?.length) {
          setActiveId(list[0].id);
          list.slice(0, 5).forEach((e) => prefetch(`/api/beauty-experts/${e.id}/reviews`));
        }
      })
      .catch((e) => setMsg(extract(e)));
  }, []);

  /* ---------------- Reviews: cached, robust to shape ---------------- */
  useEffect(() => {
    if (!activeId) return;

    // helper that accepts either [] or {data: []}
    function normalizeReviews(payload) {
      return Array.isArray(payload) ? payload : (payload?.data || []);
    }

    // try the canonical /api path (LS cached)
    cachedLocal(`/api/beauty-experts/${activeId}/reviews`, 300000)
      .then((payload) => {
        setReviews(normalizeReviews(payload));
      })
      .catch(async (e) => {
        // fallback: non-/api path in case server is mounted differently
        try {
          const payload = await cachedLocal(`/beauty-experts/${activeId}/reviews`, 300000);
          setReviews(normalizeReviews(payload));
        } catch (e2) {
          setMsg(extract(e2));
        }
      });
  }, [activeId]);

  /* --------------- Availability: fresh, cancel stale requests --------------- */
  useEffect(() => {
    if (!activeId || !date) return;
    const ctrl = new AbortController();

    fetchJson(`/api/bookings/availability?beauty_expert_id=${activeId}&date=${date}`, { signal: ctrl.signal })
      .then((payload) => {
        const labels = new Set();

        if (Array.isArray(payload?.booked)) {
          payload.booked.forEach((b) => {
            if (!b?.starts_at || !b?.ends_at) return;
            const s = new Date(String(b.starts_at).replace(" ", "T"));
            const e = new Date(String(b.ends_at).replace(" ", "T"));
            for (let d = new Date(s); d < e; d.setMinutes(d.getMinutes() + 30)) {
              labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
            }
          });
        } else if (Array.isArray(payload?.slots)) {
          payload.slots.forEach((s) => {
            if (s?.available === false && s?.starts_at) {
              const d = new Date(String(s.starts_at).replace(" ", "T"));
              labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
            }
          });
        }

        setTaken(Array.from(labels));
      })
      .catch((e) => {
        if (e?.name === "AbortError") return;
        setMsg(extract(e));
      });

    return () => ctrl.abort();
  }, [activeId, date]);

  const end = useMemo(() => endFromStart(start), [start]);

  async function submit() {
    setMsg("");
    if (!active) return setMsg("Choose a beauty expert first.");
    if (!date) return setMsg("Pick a date.");
    if (!start) return setMsg("Pick a start time.");
    if (!withinWorkingHours(start)) return setMsg("Start time must be between 09:00 and 18:30.");
    if (!end) return setMsg("End time is invalid. Pick a start time again.");

    const starts_at = toLocalDateTime(date, start);
    const ends_at   = toLocalDateTime(date, end);

    setBusy(true);
    try {
      await post("/bookings", {
        beauty_expert_id: active.id,
        starts_at,
        ends_at,
        price: Number(active?.base_price ?? 0) || 0,
      });
      setMsg("✅ Booking created!");
      setStart("");

      // refresh availability fresh
      fetchJson(`/api/bookings/availability?beauty_expert_id=${active.id}&date=${date}`)
        .then((payload) => {
          const labels = new Set();
          if (Array.isArray(payload?.slots)) {
            payload.slots.forEach((s) => {
              if (s?.available === false && s?.starts_at) {
                const d = new Date(String(s.starts_at).replace(" ", "T"));
                labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
              }
            });
          } else if (Array.isArray(payload?.booked)) {
            payload.booked.forEach((b) => {
              if (!b?.starts_at || !b?.ends_at) return;
              const s = new Date(String(b.starts_at).replace(" ", "T"));
              const e = new Date(String(b.ends_at).replace(" ", "T"));
              for (let d = new Date(s); d < e; d.setMinutes(d.getMinutes() + 30)) {
                labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
              }
            });
          }
          setTaken(Array.from(labels));
        })
        .catch(() => {});
    } catch (e) {
      setMsg(extract(e));
    } finally {
      setBusy(false);
    }
  }

  return (
   <div className="bb-wrap bb-page-book">   {/* <-- add bb-page-book */}
    <header className="bb-minihero">       {/* <-- NOT bb-hero */}
      <h1>Book an Expert</h1>
      <p>Select a specialist, choose your date & time (30-min slots).</p>
    </header>
      <div className="bb-grid">
        <section className="bb-card">
          <h2 className="bb-h2">Experts</h2>
          <ul className="bb-experts">
            {experts.map((e) => (
              <li
                key={e.id}
                className={"bb-expert " + (e.id === activeId ? "active" : "")}
                onClick={() => setActiveId(e.id)}
                onMouseEnter={() => prefetch(`/api/beauty-experts/${e.id}/reviews`)}
              >
                <img loading="lazy" src={avatarUrl(e)} alt={e.name} />
                <div className="info">
                  <div className="name">{e.name}</div>
                  <div className="spec">{e.specialty}</div>
                  <div className="price">{"$" + Number(e?.base_price ?? 0).toFixed(2)}</div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="bb-card">
          <h2 className="bb-h2">Schedule</h2>

          <div className="bb-form">
            <label>
              Date
              <input
                type="date"
                value={date}
                min={fmtDate(new Date())}
                onChange={(e) => { setDate(e.target.value); setStart(""); }}
              />
            </label>

            <label>
              Start time
              <div className="bb-slots">
                {ALL_SLOTS.map((t) => {
                  const disabled = taken.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      className={"slot " + (start === t ? "chosen" : "")}
                      disabled={disabled}
                      onClick={() => setStart(t)}
                      title={disabled ? "This time is fully booked" : "Select this time"}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </label>

            <label>
              End time
              <input type="text" value={end || "--:--"} readOnly />
            </label>

            <button className="bb-submit" disabled={busy || !start} onClick={submit}>
              {busy ? "Booking..." : "Confirm Booking"}
            </button>

            {msg ? <p className="bb-msg">{msg}</p> : null}
          </div>

          <h3 className="bb-h3">Recent Reviews</h3>
          <ul className="bb-reviews">
            {(reviews || []).map((r) => (
              <li key={r.id}>
                <span className="stars">{"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</span>
                <span className="text">{r.comment}</span>
                <time>{new Date(r.created_at).toLocaleDateString()}</time>
              </li>
            ))}
            {!(reviews && reviews.length) ? <li>No reviews yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function extract(e) {
  const raw = (e?.message || "").trim();
  if (!raw) return "Something went wrong.";

  try {
    const asJson = JSON.parse(raw);
    if (asJson?.errors) {
      const keys = Object.keys(asJson.errors);
      if (keys.length && Array.isArray(asJson.errors[keys[0]]) && asJson.errors[keys[0]].length) {
        return asJson.errors[keys[0]][0];
      }
    }
    if (asJson?.message) return asJson.message;
  } catch {}

  if (raw.includes("Unauthenticated")) return "⚠️ Unauthenticated — please log in.";
  if (raw.includes("422")) return "⚠️ Invalid data (422). Check time/date and try again.";
  return raw;
}
