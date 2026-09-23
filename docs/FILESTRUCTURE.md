# File Structure

- `AGENTS.md` — repository instructions and document reading order.
- `README.md` — install, run, verify, and protocol guide.
- `package.json` / `package-lock.json` — Node runtime manifest and reproducible dependency lock.
- `server.js` — static HTTP host and WebSocket session/message router.
- `public/` — polished browser client (`index.html`, `styles.css`, `app.js`).
- `test/server.test.js` — WebSocket protocol integration tests.
- `docs/` — docs-first control plane.
  - `CURRENT_TASK.md` — one active bounded task or no active task.
  - `TASK_WORKFLOW.md` and `TASK_IDS.md` — task lifecycle and identity register.
  - `PROJECT_BRIEF.md` — active product direction.
  - `CURRENT_STATUS.md` — verified repository state and next work.
  - `SYSTEMDOC.md` — implemented system behavior.
  - `JOURNAL.md` — append-only project record.
  - `finished/` — completed task records.
  - `concepts_sandbox/` — non-authoritative source and exploratory material.