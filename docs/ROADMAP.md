# Roadmap

Tick tasks as they are completed and log them in DEVLOG.md. The first unchecked task in the current phase is "next".

**Current phase: 5, Library and cross-book.** Phases 4 and 4.5 are done (2026-11-03). Phase 2b can run any time before it. Phase 2 research is paused at 19 of 59 entities by the owner's choice (finish the app first); see Phase 2b below.

## Phase 0: Framework ✅
- [x] Clarify intent with the owner (AI engine, app form, spoilers, language)
- [x] CLAUDE.md and docs/ framework (vision, architecture, data model, generation, sources, design, decisions, devlog)
- [x] Visual design with Taste Skill: a static prototype of the library, book graph and entity screens (`design/prototype/`)

## Phase 1: Foundation ✅
- [x] Scaffold Vite + React + TS (strict) + Tailwind + Vitest + ESLint at the repo root
- [x] Zod schemas in `src/schema/` matching DATA_MODEL.md (Entity, Book, Graph, MediaItem, Progress)
- [x] `scripts/validate.ts`: schema, graph rules 1–10, referential integrity, and clear error messages
- [x] Hand-written fixture: *Divine Comedy*, Inferno Cantos I–V, 10 depth-1 and 7 depth-2 nodes, real verified media (45 URLs, all 200)
- [x] `src/lib/visibility.ts` (spoiler logic), with unit tests
- [x] Vite plugin API: `GET /api/books`, `GET /api/books/:slug` (resolved bundle), `PUT /api/books/:slug/progress`
- [x] Minimal page that loads the fixture and lists visible nodes (proves the pipeline end to end)
- [x] Update the CLAUDE.md commands block to reality

## Phase 2: Generation pipeline
- [x] Helper scripts: `wikidata`, `commons`, `check-links` (with tests)
- [x] `.claude/skills/build-graph/SKILL.md`, implementing GENERATION.md, with a cast checkpoint and parallel research subagents
- [ ] Generate the full *Divine Comedy* graph (replacing the fixture) and review quality with the owner
  - [x] Cast approved (59) · [x] batches 1–2 merged (Inferno I–VII, 19) · [ ] remaining 40
- [ ] Refine GENERATION.md and SOURCES.md based on what went wrong
- [x] `/expand` skill (add or enrich one entity)

## Phase 3: Book graph view (port `design/prototype/book.html`) ✅
- [x] GraphCanvas component (Cytoscape) with concentric layered layout, type shapes and importance sizing
- [x] Canto strip component (signature element) wired to `progress.json`
- [x] Node images (portraits or artworks) as node backgrounds, as 330px Commons thumbnails. The book cover as the centre.
- [x] Section picker / spoiler slider wired to progress, with a "show everything" toggle
- [x] Filters (entity type via the legend, depth), search, hover highlighting of neighbourhoods
- [x] Side panel preview on click
- [x] Visual check against the prototype: the skill's `lint.mjs --app` and `inspect.mjs --app` at 0 FAIL (production build)

---

# Plan for the next phases (written 2026-11-03)

**Recommended order:** 4 → 4.5 → 2b (any time, in the background) → 5 → 6 → 7.
Phases 4, 4.5 and 5 make the app complete for one reader and one book. 2b fills the book. 6 makes it robust and shareable,
and 7 adds the extras the owner picks.

Every UI phase ends the same way: unit tests for the new pure logic, `npm run validate && npm test && npm run typecheck && npm run lint`,
then the taste skill's `lint.mjs --app` and `inspect.mjs --app` on the **production build** (`npm run build && npm run preview`) at 0 FAIL,
then a look at the screenshots at 1440, 768 and 390. Plus, from Phase 4.5 on, the browser smoke tests.

**What the library holds now** (this shapes Phase 4): 55 pictures (all Commons, public domain or CC), 9 YouTube lectures with an `embed`,
and 35 linked sources without embeds (Yale pages, BBC *In Our Time*, Gutenberg, Stanford Encyclopedia, Danteworlds, New Advent, archive.org).

## Phase 4: Entity page and media (port `design/prototype/entity.html`) ✅
**Goal:** clicking anyone on the map opens a page that answers "who is this, what have they done so far, and what should I look at or listen to tonight?"
- [x] Pure view model `entityView(bundle, id, at)`: visible notes, media grouped as Look / Watch & listen / Read, context with summaries,
      neighbours, and the counts of hidden notes and media. Unit-tested for spoiler safety, including that nothing past `at` leaks into it.
- [x] Route `/book/:slug/e/:id` (depth-1 and context entities), linked from the rail's "Open" button, the new-in-canto list, and node double-click.
- [x] About block: portrait or artwork, plot-free summary, facts, dates, picture caption and credit.
- [x] **Look**: a gallery of artworks (book-specific first, by canto), opening a lightbox built on the native `<dialog>` (keyboard, swipe,
      credit line, a link to the Commons page). No new dependency unless `<dialog>` falls short.
- [x] **Watch and listen**: YouTube through `youtube-nocookie.com`, click-to-load (a poster first, nothing loaded from YouTube before the click).
      Podcasts and lectures without an embed get a rich card: publisher, duration, the `why` line, opening in a new tab.
- [x] **Read**: article and book cards (publisher, the `why` line).
- [x] **In this book**: notes up to the reader's canto, the current one in gilt, and "N more after this canto" (a count, never text).
- [x] **To know them by**: context entries with their `why` and summary, each linking to its own page.
- [x] **Connections**: the ego graph (`graphElements` focus mode, already tested). A click navigates to that entity.
- [x] The tier is shown in words ("Definitive", "Very good") inside the card's meta line, not as a badge; the skill bans pill badges above headings.
- **Done when:** every one of the 19 figures and 17 context entries has a page that inspects at 0 FAIL, and every picture shows its credit.
- **Size:** one long session. No research tokens.

## Phase 4.5: Browser smoke tests ✅
**Goal:** what the screenshots cannot show is tested: clicks, keys, saving.
- [x] Playwright (`@playwright/test`, using the installed Chrome channel, no browser download) against `vite preview`.
- [x] Scenarios: the strip moves on arrow keys and the position survives a reload; a figure ahead of the reader is never in the DOM or on the map;
      "Show everything" reveals it without moving `progress.json`; search with Enter selects; the legend filter hides a kind;
      a node click fills the rail; the entity page opens and the lightbox works from the keyboard.
- [x] The tests run against a copy of `library/` in a temp folder, so they never change the owner's reading position.
- **Size:** half a session.

## Phase 2b: Finish researching the Comedy (paused, can run any time)
**Goal:** the remaining 40 approved figures (Inferno VIII to Paradiso XXXIII).
- [ ] The owner picks the depth: full (about 20k tokens per entity, so about 800k) or lean for importance-1 figures (about 450–500k total).
- [ ] Batches of about 10, two at a time, each to `.work/divine-comedy/batch-N.json`. Then `npm run merge-batches` (the 27 pending edges attach
      automatically), then the role and `why` spoiler review, `validate`, `check-links` and `test`.
- [ ] Afterwards: "Refine GENERATION.md and SOURCES.md" (Phase 2's last task), using what the batches reported.
- **Done when:** 59 figures, `check-links` clean, and the owner has spot-reviewed five figures from Purgatorio and Paradiso.

## Phase 5: Library and cross-book
**Goal:** the home screen from the prototype, and a second book to prove that entities are shared.
- [ ] Home as in `design/prototype/index.html`: the greeting, count tiles, a Continue panel with the compact strip and the faces new in this canto,
      "For tonight" (the best sources unlocked at the current canto, chosen by a pure, tested ranking: tier, then variety of kind, then not yet opened),
      the books list.
- [ ] "Also appears in" on entity pages, and "Across your books" on the home screen. Spoiler-aware: an entity that is shared but still ahead in
      one book is counted, never named.
- [ ] Remember which sources were opened (`library/books/<slug>/visits.json` through the API) so "For tonight" doesn't repeat itself.
- [ ] A second book with `/build-graph`. *The Prince* is a good test, because Florence and others are shared. The owner chooses the book and the budget
      (a lean 25-figure book costs about 300–500k tokens).
- **Done when:** both books show "Also appears in" correctly, and switching books keeps each one's own reading position.

## Phase 6: Hardening and shipping
**Goal:** solid enough to use every evening, and safe to change.
- [ ] Merge the phase branches into `main` (the owner's call: a PR on GitHub or a local merge), then push.
- [ ] GitHub Actions on every push: validate, test, typecheck, lint, build (no network, so no `check-links` in CI).
- [ ] Performance: load Cytoscape only on graph routes (the build currently warns about a 500 kB chunk), and make sure no image is larger than its slot.
- [ ] Accessibility: the graph is a canvas, so give the map a keyboard and screen-reader alternative (a "List" view of the same visible nodes)
      and focus handling between the map, the rail and the entity page.
- [ ] Empty, loading and error states for every block (taste-skill §11): loading placeholders at the real size, errors inside the block that failed, with a Retry.
- [ ] A README with screenshots and a two-minute "how to build your first graph".
- [ ] Retire `design/prototype/` sample data from the docs once the app covers every screen (keep the prototype as a design record).

## Phase 7: Extras (to be chosen by the owner; each is independent)
- [ ] **Map view:** places on a MapLibre GL map with OpenStreetMap tiles, filtered by progress (Florence, Ravenna and Mantua already have coordinates).
- [ ] **Timeline:** people, works and events on vis-timeline, from Wikidata dates.
- [ ] `/refresh-sources` skill, plus a scheduled dead-link report (a cloud routine or a local cron) that replaces dead or weak sources.
- [ ] An in-app "Build graph" button: the local API runs Claude Code headless (`claude -p "/build-graph …"`) and shows progress, including the cast checkpoint as a review screen.
- [ ] Personal notes and "visited" marks per entity, stored in `library/`.
- [ ] Export a graph as a PNG or SVG poster.
- [ ] Wrap it as a desktop app (Tauri) if the browser starts to feel limiting.

## Decisions waiting for the owner
1. Phase 2b: when to run it, and at full or lean depth.
2. Phase 5: the second book, and its budget.
3. Phase 6: how to merge into `main` (a PR or a local merge) and whether to push to GitHub.
4. Phase 7: which extras, in what order.
