# Dev log

Newest entry first. Each entry: what was done, what was learned, what's next. Keep it short.

---

## 2026-11-03 · Plan for the next phases
- **Done:** Committed Phases 2 and 3 separately. Wrote the detailed plan for Phases 4–7 (plus 4.5 browser tests and 2b research) in ROADMAP.md,
  with goals, tasks, done-when criteria, sizes, and the decisions waiting for the owner.
- **Next:** Phase 4, the entity page and media.

## 2026-11-03 · Phase 3: book graph view
- **Done:** Ported the prototype's book screen to React on real data. React Router 8 routes `/` and `/book/:slug`; components Shell,
  CantoStrip (slider, keyboard, tooltips), GraphCanvas (Cytoscape behind a React boundary) and EntityPreview. Pure, tested `graphElements` (shapes,
  gilt for new, hollow context, ego mode for Phase 4) and `thumb` (Commons serves only standard widths: 120/250/330/500/960/1280/1920).
  Legend filters by kind, segmented depth filter, search marks matches (Enter selects), "show everything" without moving progress.
  33 tests; taste-skill lint 0 and inspector 0 FAIL on the production build.
- **Learned:** Inline grid columns beat a stylesheet media query; the strip passes them as a CSS variable. A map with few nodes zooms in
  too far, so zoom is capped at 1.1. React 19 lint rules forbid setState in effects, so the book route remounts per slug instead.
- **Next:** Phase 4, the entity page with media (Look, Listen and read, To know them by, Connections), from design/prototype/entity.html.

## 2026-11-03 · Phase 2: tools, skills, first research batches
- **Done:** Wrote the helper scripts (wikidata, commons, check-links, merge-batches) with tests, and the `/build-graph` and `/expand`
  skills. The owner approved a 59-entity cast for the Comedy. Ran 2 of the research batches (Inferno I–VII, 19 entities) and merged
  them: 19 + 17 nodes, 56 edges, 184 links, all live. 27 edges to cast not yet researched wait in `.work/divine-comedy/pending-edges.json`.
- **Cost:** batch 1 used 194k tokens (9 entities, 80 tool calls, 18 min); batch 2 used 180k (10 entities, 60 calls, 13 min). About 20k per entity.
- **Learned:** `role` and context `why` lines leak spoilers ("Dante's guide through Paradise" at Canto V). Rule added to DATA_MODEL,
  GENERATION and the skill, and four lines fixed. Re-running a merge would undo hand fixes, so merged batches are now archived.
- **Next:** the owner decides the depth and size of the remaining 40-entity batches.

## 2026-11-03 · Phase 1: foundation
- **Done:** Scaffolded Vite 8 + React 19 + TS 6.0 (strict) + Tailwind 4 + Vitest 5 + ESLint. Wrote the Zod schemas, the graph rules,
  spoiler visibility, a library loader, the validator CLI, and the Vite-plugin API (list, bundle, PUT progress). Added a hand-written
  Divine Comedy fixture for Inferno I–V (10 + 7 nodes, 21 edges, Wikidata ids looked up, 45 URLs checked live) and a minimal page.
  20 tests pass; typecheck, lint and build are clean; the API was exercised live.
- **Learned:** Wikidata rate-limits quick bursts (back off and retry). Limbo has no obvious Wikidata item, so it's left without one.
  `Map.groupBy` needs lib ES2024.
- **Next:** Phase 2. Helper scripts (wikidata, commons, check-links), then the `/build-graph` skill, then the full Comedy.

## 2026-11-03 · Visual design with Taste Skill
- **Done:** Ran the skill's app-screen run. Dealt *true-black-flat* (seed 1898414268), chose gilt as the face and the
  canto strip as the signature element, and built `design/prototype/` (library, book graph, entity) with real Doré, Botticelli, Michelino
  and mosaic images from Commons (credits in `assets/credits.json`) and verified sources. Three inspector rounds took it to 0 FAIL at
  1440/768/390, with one defended WARN (the serif greeting). Logged D-011 and D-012, and rewrote DESIGN.md.
- **Learned:** Cytoscape hides labels under `min-zoomed-font-size` once a map is fitted to a large panel, so don't set it.
  Opening a map pre-dimmed around a selection makes it look dead.
- **Next:** Phase 1 (scaffold, schema, validator), then port the prototype's tokens and components in Phases 3–4.

## 2026-11-02 · Phase 0: framework
- **Done:** Clarified intent with the owner. Claude Code generates the graphs, the tool is a local web app, spoiler protection
  follows reading progress, and the content language is chosen per book. Wrote CLAUDE.md and the docs/ framework, and logged decisions D-001 to D-009.
- **Learned:** The defining constraint is the depth-2 limit. It shapes the schema, the validator, the generation budget and the visuals.
- **Also:** Moved Taste Skill (`design-taste-frontend` v2.1.5) into `.claude/skills/` and gitignored it (D-010).
- **Next:** Phase 1. Scaffold the app, write the Zod schemas and the validator, and build a hand-written *Divine Comedy* fixture (Inferno I–V).
