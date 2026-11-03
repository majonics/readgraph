# Dev log

Newest entry first. Each entry: what was done, what was learned, what's next. Keep it short.

---

## 2026-11-03 · La Bestia: a read-along book
- **Done:** Added *La Bestia* (Carmen Mola, 2021; the owner reads the Russian translation, Sindbad 2025): 85 chapters, position at
  Chapter 1, and the cover-level nodes (Carmen Mola, Madrid, the 1826–1837 cholera pandemic) with the Premio Planeta and the
  First Carlist War as context. 5 entities, 5 verified sources, 3 Commons images; `check-links` clean. New `/chapter` skill (D-018).
  The app's "canto"/"poem" wording now comes from the book's own section labels.
- **Open:** the part boundaries (the four parts' first chapters) and the chapter count, which comes from one reader review of the
  Spanish edition. Both are to be confirmed from the owner's copy. Britannica and the Madrid city site refuse automated requests,
  so they aren't used.
- **Next:** `/chapter la-bestia 1` once the owner has read it.

## 2026-11-03 · Phase 4.5: browser smoke tests
- **Done:** `npm run e2e` (D-017): 9 Playwright tests in the installed Chrome against the production build and a copy of the library.
  The strip on arrow keys and across a reload, nothing ahead of the reader in the DOM, the map or the strip tooltips, "Show everything"
  without moving progress, search with Enter, the legend filter, node click and double-click, the not-met page, the lightbox from the
  keyboard, and no request to YouTube before play. The real `progress.json` was unchanged across runs.
- **Learned:** The first spoiler test passed with a planted leak, because it read the page once after hovering every canto, and the
  tooltip shows one canto at a time. It now reads each tooltip as it hovers, and fails on the leak. Playwright can stop the web server
  before its exit handlers run, so the library copy lives in one fixed folder that is cleared at each start.
- **Next:** Phase 5 (library home and a second book), or Phase 2b research. Both need the owner's choices (ROADMAP > Decisions waiting).

## 2026-11-03 · Phase 4 done: In this book, To know them by, Connections
- **Done:** The rail (notes up to the reader, the current canto in gilt, hidden notes and sources as counts), context cards with their own
  credits line, and the ego graph with its connections as sentences (first 8, the rest folded). The ego layout now puts the focus in the
  centre and every neighbour on one ring. Layout per D-016. Section labels name the canticle. Done-when met: all 36 pages inspect at
  0 FAIL with "show everything" on, and a browser check confirms a credit for every picture on every page.
- **Defended WARNs:** ragged-row on six figures with "show everything" on (the whole poem's notes make the rail longer than the page);
  colour-sprawl at 390px on Beatrice and the Virgin Mary (the portrait is a colourful painting, and the picture is the content).
- **Learned:** Concentric layout with one node per level puts every ring's node at twelve o'clock, a vertical line. Stretching a short panel
  to match a rail only moves the void inside it.
- **Next:** Phase 4.5, Playwright smoke tests (the CDP checks in this phase are the first draft of its scenarios).

## 2026-11-03 · Phase 4: Watch and listen, and Read
- **Done:** `Sources.tsx`: players for YouTube (`youtube-nocookie.com`) and Vimeo (`dnt=1`) behind a poster drawn locally, and link cards
  for podcasts, lectures without an embed, articles and books. The meta line names the kind, the publisher and the tier in words.
  `embedSrc` is tested, including id escaping. Other embed types (Spotify, Apple Podcasts, iframe) fall back to a card until a real item needs them.
  Checked in Chrome: before the click, no request goes to YouTube or Google other than Fonts. The click loads the nocookie player and focuses it.
- **Learned:** A YouTube thumbnail would itself be a request to YouTube, so the poster is typographic. A lone player in a two-column grid
  left half a row empty, so players and cards share one grid.
- **Next:** In this book (notes up to the canto) and To know them by.

## 2026-11-03 · Phase 4: Look gallery and lightbox
- **Done:** The Look panel: square frames in reading order, a caption with creator and canto, and a credits line for every picture. Opening a
  frame shows `Lightbox.tsx` on the native `<dialog>` (no new dependency): arrows and swipe step and wrap, Esc or the backdrop closes, focus
  returns to the frame. `entityView` drops the About picture from Look when it is borrowed from the book. Driven in Chrome over CDP on the
  production build (open, step, wrap, Esc, focus, the map card's Open button); inspector 0 FAIL, 0 WARN on Charon.
- **Learned:** Tailwind's preflight zeroes `margin`, so a `<dialog>` needs `margin: auto` back to centre. React's `autoFocus` runs before
  `showModal()`, which then moves focus to the first link, so the Close button is focused by hand after opening.
- **Next:** Watch and listen (click-to-load YouTube, rich cards for podcasts and lectures).

## 2026-11-03 · Phase 4: entity route and About
- **Done:** `/book/:slug/e/:id` (`EntityPage.tsx`), opened from the map card's new "Open" button or a double-click on a node. `?all` carries
  "Show everything" across. The About block shows the portrait (linked to Commons), the plot-free summary, facts, a credit line and Wikipedia.
  A figure not met yet gets a page that doesn't name it. Type labels moved to `src/lib/labels.ts`. Inspector: 0 FAIL at 1440/768/390
  for Virgil, Florence and an unmet figure. The one WARN is the empty space the next blocks will fill.
- **Learned:** A media item's `year` is the photo's year for a photographed artwork, so captions leave it out.
- **Next:** Look (gallery and `<dialog>` lightbox).

## 2026-11-03 · Phase 4: entity view model
- **Done:** `src/lib/entityView.ts`, the entity page as pure data built on `computeVisibility`: notes up to the reader, media grouped as
  Look (inline pictures only) / Watch and listen / Read with book-specific items first in reading order, context with summaries, the figures a
  context leaf belongs to, neighbours as directed sentences, and hidden counts. 8 tests, including a spoiler sweep of every entity at every
  canto of the real Comedy. An injected leak (unfiltered notes) fails 3 of them.
- **Learned:** An artwork without an `imageUrl` can't sit in a gallery, so it falls to Read.
- **Next:** the `/book/:slug/e/:id` route and the About block.

## 2026-11-03 · Reading-spiral map
- **Done:** Replaced the concentric whole-book layout with a pure, tested reading spiral (`constellation.ts`, D-015): the companions sit at the centre,
  figures spiral outward in reading order, context leaves orbit their parents. Bigger nodes, no book node. The selection lives in the URL (`?e=`),
  the strip lists the faces new in this canto, and the rail card lists relations as sentences you can click.
- **Next:** Phase 4, starting with the `entityView` view model.

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
