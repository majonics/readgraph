# Roadmap

Tick tasks as they are completed and log them in DEVLOG.md. The first unchecked task in the current phase is "next".

**Current phase: 4, Entity focus view and media** (Phase 2 research paused at 19 of 59 entities, by owner's choice: finish the app first)

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

## Phase 4: Entity focus view and media
- [ ] Focus route: ego graph (entity, its neighbours, its context halo)
- [ ] Entity panel sections as in DESIGN.md
- [ ] Media cards: YouTube/Vimeo/Spotify/Apple embeds (lazy, click-to-load), artwork lightbox, article cards
- [ ] Attribution display and tier badges

## Phase 5: Library and cross-book
- [ ] Bookshelf home with covers, progress bars and "continue reading"
- [ ] "Also appears in" via the shared entity registry
- [ ] Generate a second book and confirm entity reuse works (e.g. *The Prince* shares Florence)

## Phase 6: Extras (ideas, to be prioritised with the owner)
- [ ] Map view: places on a MapLibre map, filtered by progress
- [ ] Timeline view: people, events and works on vis-timeline
- [ ] `/refresh-sources` skill plus a periodic dead-link report
- [ ] In-app "Build graph" button that runs Claude Code headless through the local API
- [ ] Personal notes and "visited" marks per entity
- [ ] Export a graph as a PNG/SVG poster
- [ ] Wrap as a desktop app (Tauri) if the browser starts to feel limiting
