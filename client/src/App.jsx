import { Check, ExternalLink, Inbox, Send, Star, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "";

export default function App() {
  const [route, setRoute] = useState(window.location.pathname);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, "", path);
    setRoute(path);
  };

  return (
    <main>
      <nav className="topbar">
        <button className="brand" onClick={() => navigate("/")}>HighAdvocacy</button>
        <div>
          <button onClick={() => navigate("/")}>Submit</button>
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/wall")}>Wall</button>
        </div>
      </nav>
      {route === "/dashboard" ? <Dashboard /> : route === "/wall" ? <Wall /> : <Submit />}
    </main>
  );
}

function Submit() {
  const [form, setForm] = useState({ name: "", email: "", company: "", text: "", rating: 5, photoUrl: "" });
  const [state, setState] = useState({ status: "idle", message: "" });

  async function onSubmit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });
    const response = await fetch(`${API_URL}/api/testimonials`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await response.json();
    if (!response.ok) {
      setState({ status: "error", message: data.error || "Could not submit testimonial." });
      return;
    }
    setForm({ name: "", email: "", company: "", text: "", rating: 5, photoUrl: "" });
    setState({ status: "success", message: "Thanks. Your testimonial is waiting for review." });
  }

  return (
    <section className="hero">
      <div className="hero-copy">
        <p className="eyebrow">Customer submission</p>
        <h1>Collect proof that feels human.</h1>
        <p>Invite customers to share a short quote. New testimonials stay private until the owner approves them.</p>
      </div>
      <form className="panel form" onSubmit={onSubmit}>
        <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required minLength="2" /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
        <label>Company<input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} required minLength="2" /></label>
        <label>Rating<StarPicker value={form.rating} onChange={(rating) => setForm({ ...form, rating })} /></label>
        <label>Photo URL optional<input value={form.photoUrl} onChange={(e) => setForm({ ...form, photoUrl: e.target.value })} placeholder="https://..." /></label>
        <label>Testimonial<textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} required minLength="20" rows="5" /></label>
        {state.message && <p className={`notice ${state.status}`}>{state.message}</p>}
        <button className="primary" disabled={state.status === "loading"}><Send size={18} /> Submit testimonial</button>
      </form>
    </section>
  );
}

function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const counts = useMemo(() => ({
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length
  }), [items]);

  async function load() {
    setLoading(true);
    const response = await fetch(`${API_URL}/api/testimonials`);
    const data = await response.json();
    setItems(data.testimonials || []);
    setLoading(false);
  }

  async function setStatus(id, status) {
    const response = await fetch(`${API_URL}/api/testimonials/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    const data = await response.json();
    if (response.ok) {
      setItems((current) => current.map((item) => item.id === id ? data.testimonial : item));
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <section className="workspace">
      <header className="section-heading">
        <div><p className="eyebrow">Owner dashboard</p><h1>Moderate testimonials</h1></div>
        <button onClick={load}>Refresh</button>
      </header>
      <div className="stats">
        <Stat label="Pending" value={counts.pending} />
        <Stat label="Approved" value={counts.approved} />
        <Stat label="Rejected" value={counts.rejected} />
      </div>
      {loading ? <Empty text="Loading submissions..." /> : items.length === 0 ? <Empty text="No submissions yet." /> : (
        <div className="list">
          {items.map((item) => (
            <article className="submission" key={item.id}>
              <div>
                <Stars rating={item.rating} />
                <p>“{item.text}”</p>
                <strong>{item.name}</strong><span>{item.company} · {item.email}</span>
              </div>
              <div className="actions">
                <span className={`badge ${item.status}`}>{item.status}</span>
                <button title="Approve" onClick={() => setStatus(item.id, "approved")}><Check size={18} /></button>
                <button title="Reject" onClick={() => setStatus(item.id, "rejected")}><X size={18} /></button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

function Wall() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/api/public/testimonials`)
      .then((response) => response.json())
      .then((data) => setItems(data.testimonials || []))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="wall">
      <header className="section-heading">
        <div><p className="eyebrow">Public wall</p><h1>Loved by customers</h1></div>
        <a className="link-button" href="/widget-demo/index.html" target="_blank" rel="noreferrer"><ExternalLink size={18} /> Widget demo</a>
      </header>
      {loading ? <Empty text="Loading approved testimonials..." /> : items.length === 0 ? <Empty text="No approved testimonials yet." /> : (
        <div className="grid">
          {items.map((item) => <TestimonialCard key={item.id} item={item} />)}
        </div>
      )}
    </section>
  );
}

function TestimonialCard({ item }) {
  return (
    <article className="card">
      <Stars rating={item.rating} />
      <p>“{item.text}”</p>
      <div className="person">
        {item.photoUrl ? <img src={item.photoUrl} alt="" /> : <span>{item.name.slice(0, 1)}</span>}
        <div><strong>{item.name}</strong><small>{item.company}</small></div>
      </div>
    </article>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="stars picker">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button type="button" key={rating} onClick={() => onChange(rating)} title={`${rating} stars`}>
          <Star size={22} fill={rating <= value ? "currentColor" : "none"} />
        </button>
      ))}
    </div>
  );
}

function Stars({ rating }) {
  return <div className="stars">{Array.from({ length: rating }, (_, index) => <Star key={index} size={16} fill="currentColor" />)}</div>;
}

function Stat({ label, value }) {
  return <div className="stat"><span>{label}</span><strong>{value}</strong></div>;
}

function Empty({ text }) {
  return <div className="empty"><Inbox size={28} /><p>{text}</p></div>;
}
