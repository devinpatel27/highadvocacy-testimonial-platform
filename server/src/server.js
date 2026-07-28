import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import morgan from "morgan";
import initSqlJs from "sql.js";
import { z } from "zod";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const dbPath = process.env.DB_PATH || path.join(rootDir, "data.sqlite");
const clientDist = path.resolve(rootDir, "..", "client", "dist");
const port = Number(process.env.PORT || 4000);

const SQL = await initSqlJs();
const db = fs.existsSync(dbPath)
  ? new SQL.Database(fs.readFileSync(dbPath))
  : new SQL.Database();

db.run(`
  CREATE TABLE IF NOT EXISTS testimonials (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company TEXT NOT NULL,
    text TEXT NOT NULL,
    rating INTEGER NOT NULL,
    photo_url TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);
persist();

const submissionSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  company: z.string().trim().min(2).max(100),
  text: z.string().trim().min(20).max(1200),
  rating: z.coerce.number().int().min(1).max(5),
  photoUrl: z.string().trim().url().max(500).optional().or(z.literal(""))
});

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/testimonials", (req, res) => {
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Please check the form fields.", details: parsed.error.flatten() });
  }

  const input = parsed.data;
  const duplicate = db.exec(
    "SELECT id FROM testimonials WHERE lower(email) = lower(?) AND lower(text) = lower(?) LIMIT 1",
    [input.email, input.text]
  );

  if (duplicate[0]?.values?.length) {
    return res.status(409).json({ error: "This testimonial has already been submitted." });
  }

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  db.run(
    `INSERT INTO testimonials
      (id, name, email, company, text, rating, photo_url, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
    [id, input.name, input.email, input.company, input.text, input.rating, input.photoUrl || null, now, now]
  );
  persist();

  res.status(201).json({ testimonial: findById(id) });
});

app.get("/api/testimonials", (req, res) => {
  const status = ["pending", "approved", "rejected"].includes(req.query.status) ? req.query.status : null;
  const rows = listTestimonials(status);
  res.json({ testimonials: rows });
});

app.patch("/api/testimonials/:id/status", (req, res) => {
  const status = z.enum(["approved", "rejected", "pending"]).safeParse(req.body.status);
  if (!status.success) {
    return res.status(400).json({ error: "Status must be approved, rejected, or pending." });
  }

  db.run("UPDATE testimonials SET status = ?, updated_at = ? WHERE id = ?", [
    status.data,
    new Date().toISOString(),
    req.params.id
  ]);
  persist();

  const testimonial = findById(req.params.id);
  if (!testimonial) {
    return res.status(404).json({ error: "Testimonial not found." });
  }

  res.json({ testimonial });
});

app.get("/api/public/testimonials", (req, res) => {
  const limit = Math.min(Number(req.query.limit || 12), 50);
  res.json({ testimonials: listTestimonials("approved", limit) });
});

app.get("/embed.js", (_req, res) => {
  res.type("application/javascript").send(widgetScript);
});

if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => res.sendFile(path.join(clientDist, "index.html")));
}

app.listen(port, () => {
  console.log(`HighAdvocacy API running on http://localhost:${port}`);
});

function persist() {
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
}

function listTestimonials(status, limit = 100) {
  const where = status ? "WHERE status = ?" : "";
  const result = db.exec(
    `SELECT id, name, email, company, text, rating, photo_url, status, created_at, updated_at
     FROM testimonials ${where}
     ORDER BY created_at DESC LIMIT ?`,
    status ? [status, limit] : [limit]
  );

  return (result[0]?.values || []).map(rowFromSql);
}

function findById(id) {
  const result = db.exec(
    `SELECT id, name, email, company, text, rating, photo_url, status, created_at, updated_at
     FROM testimonials WHERE id = ? LIMIT 1`,
    [id]
  );
  return result[0]?.values?.[0] ? rowFromSql(result[0].values[0]) : null;
}

function rowFromSql(row) {
  return {
    id: row[0],
    name: row[1],
    email: row[2],
    company: row[3],
    text: row[4],
    rating: row[5],
    photoUrl: row[6],
    status: row[7],
    createdAt: row[8],
    updatedAt: row[9]
  };
}

const widgetScript = `
(function () {
  var script = document.currentScript;
  var mountId = script.getAttribute("data-mount") || "highadvocacy-wall";
  var accent = script.getAttribute("data-accent") || "#2563eb";
  var api = script.getAttribute("data-api") || script.src.replace(/\\/embed\\.js.*$/, "");
  var mount = document.getElementById(mountId);
  if (!mount) return;
  mount.innerHTML = '<p style="font-family:Inter,Arial,sans-serif;color:#64748b">Loading testimonials...</p>';
  fetch(api + "/api/public/testimonials?limit=9")
    .then(function (response) { return response.json(); })
    .then(function (data) {
      var items = data.testimonials || [];
      if (!items.length) {
        mount.innerHTML = '<p style="font-family:Inter,Arial,sans-serif;color:#64748b">No testimonials yet.</p>';
        return;
      }
      mount.innerHTML = '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px;font-family:Inter,Arial,sans-serif">' +
        items.map(function (item) {
          return '<article style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;background:#fff;box-shadow:0 8px 24px rgba(15,23,42,.08)">' +
            '<div style="color:' + accent + ';font-size:15px;margin-bottom:10px">' + '★'.repeat(item.rating) + '</div>' +
            '<p style="margin:0 0 14px;color:#334155;line-height:1.5">“' + escapeHtml(item.text) + '”</p>' +
            '<strong style="display:block;color:#0f172a">' + escapeHtml(item.name) + '</strong>' +
            '<span style="color:#64748b;font-size:13px">' + escapeHtml(item.company) + '</span>' +
          '</article>';
        }).join("") +
      '</div>';
    })
    .catch(function () {
      mount.innerHTML = '<p style="font-family:Inter,Arial,sans-serif;color:#b91c1c">Testimonials could not be loaded.</p>';
    });
  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char];
    });
  }
})();`;
