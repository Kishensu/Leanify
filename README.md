# Leanify

An operational excellence platform combining a process library, KPI dashboards, SPC control towers, and an AI Lean Six Sigma expert — organized around the full APQC Process Classification Framework (PCF) v8.0 taxonomy (2,017 nodes: 13 categories, 74 groups, 362 processes, 1,353 activities, 215 tasks).

## Stack

- Next.js 14 (App Router) + TypeScript
- Postgres via Prisma (local, Docker — see note below)
- Tailwind CSS

## Local setup

1. **Start Postgres** (a container named `leanify-postgres` is already running locally on port 5432 if you're continuing this session; otherwise):
   ```bash
   docker run -d --name leanify-postgres \
     -e POSTGRES_USER=leanify -e POSTGRES_PASSWORD=leanify -e POSTGRES_DB=leanify \
     -p 5432:5432 postgres:16-alpine
   ```
2. **Install dependencies**: `npm install`
3. **Set up the database** (migrate + import taxonomy + seed processes, activities/tasks, LSS tools, and demo BPMN diagrams):
   ```bash
   npm run db:setup
   ```
   Each step is idempotent — safe to re-run any time.
4. **Run the app**: `npm run dev` (defaults to port 3000; pass `PORT=xxxx npm run dev` if that's taken)

## Data model notes

- `apqc-taxonomy-full.csv` is the read-only source of truth for the `taxonomy` table — re-run `npm run db:import-taxonomy` if it changes.
- `npm run db:seed` regenerates `processes`, `kpi_metrics` (+ `kpi_metric_readings`), `control_tower_metrics` (+ `control_metric_readings`), and `reaction_plans` deterministically (seeded RNG keyed by each process's stable `source_pcf_id`, not its row id — that distinction matters, see below) — re-running never duplicates or drifts the data.
- Process status (`in control` / `out of control` / `not yet monitored`) is **always computed** from `control_tower_metrics` at query time — never stored. This is process-level and stays binary; see the three-state metric status below for the finer-grained Control Tower view.
- Control-tower backfill only ever targets **seeded** processes (`source_pcf_id` set) — a custom process created through the Add Process wizard gets control data only if you fill in the Configure step yourself, same as before. (Caught and fixed a bug during this round where a broader query briefly fabricated control metrics for a real custom process — worth knowing if you're extending `seedControlTowerData()`.)
- ~15% of seeded processes land in **breach**, ~20% in **watch** — see the three-state model below.

## Dashboard (merged KPI + Control tower)

- Single sidebar entry, **Dashboard** (`/dashboard`), with two tabs — **Process Performance** and **Control Tower** — sharing one process selector and URL (`?process=<id>&tab=performance|control-tower`). The old separate `/kpi` and `/control-tower` routes are gone; Library row clicks and the Add Process wizard's post-create redirect both point at `/dashboard` now.
- **Three-state metric status** (`src/lib/status.ts`, `computeMetricStatus`): `breach` (outside hard `ucl`/`lcl`), `watch` (inside the hard limits but outside the tighter `warning_ucl`/`warning_lcl` band), `in_control` otherwise. The process-level pill stays the original binary computation — **watch never downgrades it**, only breach does.
- A control metric can optionally link to a specific `process_activity` (`process_activity_id`) rather than monitoring the whole process — when set, the Control Tower tab prefixes the metric with that activity's APQC code (e.g. `7.1.2.8 — Exception-free rate`). Only meaningful for the 6 activity-populated demo processes; roughly half of their eligible metrics got linked during seeding.
- `control_metric_readings` / `kpi_metric_readings` back the SPC and trend charts — 8-12 and 6-8 points respectively, generated as a random walk with drift toward the metric's current value (`generateWalk()` in the seed script) so history has real variance, not a flat line.
- `reaction_plans.steps` is now a JSON array of `{ text, automated }` (was a plain string array) — the Control Tower tab's automation badge (`{n} / {total} Steps Automated`) is computed live from it, never stored separately. A reaction plan now hangs off a direct `control_tower_metric_id` FK instead of `(process_id, metric_name)` string-matching.
- Charts are small hand-rolled SVG components (`src/components/charts/`) rather than a charting library — kept the dependency footprint down and made it trivial to draw UCL/LCL/warning reference lines exactly where the design system wants them.

## Add Process classification

Step 2 of the Add Process wizard ranks APQC groups against your description using a **local TF-IDF cosine-similarity search** over the imported taxonomy (`src/lib/classify.ts`) — no external LLM API call. This was a deliberate substitution: no LLM API key was available in this environment. It's a genuine text-similarity ranking (not canned), and does well on clearly-worded descriptions; ambiguous ones may put the right group in the "alternate" slot rather than first. Swap in a real LLM call there if/when an API key is available — the surrounding wizard UI doesn't change.

The LSS expert chat similarly uses a rule-based responder (`src/app/api/chat/route.ts`) that pulls real KPI/control-tower data for the scoped process rather than calling an LLM.

## Process activities & BPMN process maps

- `process_activities` holds each process's activity/task breakdown, editable via the Add Process wizard's step 4 or the standalone `/processes/[id]/activities` page. Each item optionally links to a real APQC `activity`/`task` taxonomy node (autocomplete, `src/app/api/taxonomy/children`) or is free-text/custom.
- Every activity has an **`element_type`** (`user_task`, `system_task`, `decision_task`, `approval_gateway`, `parallel_gateway`, `timer_event`, `manual_task`, `start_event`, `end_event`) that drives which real BPMN element gets generated — see the mapping table and `createBpmnElement()` in `src/lib/bpmn.ts`. `approval_gateway` nodes fork into two named branches via `branch_labels`; any downstream node sets `branch_of`/`branch_label` to say which branch it continues (`branch_of` null just continues the current branch positionally). Multiple `end_event`s are fully supported — a branching process legitimately has more than one outcome.
- **`buildFlow()`** in `src/lib/bpmn.ts` is the structure step: it walks activities in `sequence_order`, tracking one "lane" (open chain) per branch. A node with `branch_of` starts a new lane off that gateway; a plain node continues whichever lane is currently active, and if that lane already dead-ended at an `end_event` (which can't have outgoing flows), the algorithm falls back to the most recently opened still-open lane — this is what lets a short "rejected" branch hand control back to the still-open "approved" branch's next step. Validated against the exact worked example (`Select suppliers and develop/maintain contracts`, 4.2.3) with unit-level edge assertions before it was wired into the app.
- `element_type: decision_task` sets a real `camunda:decisionRef` attribute (via the `camunda-bpmn-moddle` extension registered with `bpmn-moddle`) — functionally meaningful in a real Camunda deploy, not cosmetic. `user_task` similarly sets `camunda:candidateGroups` from `approver_role`.
- The seed script (`scripts/seed-processes.ts`) picks the **5 seeded processes with the richest real activity breakdowns** (all `user_task`, linear) from the actual taxonomy tree, plus one **hand-authored branching demo** — "Select suppliers and develop/maintain contracts" (4.2.3) — exercising every element type except `parallel_gateway` (deliberately deferred: a true concurrent-fork-and-rejoin needs a `joins_at` concept the schema doesn't have yet). All 6 get their BPMN diagrams pre-generated and cached so "Generate process map" feels instant on first use.
- **"Generate process map"** in the LSS expert chat (`src/app/api/process-map/route.ts`, `src/lib/bpmn.ts`):
  1. Builds the semantic flow with `bpmn-moddle` — no hand-built XML strings — mapping each activity's `element_type` to its real BPMN element.
  2. Lays it out with `bpmn-auto-layout` to get valid diagram positioning (`bpmndi:BPMNDiagram`).
  3. Caches the result in `process_diagrams`, keyed by a hash of the full activity set (including branching/type fields) — edits to activities invalidate the cache automatically.
  4. Renders with `bpmn-js`'s `NavigatedViewer` (pan/zoom, read-only) in a dedicated wide chat bubble (`src/components/BpmnDiagram.tsx`), with **fullscreen** (expand icon, Escape/✕ to close), **edit mode** (lazy-loads `bpmn-js/lib/Modeler` only when triggered, saves back to `process_diagrams` and sets `edited_by_user`), and a **Download .bpmn** button (importable straight into Camunda Modeler or Fluxnova).
  5. A manual edit is never silently clobbered: if activities change after an edit, a plain regenerate returns `409 manual_edit_conflict` with the existing edited diagram rather than overwriting it — `force: true` is required to proceed.
- **This is a heuristic, not an LLM call** — same reasoning as the classifier: no API key was available. `buildFlow()` implements the same flow semantics an LLM would be prompted to produce (linear by default, forking at gateways, never inventing activities), just deterministically. The JSON→XML→layout→render pipeline itself is exactly as specified and is real, not mocked.
- The tool card is **disabled** when no process is scoped, or when the scoped process has zero activities; attempting generation on a process with none returns a 422 with a link straight into that process's activity editor rather than falling back to a generic guess.
- **Known bug fixed:** plain `bpmn-moddle` does not back-populate a flow node's `incoming`/`outgoing` reference arrays just because a `sequenceFlow`'s `sourceRef`/`targetRef` points at it — `bpmn-auto-layout`'s graph traversal reads exactly those arrays, so without this every node looked like an unconnected root and diagrams rendered with shapes but no arrows. Fixed by populating them by hand after building the flow elements (`generateBpmnXml()` in `src/lib/bpmn.ts`), plus build-time and post-layout assertions (`sequenceFlow` count vs `BPMNEdge` count) that fail generation loudly rather than caching a broken diagram.

## Local dev database — not Supabase

This build uses a local Postgres container (via Prisma) rather than Supabase, per a setup decision made when the project had no Supabase account access. Nothing here is Supabase-specific, so pointing `DATABASE_URL` in `.env` at a real Supabase Postgres connection string would work as a drop-in swap if you later provision one.
