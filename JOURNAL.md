# JOURNAL.md - Decision Journal

## 1. Prioritization

- Built the P0 loop first: submission form, persisted API, moderation dashboard, and approved-only public wall.
- Added the P1 embeddable widget because it is close to the product domain and helps the project feel like a real testimonial platform.
- Cut authentication, billing, multi-business support, and email notifications because the brief names them as non-goals.
- Cut live deployment and AI-powered features for now so the core flow stays understandable and reliable.

## 2. Key decisions

- **Decision:** Use two folders, `client` and `server`.
- **Options:** A single full-stack framework, or separate frontend and backend.
- **Why:** The assignment explicitly asks for React and Node.js. Separate folders make the boundary clear for reviewers and keep deployment options flexible.

- **Decision:** Use SQLite persisted to `server/data.sqlite` through `sql.js`.
- **Options:** Local JSON file, native SQLite package, hosted Supabase/Neon.
- **Why:** SQLite is a real database and simple for reviewers to run locally. `sql.js` avoids native module build issues on different machines.

- **Decision:** Keep the owner dashboard unprotected at `/dashboard`.
- **Options:** Add a password or session.
- **Why:** The brief explicitly says auth is a non-goal and a hardcoded/unprotected dashboard route is acceptable.

- **Decision:** Rejected testimonials remain stored but are filtered out of public APIs.
- **Options:** Delete rejected testimonials immediately.
- **Why:** Keeping them gives the owner an audit trail and makes status changes reversible if needed.

- **Decision:** Implement the widget as a script tag that fetches approved testimonials.
- **Options:** iframe embed.
- **Why:** A script tag gives simple accent-color customization and proves the API can support a third-party page.

## 3. Working with AI agents

- **Tools and models used:** Codex in the desktop app using GPT-5 for implementation, planning, and verification.
- **How I split the work:** I asked the agent to read the assignment files, create the two-folder project, implement the P0 loop, add the widget, and keep this journal updated. I kept scope decisions explicit so the result stays explainable.
- **Your agent setup:** `AGENTS.md` is included to document how I directed the coding agent for this assignment.
- **Your 3-5 most important prompts:**
- "now start this and create saprate two folder and complete the assigmet" - kicked off the implementation and established the folder requirement.
- "Read ASSIGNMENT.md and JOURNAL_TEMPLATE.md first" - handled by the agent from the attached files before coding.
- "Build P0 before optional features" - encoded as the main implementation priority.
- "Keep the journal updated as you work" - made the decision log part of the build instead of an afterthought.
- **At least one time AI was wrong:** The first environment assumption was that `node` and `npm` were on PATH. They were not, so I used the bundled Codex Node and pnpm paths instead.
- **Something you rejected:** I avoided a hosted database and auth flow because they would add setup burden without improving the required P0 test path.

## 4. Verification

- Installed server and client dependencies with the bundled pnpm runtime.
- Built the React client with Vite.
- Started the API locally and tested the API health endpoint.
- Tested the core API flow with HTTP requests: create testimonial, list pending, approve it, and list approved public testimonials.
- Tested that a rejected testimonial does not appear in the public approved-only endpoint.
- Still fragile: there is no auth, no production deployment config, and no automated test suite yet.

## 5. If I had 5 more hours

- Add Playwright tests for the complete browser flow.
- Deploy the frontend and backend to free hosting and document the live URLs.
- Add pagination and better moderation filters.
- Add an AI-assisted sentiment/tag field for approved testimonials.
- Improve widget customization options such as compact/grid layouts.
