// src/pages/BookExpert/BookExpert.jsx
import React, { useEffect, useMemo, useState } from "react";
import { get, post, ORIGIN } from "../../utils/api";
import "./BookExpert.css";

/* ------------------ helpers ------------------ */
function fmtDate(d) {
  // YYYY-MM-DD in local time
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + dd;
}
function pad(n) { return String(n).padStart(2, "0"); }

/** Make 09:00..18:30 every 30 minutes */
function makeSlots() {
  const out = [];
  for (let h = 9; h <= 18; h++) {
    out.push(pad(h) + ":00");
    out.push(h === 18 ? "18:30" : pad(h) + ":30");
  }
  return out;
}
const ALL_SLOTS = makeSlots();

/** Compute end time HH:MM (local) from start HH:MM by adding 30 minutes */
function endFromStart(startHHMM) {
  if (!startHHMM) return "";
  const parts = startHHMM.split(":");
  const h = Number(parts[0]), m = Number(parts[1]);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  d.setMinutes(d.getMinutes() + 30);
  return pad(d.getHours()) + ":" + pad(d.getMinutes());
}

/** Build "YYYY-MM-DD HH:MM:SS" in local time (no ISO/UTC) */
function toLocalDateTime(dateStr, timeStr) {
  return dateStr + " " + timeStr + ":00";
}

/** Within working hours (start time only) */
function withinWorkingHours(timeStr) {
  const parts = timeStr.split(":");
  const h = Number(parts[0]), m = Number(parts[1]);
  const mins = h * 60 + m;
  return mins >= 9 * 60 && mins <= 18 * 60 + 30;
}

/** Avatar URL helper */
function avatarUrl(e) {
  if (e && e.avatar_url && typeof e.avatar_url === "string" && e.avatar_url.indexOf("http") === 0) return e.avatar_url;
  if (e && e.avatar_path && typeof e.avatar_path === "string" && e.avatar_path.indexOf("http") === 0) return e.avatar_path;
  if (e && e.avatar_path) return ORIGIN + "/storage/" + e.avatar_path;
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

  const active = useMemo(function () {
    for (let i = 0; i < experts.length; i++) {
      if (experts[i].id === activeId) return experts[i];
    }
    return null;
  }, [experts, activeId]);

  // Load experts
  useEffect(function () {
    get("/beauty-experts")
      .then(function (r) {
        const list = (r && r.data) ? r.data : (r || []);
        setExperts(list);
        if (list && list.length) setActiveId(list[0].id);
      })
      .catch(function (e) { setMsg(extract(e)); });
  }, []);

  // Load reviews
  useEffect(function () {
    if (!activeId) return;
    get("/beauty-experts/" + activeId + "/reviews")
      .then(function (arr) { setReviews(arr || []); })
      .catch(function (e) { setMsg(extract(e)); });
  }, [activeId]);

  // Load availability
  useEffect(function () {
    if (!activeId || !date) return;
    get("/bookings/availability?beauty_expert_id=" + activeId + "&date=" + date)
      .then(function (payload) {
        const labels = new Set();

        // 1) { booked: [ {starts_at, ends_at}, ... ] }
        if (payload && Array.isArray(payload.booked)) {
          payload.booked.forEach(function (b) {
            if (!b || !b.starts_at || !b.ends_at) return;
            const s = new Date(String(b.starts_at).replace(" ", "T"));
            const e = new Date(String(b.ends_at).replace(" ", "T"));
            for (let d = new Date(s); d < e; d.setMinutes(d.getMinutes() + 30)) {
              labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
            }
          });
        }
        // 2) { slots: [ {starts_at, ends_at, available}, ... ] } — mark full slots as taken
        else if (payload && Array.isArray(payload.slots)) {
          payload.slots.forEach(function (s) {
            if (!s || s.available !== false || !s.starts_at) return;
            const d = new Date(String(s.starts_at).replace(" ", "T"));
            labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
          });
        }

        setTaken(Array.from(labels));
      })
      .catch(function (e) { setMsg(extract(e)); });
  }, [activeId, date]);

  const end = useMemo(function () { return endFromStart(start); }, [start]);

  async function submit() {
    setMsg("");
    if (!active) { setMsg("Choose a beauty expert first."); return; }
    if (!date) { setMsg("Pick a date."); return; }
    if (!start) { setMsg("Pick a start time."); return; }
    if (!withinWorkingHours(start)) { setMsg("Start time must be between 09:00 and 18:30."); return; }
    if (!end) { setMsg("End time is invalid. Pick a start time again."); return; }

    const starts_at = toLocalDateTime(date, start);
    const ends_at   = toLocalDateTime(date, end);

    setBusy(true);
    try {
      await post("/bookings", {
        beauty_expert_id: active.id,
        starts_at: starts_at,
        ends_at: ends_at,
        price: Number(active && active.base_price != null ? active.base_price : 0) || 0,
      });
      setMsg("✅ Booking created!");
      setStart("");

      // reload availability
      get("/bookings/availability?beauty_expert_id=" + active.id + "&date=" + date)
        .then(function (payload) {
          const labels = new Set();
          if (payload && Array.isArray(payload.slots)) {
            payload.slots.forEach(function (s) {
              if (!s || s.available !== false || !s.starts_at) return;
              const d = new Date(String(s.starts_at).replace(" ", "T"));
              labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
            });
          } else if (payload && Array.isArray(payload.booked)) {
            payload.booked.forEach(function (b) {
              if (!b || !b.starts_at || !b.ends_at) return;
              const s = new Date(String(b.starts_at).replace(" ", "T"));
              const e = new Date(String(b.ends_at).replace(" ", "T"));
              for (let d = new Date(s); d < e; d.setMinutes(d.getMinutes() + 30)) {
                labels.add(pad(d.getHours()) + ":" + pad(d.getMinutes()));
              }
            });
          }
          setTaken(Array.from(labels));
        })
        .catch(function () {});
    } catch (e) {
      setMsg(extract(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bb-wrap">
      <header className="bb-hero">
        <h1>Book an Expert</h1>
        <p>Select a specialist, choose your date & time (30-min slots).</p>
      </header>

      <div className="bb-grid">
        <section className="bb-card">
          <h2 className="bb-h2">Experts</h2>
          <ul className="bb-experts">
            {experts.map(function (e) {
              return (
                <li
                  key={e.id}
                  className={"bb-expert " + (e.id === activeId ? "active" : "")}
                  onClick={function () { setActiveId(e.id); }}
                >
                  <img src={avatarUrl(e)} alt={e.name} />
                  <div className="info">
                    <div className="name">{e.name}</div>
                    <div className="spec">{e.specialty}</div>
                    <div className="price">
                      {"$" + Number(e && e.base_price != null ? e.base_price : 0).toFixed(2)}
                    </div>
                  </div>
                </li>
              );
            })}
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
                onChange={function (e) { setDate(e.target.value); setStart(""); }}
              />
            </label>

            <label>
              Start time
              <div className="bb-slots">
                {ALL_SLOTS.map(function (t) {
                  const disabled = taken.indexOf(t) !== -1;
                  return (
                    <button
                      key={t}
                      type="button"
                      className={"slot " + (start === t ? "chosen" : "")}
                      disabled={disabled}
                      onClick={function () { setStart(t); }}
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
            {(reviews || []).map(function (r) {
              return (
                <li key={r.id}>
                  <span className="stars">{"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</span>
                  <span className="text">{r.comment}</span>
                  <time>{new Date(r.created_at).toLocaleDateString()}</time>
                </li>
              );
            })}
            {!(reviews && reviews.length) ? <li>No reviews yet.</li> : null}
          </ul>
        </section>
      </div>
    </div>
  );
}

function extract(e) {
  const raw = (e && e.message ? e.message : "").trim();
  if (!raw) return "Something went wrong.";

  try {
    const asJson = JSON.parse(raw);
    // Laravel validation errors (422)
    if (asJson && asJson.errors) {
      const keys = Object.keys(asJson.errors);
      if (keys.length && Array.isArray(asJson.errors[keys[0]]) && asJson.errors[keys[0]].length) {
        return asJson.errors[keys[0]][0];
      }
    }
    if (asJson && asJson.message) return asJson.message;
  } catch (err) {
    // not JSON body, fall through
  }

  if (raw.indexOf("Unauthenticated") !== -1) return "⚠️ Unauthenticated — please log in.";
  if (raw.indexOf("422") !== -1) return "⚠️ Invalid data (422). Check time/date and try again.";
  return raw;
}
