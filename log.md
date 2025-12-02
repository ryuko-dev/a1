# Action Log

This file records actions performed so we do not repeat them unintentionally. Please run `npm run show-log` to view this log quickly.

2025-12-02 14:55 UTC — Initial run
- Ran `npm install` to install dependencies.
- Started Next.js dev server with `npm run dev`.

2025-12-02 15:05 UTC — Audit
- Ran `npm audit` and saved results to `audit.json`.
- Found 1 high severity vulnerability (package `xlsx@^0.18.5`).

2025-12-02 15:20 UTC — Decision
- Discussed mitigation options (replace `xlsx`, use CSV, or accept risk).
- Maintainer chose to keep `xlsx` for now (option 3: accept risk).

2025-12-02 15:30 UTC — Documentation
- Created `SECURITY.md` documenting the vulnerability and mitigation guidance.
- Added `log.md` (this file) to track actions.
- Added `npm` script `show-log` to `package.json` so the log can be displayed with `npm run show-log`.

Notes / Next steps:
- If you want to remove the vulnerable dependency later, consider replacing `xlsx` with `exceljs` (writer-only) or exporting CSV.
- Add an automated `npm audit` job to CI to detect fixed releases.

Instructions for reviewers:
- Run `npm run show-log` before interacting with the project or requesting changes; this file documents prior decisions.

2025-12-02 16:10 UTC — Edit Project modal fix
- Updated `src/components/allocation-grid.tsx` so the Positions by Month table in the Edit Project popup:
	- Always displays and stores values in the project's `allocationMode` units (percent or days).
	- When saving a project in `days` mode, the Position objects now persist both `percentage` and `days` fields so the modal can show days regardless of the main page view filter.
	- When loading a project for editing, if `days` are not present the code converts stored `percentage` back to days for display using the month's working days.
	- This decouples the modal's table from the main page `View` filter.


2025-12-02 20:40 UTC — Azure storage investigation & safety fixes
- Investigated reports of disappearing data in Azure-backed storage. Audit and code review revealed risky "single-blob" upserts and multiple endpoints that could blindly Replace the entire main blob.
- Immediate mitigations applied:
	- Guarded debug/test write endpoints so they return `403` unless `ALLOW_DEBUG_WRITES=true` (files edited: `src/app/api/debug/*`, `src/app/api/test/*`).
	- Added write-audit logging: incoming POSTs to `/api/azure/enhanced/main` append a JSON line to `azure-writes.log` (route changed: `src/app/api/azure/enhanced/main/route.ts`). Each line includes a timestamp, route, incoming collection counts and request headers.
	- Implemented server-side safe-merge behavior in `src/lib/azure-enhanced.ts#setMainData`:
		- Reads existing main data, merges collections by `id`, treats incoming empty arrays as NO-OP, and upserts the merged blob to avoid accidental deletions.
	- Added extra safeguards in client/server save paths to avoid posting entirely-empty blobs when not necessary.

- Runtime actions & verification:
	- Inspected local processes and ports, killed lingering `node` processes that held port 3000, and restarted the Next dev server multiple times.
	- Tailed `azure-writes.log` and confirmed many recent POSTs; several were partial writes (e.g., `projects:0, users:0, entities:2`) which likely caused previous data loss prior to the merge fix.
	- Started the dev server in foreground to stream logs and attempt live verification; observed the server start/ready messages and the write-audit entries. Performed GET attempts to `/api/azure/enhanced/main` while the server was active.

Next recommended steps:
	- Perform two verification POSTs while the dev server is running:
		1. Partial write (e.g. `{"entities":[...]}`) — expect server-side merge to preserve other collections.
		2. Empty-array write for `projects` (e.g. `{"projects":[]}`) — expect NO-OP (no deletion).
	- Plan a medium-term migration away from a single-global JSON blob to per-collection entities (or implement optimistic concurrency with ETags) to remove the remaining race/last-writer-wins risk.

Notes:
	- `azure-writes.log` at repository root contains JSONL audit entries and is a key source of evidence for which clients sent which payloads.
	- Keep debug/test write endpoints guarded by default in dev to avoid accidental destructive writes.

