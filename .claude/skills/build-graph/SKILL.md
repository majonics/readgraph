---
name: build-graph
description: Research a book and build its readgraph knowledge graph in library/ (cast, one level of context, curated verified sources, spoiler tags). Use when the owner says /build-graph, asks to map, graph or "build" a book, or to replace a fixture with a full graph.
argument-hint: "\"<title>\" [language]"
---

# /build-graph

You build one book's graph, following [docs/GENERATION.md](../../../docs/GENERATION.md). That document is the method;
this file is the procedure. Read GENERATION.md, [docs/SOURCES.md](../../../docs/SOURCES.md) and
[docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md) before starting. The schema in `src/schema/index.ts` is what the
validator enforces.

**The three rules (CLAUDE.md):** never go deeper than depth 2; never put plot into a global `summary`; never write a URL,
id, date or quote you have not verified in this run.

## Inputs

- `$ARGUMENTS`: the title (plus the author if it is ambiguous) and optionally a content language (`en`, `uk`, …).
  If the language is missing, ask. If the edition matters for numbering (most novels), ask which one they are reading.
- If `library/books/<slug>/` exists: stop and offer `/expand`, unless the owner said to replace it (for example, a fixture).
  When you replace, keep `progress.json`.

## Working files

Use `.work/<slug>/` (gitignored) for drafts: `cast.md`, `batch-<n>.json`, `notes.md`. Nothing in `library/` changes until step 6.

## Procedure

### 1. Identify the book
- `npm run wikidata -- search "<title>"`, then `get <Q-id>` for the work and the author.
- Write `sections` in reading order, with stable ids (`inf-01`, `ch-01`, `part2-ch-03`) and labels as the reader sees them.
- Choose a cover: a period artwork or the author's portrait from Commons (`npm run commons -- "<file>"`). Never use a
  copyrighted edition cover inline.

### 2. Draft the cast → CHECKPOINT
- List depth-1 candidates across the whole book: id, name, type, `firstSection`, importance (1–3), a one-line role.
  The budget is **25–60** (GENERATION.md). Prefer the figures a reader needs, then the ones the tradition made famous.
- Reuse existing ids from `library/entities/`: match by `wikidataId` first, then by name.
- Note under each canticle, part or section group how many you left out and why ("the 20 popes and simonists of Inf. XIX: kept 2").
- Write it to `.work/<slug>/cast.md` as a compact table **grouped by section**, and show it to the owner.
  **Stop and wait for approval.** The owner may add, cut or change importance. Do not research before they answer.

### 3. Research in parallel
Split the approved cast into batches of 6–8 entities in reading order. Give each batch to a subagent (Agent tool) with:
- the batch rows, the book slug and language, and the list of existing entity ids;
- the instruction to read GENERATION.md, SOURCES.md, DATA_MODEL.md and `src/schema/index.ts` first;
- the deliverable: **one JSON file** `.work/<slug>/batch-<n>.json` shaped as
  `{ "entities": Entity[], "nodes": GraphNode[], "edges": Edge[], "contextEntities": Entity[], "report": string }`,
  with no writes anywhere else;
- the rules: global facts from `npm run wikidata -- get`; images from `npm run commons` (inline only if openly licensed);
  every non-image source fetched in this run and its title, creator and duration taken from the page; at most 0–4 context
  entities per node, each with a `why`; `inBook` notes per section, short and spoiler-ordered; `role` and context `why` written
  as of the node's `firstSection` (they show from then on, so nothing later may leak into them); book-specific media tagged
  with `section`; 2–5 media per central entity, 1–2 per context entity; an honest `report` of what it could not verify.

### 4. Merge
- `npm run merge-batches -- <slug>` does the mechanical part: entities merged field by field, context `via` unioned, duplicate edges
  dropped, edges to cast not yet researched parked in `.work/<slug>/pending-edges.json`, merged batches moved to `merged/`.
  The steps below are the judgement it cannot make.
- Read every batch. De-duplicate context entities that several batches proposed (same `wikidataId` or id): keep one, and
  merge the `via` lists.
- Check edges across batches (A in batch 1 → B in batch 3), and add the obvious missing ones with their `section`.
- Add the book-level media (4–8): a lecture series, a podcast episode, a reference article, the free text, the defining
  illustrations. Tag with `section` any item that discusses later parts.

### 5. Self-review (the quality bar in GENERATION.md)
Go through the checklist. In particular: read five fictional or mythological characters' summaries for plot; open five random
media URLs yourself; make sure each importance-3 node has a non-text medium.

### 6. Write and validate
- The merge script has written `library/`. A new book also needs `progress.json` (starting at the first section).
- Read every `role` and context `why` against its first section and fix any that leak later events.
- `npm run validate -- <slug>`, then `npm run check-links -- <slug>`. Fix everything. Report blocked links to the owner.
- `npm test`, because `tests/library.test.ts` validates the real library.

### 7. Report
Tell the owner: counts by depth and type, media by kind, anything dropped or unverifiable, and what `/expand` could add next.
Add a DEVLOG line. Do not commit unless asked.
