# Decision log

Short, append-only records of non-obvious choices. Format: context, decision, consequences.
To reverse a decision, add a new entry that supersedes the old one. Don't edit history.

---

### D-001 · Claude Code is the generation engine (2026-11-02)
**Context:** Graphs need web research, source verification and judgment. The options were the Claude API from the app,
or Claude Code in the terminal.
**Decision:** Generation runs as Claude Code skills inside this repo. The app only displays data.
**Consequences:** No API key and no per-graph cost beyond the owner's subscription. The pipeline is plain markdown
(GENERATION.md plus skills), so it is easy to improve. An in-app button can later invoke `claude -p` headless.

### D-002 · Local web app, data as JSON files in git (2026-11-02)
**Context:** It is a single-user, personal tool. Graphs must persist once created.
**Decision:** A Vite + React app served locally. The library is JSON files under `library/`. There is no database.
**Consequences:** Graphs are versioned, diffable and hand-repairable, and Claude can read and write them directly.
Scale limits (thousands of books) are irrelevant for this use.

### D-003 · Cytoscape.js for graph rendering (2026-11-02)
**Context:** The candidates were Cytoscape.js, Sigma.js + Graphology (WebGL), react-force-graph (d3-force/three.js), and raw D3.
**Decision:** Cytoscape.js with `cytoscape-fcose` and the built-in concentric layout.
**Consequences:** It has strong styling (image-filled nodes, per-type styles), deterministic layered layouts, and a selector-based
API for filtering and highlighting. Our graphs (≤ ~300 nodes) don't need WebGL. Revisit Sigma if performance suffers.

### D-004 · Zod schemas as the single source of truth (2026-11-02)
**Decision:** `src/schema/` defines all data shapes. The validator CLI and the app both parse with them. DATA_MODEL.md documents them.
**Consequences:** Generated data that drifts from the schema fails loudly at validation time, not in the UI.

### D-005 · Global entity registry with Wikidata ids (2026-11-02)
**Context:** The same entities (Florence, Aristotle) recur across books.
**Decision:** Book-independent facts live in `library/entities/<id>.json`, anchored by `wikidataId`. Book-specific facts
live in the book's `graph.json`.
**Consequences:** It enables "also appears in", and it avoids duplicate research. Global text must be plot-free (see D-007).

### D-006 · Hard depth limit of 2 (2026-11-02)
**Context:** The owner's core need is bounded curiosity: "only one level deeper".
**Decision:** Depth 0 is the book, depth 1 is what's in the book, and depth 2 is context. Depth-2 nodes are leaves. The validator enforces this.
**Consequences:** Some interesting connections are deliberately left out. This is the feature, not a bug.

### D-007 · Section-based spoiler model (2026-11-02)
**Context:** The owner wants spoiler protection that follows reading progress.
**Decision:** Each book defines ordered `sections`. In-book notes, edges and book-specific media carry a `section`. Depth-1 nodes
carry a `firstSection`. Depth-2 nodes inherit visibility from their parents. Global summaries must be plot-free.
**Consequences:** Generation has to do more work (it must tag everything). Visibility is a pure, testable function.

### D-008 · Content language chosen per book (2026-11-02)
**Decision:** `book.language` sets the generation language. Entity text fields are language maps, so a shared entity can carry
several languages.

### D-009 · Link and embed media, never download it (2026-11-02)
**Decision:** Media is referenced by URL and embedded where the platform allows it. Inline images must be openly licensed and carry attribution.
**Consequences:** The repo stays small and legally clean. Links can rot, so we need `check-links` and `/refresh-sources`.

### D-010 · Taste Skill for visual design, project-local and gitignored (2026-11-02)
**Context:** The owner wants the design to stand out, and installed Taste Skill v2.1.5 (Leonxlnx/taste-skill, MIT).
**Decision:** The skill lives in `.claude/skills/design-taste-frontend/` (project scope only; the user-wide plugin was removed)
and is gitignored rather than vendored.
**Consequences:** It's used for all UI work in Phase 3+. A fresh clone must reinstall it (steps in CLAUDE.md). The version is
whatever was copied in, so update it by re-copying.

### D-011 · Visual direction: true-black, one gilt hue, types as shapes (2026-11-03)
**Context:** The first DESIGN.md draft had a warm dark theme with eight per-type colours. Taste Skill deals researched
app styles, and it bans rainbow palettes and cream-and-gold "assistant" looks.
**Decision:** Adopt the dealt *true-black-flat* style. The only hue is illuminator's gilt (#e0b04f), meaning "where you are".
Entity types are encoded by node shape, and context nodes are hollow. The signature element is the 100-canto strip, which doubles as the spoiler control.
**Consequences:** It supersedes the colour table in the old DESIGN.md. The graph stays legible with one hue, and the pictures carry the mood.

### D-012 · A static prototype is the design reference (2026-11-03)
**Decision:** `design/prototype/` (plain HTML, CSS and JS, with Cytoscape from cdnjs and real Commons artworks) is the visual reference for
Phases 3–4. The React app ports its tokens and components rather than redesigning them.
**Consequences:** The design was verified in a real browser (0 FAIL at 1440/768/390) before any app code exists.
Its sample data (two finished books, reading progress, the edition) must not leak into `library/`.

### D-013 · Toolchain pins (2026-11-03)
**Context:** TypeScript 7 (the native compiler) is current, but typescript-eslint 8.72 supports only TypeScript <6.1.
**Decision:** Pin TypeScript to 6.0.x. Everything else is on the latest release at scaffold time: Vite 8, React 19.3,
Zod 4, Vitest 5, Tailwind 4 (tokens in `@theme`, taken from the prototype). Phase 1 uses no router. React Router
arrives with the real screens in Phase 3.
**Consequences:** Revisit the pin when typescript-eslint supports TypeScript 7.

### D-014 · Validation lives in shared pure code (2026-11-03)
**Decision:** Graph rules (`src/lib/rules.ts`) and spoiler visibility (`src/lib/visibility.ts`) are pure functions. The CLI
validator, the dev-server API and the tests all call the same code. The API refuses to serve a book that fails validation (422 with the issues).
**Consequences:** A broken generation can never reach the UI silently, and every rule has a unit test with a failing case.

### D-015 · The whole-book map is a reading spiral, not concentric rings (2026-11-03)
**Context:** The concentric layout put the book cover at the centre with a spoke to every figure, so the centre carried no information
and context leaves landed far from their parents.
**Decision:** `src/lib/constellation.ts` places the two best-connected figures (the companions) at the centre and everyone else on an
elliptical Archimedean spiral in reading order, so the map grows outward as you read. Each context leaf orbits its parent. The layout is
pure and deterministic, and tests assert no overlaps. The book node and its spokes are gone. The ego graph keeps concentric rings around its focus.
**Consequences:** The same visible set always gets the same positions. The rail card now opens only on a choice, and the choice lives in the URL (`?e=virgil`).

### D-016 · Entity page layout: a rail for figures, none for context (2026-11-03)
**Context:** The prototype pairs a main column with a rail (notes, then the ego graph), stretched so both end level. On real data the two
columns rarely match: a context entry has no notes, and a figure seen with "show everything" has notes across the whole poem.
**Decision:** A depth-1 page keeps the rail as one panel as tall as the main column, its content sticky. A depth-2 page has no rail; its
Connections close the page at full width. Section labels on the entity page name the part ("Canto XVII, Paradiso"), because labels repeat
across canticles. Connections are also listed as sentences (the first 8, the rest folded) because the canvas is invisible to screen readers.
**Consequences:** Pages inspect clean at the reader's position. With "show everything", a figure like Dante has a rail longer than its main
column, and the inspector warns about it (ragged-row). That length is real content, so the warning stays.

### D-017 · Browser tests: Playwright on the installed Chrome, against a copy of the library (2026-11-03)
**Decision:** `npm run e2e` runs `@playwright/test` with `channel: 'chrome'` (no browser download) against the production build.
`scripts/e2e-server.ts` copies `library/` to one fixed temp folder (cleared at each start) and serves it through `READGRAPH_LIBRARY`,
which `src/server/library.ts` honours. One worker, and every test resets the position to Inferno I through the API.
The tests read the map through Cytoscape's own `_cyreg` property on its container, rather than adding a test hook to the app.
**Consequences:** The owner's reading position is never touched (checked by hashing `progress.json` around a run). `_cyreg` is
undocumented, so a Cytoscape upgrade may break the map tests. Fix them there, not in the app.
