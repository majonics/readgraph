# Architecture

## Overview

```
 ┌──────────────────────────┐     writes JSON      ┌──────────────────────┐
 │ Claude Code              │ ───────────────────▶ │ library/  (git)      │
 │  /build-graph skill      │                      │  entities/*.json     │
 │  web search + fetch      │ ◀── npm run validate │  books/<slug>/*.json │
 │  helper scripts          │                      └──────────┬───────────┘
 └──────────────────────────┘                                 │ read (+ write progress)
                                                              ▼
                                         ┌───────────────────────────────────┐
                                         │ Local web app (Vite + React)      │
                                         │  /api/* middleware (Vite plugin)  │
                                         │  Cytoscape.js graph views         │
                                         │  media panels / embeds            │
                                         └───────────────────────────────────┘
```

There is no database, no cloud and no API key. The library is plain JSON in git, so every graph is
versioned, diffable and easy to repair by hand or by Claude.

## Stack

| Concern | Choice | Why (see DECISIONS.md) |
|---|---|---|
| Build / dev server | **Vite** | Fast, simple; plugin hook gives us a tiny local API without a separate server |
| UI | **React + TypeScript (strict)** | Mature ecosystem, typed data model |
| Styling | **Tailwind CSS** | Quick to iterate on a visual design; tokens live in DESIGN.md |
| Graph rendering | **Cytoscape.js** + `cytoscape-fcose` layout | Rich styling, good layouts (force, concentric), handles hundreds of nodes |
| Schema / validation | **Zod** | One schema for the validator CLI and runtime parsing in the app |
| Routing | **React Router** | `/`, `/book/:slug`, `/book/:slug/e/:entityId` |
| Lightbox for artwork | **yet-another-react-lightbox** *(planned)* | Zoomable images with captions |
| Map view | **MapLibre GL JS** + OpenStreetMap tiles *(planned, Phase 6)* | Open-source, no key needed |
| Timeline view | **vis-timeline** *(planned, Phase 6)* | Mature open-source timeline |
| Tests | **Vitest** | Same toolchain as Vite |
| Scripts | **tsx** | Run TypeScript scripts (validate, wikidata lookup, link check) directly |

## Repository layout (target)

```
readgraph/
├── CLAUDE.md
├── docs/                      # project memory: vision, plan, decisions, log
├── .claude/skills/            # generation skills (build-graph, expand, refresh-sources)
├── library/
│   ├── entities/<id>.json     # global entity registry, shared across books
│   └── books/<slug>/
│       ├── book.json          # metadata, sections (chapters/cantos), language, book-level media
│       ├── graph.json         # nodes (depth, role, in-book arc), edges, book-specific media
│       └── progress.json      # reader's current section
├── scripts/
│   ├── validate.ts            # schema + depth rule + spoiler consistency + referential integrity
│   ├── wikidata.ts            # fetch canonical facts/coords/dates/images by QID or search
│   ├── commons.ts             # Wikimedia Commons image info (url, thumb, author, license)
│   └── check-links.ts         # HEAD/GET every URL, report dead ones
├── src/
│   ├── schema/                # Zod schemas (source of truth) + inferred types
│   ├── lib/                   # pure logic: load, resolve, visibility, graph→cytoscape elements
│   ├── api/                   # Vite plugin: /api/books, /api/books/:slug, PUT progress
│   ├── components/            # GraphCanvas, EntityPanel, MediaCard, SectionSlider, ...
│   └── routes/                # Library, BookGraph, EntityFocus
└── tests/
```

## Data flow in the app

1. `GET /api/books/:slug` → server reads `book.json`, `graph.json`, `progress.json` and the referenced
   entity files, then returns one resolved bundle.
2. The client parses the bundle with Zod. Any error is shown loudly, never silently ignored.
3. `computeVisibility(bundle, currentSection)` (pure, in `src/lib/visibility.ts`) returns the visible nodes, edges,
   in-book notes and media.
4. `toCytoscapeElements(visible, view)` builds elements for the **book view** (all visible nodes, layered)
   or the **focus view** (the ego graph of one entity: its neighbours, plus its depth-2 context).
5. Changing progress → `PUT /api/books/:slug/progress` → the file is written → the view recomputes.

## Views

- **Library** (`/`): a bookshelf of generated books (covers from Open Library), with reading progress.
- **Book graph** (`/book/:slug`): the full graph. Book centre, depth-1 ring, depth-2 outer halo. Filter by
  entity type, search, spoiler slider (section picker), click a node to open the side panel.
- **Entity focus** (`/book/:slug/e/:id`): the selected entity at the centre with its connections, and a large
  detail panel: summary, "in this book" (progress-filtered), media gallery, "also appears in" other books.

## Future: in-app generation

Phase 1–5 generate graphs from the Claude Code terminal. Later, a "Build graph" button can call
Claude Code headless (`claude -p "/build-graph ..."`) through the local API, using the same skill and
the same subscription, with no API key. See ROADMAP Phase 6.
