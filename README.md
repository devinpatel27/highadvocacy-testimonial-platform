# HighAdvocacy Testimonial Platform

A small testimonial platform for the SDE-1 take-home assignment. Businesses can collect testimonials, review submissions, approve or reject them, and show approved testimonials on a public wall or embedded widget.

## What is Done

- Public testimonial submission form with name, email, company, text, rating, and optional photo URL.
- Node/Express API with persisted SQLite storage through `sql.js`.
- Moderation dashboard with pending, approved, and rejected states.
- Public wall that only shows approved testimonials.
- Duplicate submission guard for the same email and testimonial text.
- Embeddable widget served from `/embed.js`.
- Plain HTML widget demo at `/widget-demo/index.html`.

## What is Not Done

- Authentication is intentionally skipped because the brief allows an unprotected dashboard route.
- Live deployment is not included yet.
- The AI-powered stretch feature is not included.
- Pagination is limited to API-side `limit`; there is no page navigation UI yet.

## Run Locally

Install dependencies:

```bash
pnpm --dir server install
pnpm --dir client install
```

Start the API:

```bash
pnpm --dir server dev
```

Start the React app in a second terminal:

```bash
pnpm --dir client dev
```

Open the Vite URL, usually `http://localhost:5173`.

## Core Test Flow

1. Open `/` and submit a testimonial.
2. Open `/dashboard` and confirm it appears as `pending`.
3. Approve the testimonial.
4. Open `/wall` and confirm it appears publicly.
5. Reject another testimonial and confirm it never appears on `/wall`.

## Widget Demo

With the API running on port `4000`, open:

```text
http://localhost:5173/widget-demo/index.html
```

The embed code used by that page is:

```html
<div id="highadvocacy-wall"></div>
<script src="http://localhost:4000/embed.js" data-accent="#0f766e" data-mount="highadvocacy-wall"></script>
```

## Repository Structure

```text
client/   React + Vite frontend
server/   Express API and SQLite persistence
```
