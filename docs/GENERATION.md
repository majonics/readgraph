# Generation pipeline

How Claude Code turns a book title into a graph. The `/build-graph` skill (Phase 2) executes this
document step by step, so improving this document improves every future graph.

## Invocation

```
/build-graph "The Divine Comedy" en
```

Arguments: the title (plus the author if it is ambiguous) and the content language (ask if it is missing).

## Steps

### 1. Identify the book
- Resolve the canonical work: title, author, year, Wikidata QID, and an Open Library cover.
- Ask the reader which **edition or translation** they are reading if section numbering could differ
  (most novels, some translations). Verse epics with canonical numbering (cantos, books) don't need to ask.
- Build `sections`: the spoiler axis. Use chapters or cantos as the reader sees them. Very long books may
  group sections (e.g. "Part II, ch. 1–5") if chapter-level precision isn't useful.
- If `library/books/<slug>/` already exists, stop and suggest `/expand` instead.

### 2. Draft the depth-1 cast
- List the entities **in the book**: characters, real people mentioned with weight, places, works cited,
  key concepts, events. For each, record `firstSection`, `importance` (1–3), and a one-line `role`.
- Budget: **25–60 depth-1 nodes** for a first build, chosen by importance. Big books (the *Comedy* has
  hundreds of named souls) start with the ones that matter. Others can be added later with `/expand`.
- Reuse existing ids from `library/entities/` (match on `wikidataId` first, then name).
- **Checkpoint:** show the reader the draft cast as a compact table and let them add or remove before deep research.

### 3. Research each depth-1 entity (parallelisable)
Split the cast into batches and research them with subagents. For each entity:
- Global data, if it isn't already in the registry: summary (plot-free), facts, dates, location,
  representative image (Wikimedia Commons, with license), Wikipedia link, Wikidata QID.
- In-book data: `inBook` notes per section where the entity matters (progressive, spoiler-tagged).
- **Depth-2 context**: at most **0–4** context entities that *materially help understand this entity in this
  book* (Dante → Florence, Guelphs and Ghibellines, Beatrice). Each needs a `why`. Context entities are leaves.
- Edges to other cast members, with `section` when the relationship is revealed in the story.

### 4. Find sources (the part that makes the tool special)
For each depth-1 entity, aim for **2–5 media items**. For depth-2 entities, **1–2**. For the book itself, **4–8**.
- Follow the tiers and preferred sources in [SOURCES.md](SOURCES.md). Prefer variety: one artwork, one
  lecture or video, one podcast, one deep article is better than four articles.
- Every item must be **verified**: fetch the page and confirm that it exists and is what it claims to be. For YouTube, get
  the video id from the page. For Commons images, use the API to get the real `imageUrl`, `thumbUrl`, author and license.
- Write a concrete `why` ("Mazzotta's lecture on why Virgil, a pagan, can guide Dante"), not "good overview".
- Book-specific media that discusses later parts of the story gets a `section` tag.

### 5. Write files
- New or updated `library/entities/*.json`. Never drop existing data from a shared entity. Merge it.
- `library/books/<slug>/book.json`, `graph.json`, and `progress.json` (start at the first section).

### 6. Validate and report
- Run `npm run validate -- <slug>` and fix every error.
- Report: node counts by depth and type, media counts by kind, anything skipped or uncertain, and
  suggestions for `/expand`.
- Add a DEVLOG line noting the book that was generated.

## Quality bar (checklist used before finishing)

- [ ] No depth-3 nodes. Every depth-2 node has `via` and a `why`.
- [ ] No plot in any global `summary`. Spot-check five fictional characters.
- [ ] Every URL was fetched during this run. No guessed YouTube ids, no invented podcast episodes.
- [ ] Every inline image has a license and attribution.
- [ ] Each central (importance 3) entity has at least one non-text medium (artwork/video/lecture/podcast).
- [ ] The content language matches `book.language`.

## Helper scripts *(planned, Phase 2)*

- `npm run wikidata -- search "Virgil"` / `-- get Q1398`: canonical facts, dates, coordinates, P18 image.
- `npm run commons -- "File:Gustave Dore Inferno1.jpg"`: image URL, thumbnail, author, license.
- `npm run check-links -- <slug>`: verify all URLs (also used by `/refresh-sources`).

These keep generation reliable and cheap: structured facts come from APIs, and research effort goes into curation.
