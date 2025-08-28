import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "./BookExpert.css";

/* ------------------------------- config ------------------------------- */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const FILE_BASE = import.meta.env.VITE_FILE_BASE_URL || `${API_BASE}/storage`;

const api = (path, opts = {}) =>
  fetch(
    `${import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api"}${path}`,
    {
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      ...opts,
    }
  ).then(async (r) => {
    const data = await r.json().catch(() => ({}));
    if (!r.ok) {
      throw Object.assign(new Error(data?.message || "Request failed"), {
        status: r.status,
        data,
      });
    }
    return data;
  });

/* ------------------------------- helpers ------------------------------ */
function makeSlots(dateStr) {
  const out = [];
  const base = new Date(`${dateStr}T09:00:00`);
  for (let i = 0; i < 20; i++) {
    const start = new Date(base.getTime() + i * 30 * 60000);
    const end = new Date(start.getTime() + 30 * 60000);
    out.push({
      label: start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      starts_at: start.toISOString().slice(0, 19).replace("T", " "),
      ends_at: end.toISOString().slice(0, 19).replace("T", " "),
    });
  }
  return out;
}

// tiny local cache so experts render immediately
const EXPERTS_CACHE_KEY = "experts_cache_v2";
function readExpertsCache() {
  try {
    const raw = localStorage.getItem(EXPERTS_CACHE_KEY);
    if (!raw) return null;
    const { data } = JSON.parse(raw);
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}
function writeExpertsCache(data) {
  try {
    localStorage.setItem(EXPERTS_CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {}
}

/* ------------------------------ component ----------------------------- */
export default function BookExpert() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [experts, setExperts] = useState([]);
  const [selectedExpert, setSelectedExpert] = useState(null);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);

  // cache reviews per expert so they show instantly after first load
  const [reviewsByExpert, setReviewsByExpert] = useState({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  /* ---------------------------- load experts --------------------------- */
  useEffect(() => {
    // paint instantly from cache
    const cached = readExpertsCache();
    if (cached?.length) setExperts(cached);

    // fetch fresh in background
    let aborted = false;
    api("/beauty-experts?per_page=50&page=1")
      .then((res) => {
        if (aborted) return;
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.results)
          ? res.results
          : [];
        const active = list.filter((e) => e?.is_active === 1 || e?.is_active === true);
        setExperts(active);
        writeExpertsCache(active);

        // prefetch reviews for first few experts so clicks feel instant
        const idsToPrefetch = active.slice(0, 6).map((e) => e.id);
        prefetchReviews(idsToPrefetch);
      })
      .catch((e) => {
        if (!cached?.length) {
          setErr(e?.data?.message || e.message || "Failed to load specialists");
          setExperts([]);
        }
      });
    return () => {
      aborted = true;
    };
  }, []);

  // preselect via ?expert or first available
  useEffect(() => {
    if (!experts.length) return;
    const qId = Number(params.get("expert"));
    const found = qId ? experts.find((e) => e.id === qId) : null;
    setSelectedExpert(found || experts[0]);

    // also prefetch reviews for that selected expert if not already cached
    const targetId = (found || experts[0]).id;
    if (!reviewsByExpert[targetId]) {
      prefetchReviews([targetId]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params, experts]);

  /* ------------------------- availability + reviews -------------------- */
  useEffect(() => {
    if (!selectedExpert) return;
    setSelectedSlot(null);

    let aborted = false;

    api(`/bookings/availability?beauty_expert_id=${selectedExpert.id}&date=${date}`)
      .then((res) => !aborted && setSlots(res.slots || []))
      .catch(() => !aborted && setSlots([]));

    // reviews: if not in cache, prefetch (but do not block UI)
    if (!reviewsByExpert[selectedExpert.id]) {
      prefetchReviews([selectedExpert.id]);
    }

    return () => {
      aborted = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedExpert, date]);

  // prefetch function (batch)
  async function prefetchReviews(ids) {
    const toFetch = ids.filter((id) => !reviewsByExpert[id]);
    if (!toFetch.length) return;

    // fetch in parallel but capped (avoid spamming)
    const chunk = (arr, size) => arr.reduce((a, _, i) => (i % size ? a : [...a, arr.slice(i, i + size)]), []);
    for (const group of chunk(toFetch, 3)) {
      await Promise.allSettled(
        group.map((id) =>
          api(`/beauty-experts/${id}/reviews`)
            .then((res) => {
              setReviewsByExpert((prev) => ({ ...prev, [id]: res.data || res || [] }));
            })
            .catch(() => {
              setReviewsByExpert((prev) => ({ ...prev, [id]: [] }));
            })
        )
      );
    }
  }

  const localSlots = useMemo(() => {
    const ideal = makeSlots(date);
    if (!slots?.length) {
      return ideal.map((s) => ({ ...s, count: 0, available: true, capacity: 3 }));
    }
    const map = new Map(slots.map((s) => [s.starts_at, s]));
    return ideal.map((s) => {
      const m = map.get(s.starts_at);
      return { ...s, count: m?.count ?? 0, available: m?.available ?? true, capacity: m?.capacity ?? 3 };
    });
  }, [slots, date]);

  async function submit() {
    if (!selectedExpert || !selectedSlot) return;
    setMsg("");
    try {
      await api(`/bookings`, {
        method: "POST",
        body: JSON.stringify({
          beauty_expert_id: selectedExpert.id,
          starts_at: selectedSlot.starts_at,
          price: selectedExpert.base_price ?? 0,
        }),
      });
      setMsg("✅ Booking placed! We’ll confirm soon.");
      api(`/bookings/availability?beauty_expert_id=${selectedExpert.id}&date=${date}`)
        .then((res) => setSlots(res.slots || []))
        .catch(() => {});
    } catch (e) {
      setMsg(`⚠️ ${e?.data?.message || e.message}`);
    }
  }

  const reviews = selectedExpert ? reviewsByExpert[selectedExpert.id] || [] : [];

  /* -------------------------------- UI --------------------------------- */
  return (
    <div className="book-wrap">
      <header className="book-top">
        <button className="back" onClick={() => navigate(-1)} aria-label="Back">✕</button>
        <h1>Book Appointment</h1>
      </header>

      <section className="date-strip">
        <label htmlFor="date">Choose date</label>
        <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </section>

      <section className="slots">
        <h2>Available Slots</h2>
        <div className="grid">
          {localSlots.map((slot) => {
            const disabled = !slot.available;
            const active = selectedSlot?.starts_at === slot.starts_at;
            return (
              <button
                key={slot.starts_at}
                className={`slot ${active ? "active" : ""}`}
                disabled={disabled}
                onClick={() => setSelectedSlot(slot)}
                title={disabled ? `Full (${slot.count}/${slot.capacity})` : `${slot.count}/${slot.capacity} booked`}
              >
                <span>{slot.label}</span>
                <small>{slot.count}/{slot.capacity}</small>
              </button>
            );
          })}
        </div>
      </section>

      {/* Specialists grid (3 per row) */}
      <section className="experts">
        <h2>Choose Specialist</h2>
        {err && !experts.length ? (
          <div className="muted" style={{ padding: "10px 4px" }}>{err}</div>
        ) : (
          <div className="experts-grid">
            {experts.map((ex) => (
              <div
                key={ex.id}
                role="button"
                tabIndex={0}
                className={`expert-card ${selectedExpert?.id === ex.id ? "sel" : ""}`}
                onClick={() => setSelectedExpert(ex)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedExpert(ex)}
                title={`${ex.name} — ${ex.specialty}`}
              >
                <img
                  src={ex.avatar_path ? `${FILE_BASE}/${ex.avatar_path}` : "/placeholder-avatar.png"}
                  alt={ex.name}
                  loading="lazy"
                  decoding="async"
                  width="64"
                  height="64"
                />
                <div className="meta">
                  <b>{ex.name}</b>
                  <span>{ex.specialty}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="reviews">
        <h2>Client Reviews</h2>
        <ul>
          {(reviews ?? []).map((rv) => (
            <li key={rv.id}>
              <div className="stars" aria-label={`${rv.rating} stars`}>
                {"★".repeat(rv.rating)}{"☆".repeat(Math.max(0, 5 - rv.rating))}
              </div>
              <p>{rv.comment}</p>
            </li>
          ))}
          {!reviews?.length && <li className="muted">No reviews yet.</li>}
        </ul>
      </section>

      {msg && <div className="msg">{msg}</div>}

      <footer className="cta">
        <button className="book-btn" disabled={!selectedExpert || !selectedSlot} onClick={submit}>
          Book Appointment
        </button>
      </footer>
    </div>
  );
}
