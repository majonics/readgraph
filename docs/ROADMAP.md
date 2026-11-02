# Roadmap

Tick tasks as they are completed and log them in DEVLOG.md. The first unchecked task in the current phase is "next".

**Current phase: 2, Generation pipeline**

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
- [ ] Helper scripts: `wikidata`, `commons`, `check-links`
- [ ] `.claude/skills/build-graph/SKILL.md`, implementing GENERATION.md, with a cast checkpoint and parallel research subagents
- [ ] Generate the full *Divine Comedy* graph (replacing the fixture) and review quality with the owner
- [ ] Refine GENERATION.md and SOURCES.md based on what went wrong
- [ ] `/expand` skill (add or enrich one entity)

## Phase 3: Book graph view (port `design/prototype/book.html`)
- [ ] GraphCanvas component (Cytoscape) with concentric layered layout, type shapes and importance sizing
- [ ] Canto strip component (signature element) wired to `progress.json`
- [ ] Node images (portraits or artworks) as node backgrounds. The book cover as the centre.
- [ ] Section picker / spoiler slider wired to progress, with a "show everything" toggle
- [ ] Filters (entity type, depth), search, hover highlighting of neighbourhoods
- [ ] Side panel preview on click
- [ ] Visual check against the prototype: the skill's `lint.mjs --app` and `inspect.mjs --app` at 0 FAIL

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
