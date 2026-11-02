# CLAUDE.md — readgraph

readgraph builds rich, visual knowledge graphs for the books its owner is reading:
the people, places, works, ideas and events around a book, each paired with
**top-tier sources shown inside the tool** (paintings, lectures, videos, podcasts,
articles). Claude Code creates the graphs; a local web app displays them.

Read [docs/VISION.md](docs/VISION.md) once to understand *why* the tool exists. It
changes how you make every decision.

## The three rules that define this product

1. **One level deeper, never two.** A graph has exactly three layers:
   - depth 0: the **book**
   - depth 1: entities **in the book** (characters, the author, places, works, concepts the text uses)
   - depth 2: **context** for a depth-1 entity (Dante → *Florence*). Depth-2 nodes are **leaves**: they get a
     summary and media, but **no new neighbours of their own**. Florence never pulls in the Medici.
   The validator enforces this. Do not work around it, even if a depth-3 detail is fascinating.
2. **No spoilers past the reader's position.** Every in-book fact, edge and book-specific media item
   is tagged with the section (chapter/canto) where it is revealed. The UI hides anything past the
   reader's progress. Global entity summaries must never contain plot information. See
   [docs/DATA_MODEL.md](docs/DATA_MODEL.md#spoiler-model).
3. **Curation over volume.** 3 excellent sources beat 15 average ones. Every media item states
   *why* it is worth the reader's time. Follow the tiers in [docs/SOURCES.md](docs/SOURCES.md).
   Never invent a URL. Every link must have been fetched or verified.

## How the system is split

| Part | What it does | Where |
|---|---|---|
| Generation | Claude Code skill researches a book and writes JSON | `.claude/skills/`, [docs/GENERATION.md](docs/GENERATION.md) |
| Data | JSON files: global entity registry plus per-book graphs, versioned in git | `library/`, [docs/DATA_MODEL.md](docs/DATA_MODEL.md) |
| Schema | Zod schemas, the single source of truth, shared by validator and app | `src/schema/` |
| App | Vite + React + TypeScript + Cytoscape.js local web app | `src/`, [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) |
| Look & feel | Visual language, entity colours, typography | [docs/DESIGN.md](docs/DESIGN.md) |

## Development framework (how we work in this repo)

The `docs/` folder is the project's memory. Keep it current, because it is how work continues across sessions.

- **Start of a session:** read [docs/ROADMAP.md](docs/ROADMAP.md) to see the current phase and the next unchecked task.
  Skim the latest entry in [docs/DEVLOG.md](docs/DEVLOG.md).
- **While working:** for a non-obvious choice (a library, a schema change, a UX trade-off), add a short
  entry to [docs/DECISIONS.md](docs/DECISIONS.md). If the schema changes, update `docs/DATA_MODEL.md` **and**
  `src/schema/` in the same change, then re-run validation on all books.
- **End of a task:** tick the box in ROADMAP.md and add a dated DEVLOG entry with what was done,
  what was learned, and what comes next. Keep it to a few lines.
- Don't let docs describe things that don't exist yet as if they do. Mark planned things as *(planned)*.

## Commands

```bash
npm install
npm run dev          # local app + API at http://localhost:5173
npm run validate     # every book and entity in library/: schema, graph rules, spoiler consistency
npm run validate -- divine-comedy   # one book
npm test             # vitest: visibility (spoiler) logic, graph rules, the real library on disk
npm run typecheck && npm run lint && npm run build
npm run check-links  # (planned, Phase 2) verify every media/source URL still resolves
```

Before finishing any change: `npm run validate && npm test && npm run typecheck && npm run lint`.
Stack pins: TypeScript stays on 6.0.x until typescript-eslint supports 7 (D-013).

Claude Code skills (planned, Phase 2):

- `/build-graph "<title>" [language]`: research and create a new book graph
- `/expand <book> <entity>`: add or enrich one entity (and its depth-2 context) in an existing graph
- `/refresh-sources <book>`: re-verify links and replace dead or weak sources

## Code conventions

- TypeScript strict. Never use `any` on data from `library/`. Parse it with the Zod schema.
- Graph and visibility logic are pure functions in `src/lib/` with unit tests. React components stay thin.
- Functional React components and hooks. Tailwind for styling. Use colour tokens from `docs/DESIGN.md`, not ad-hoc hex values.
- Small, focused modules. Avoid frameworks we don't need (no Redux, no Next.js, no database).
- Data files: 2-space JSON, stable key order, kebab-case ids. Entity ids are global and reused across books.

## Design work

For any visual work (graph views, the entity panel, the library page, theming), use the
`design-taste-frontend` skill (Taste Skill v2, MIT). It lives in `.claude/skills/design-taste-frontend/`,
which is **gitignored**. On a fresh clone, copy `skills/taste-skill/` from
https://github.com/Leonxlnx/taste-skill into that folder. It needs Node 22+ and a Chrome or Chromium browser
for its inspector. `docs/DESIGN.md` holds this product's art direction. Where the skill's house style and
DESIGN.md disagree, settle it with the owner and record the result in DECISIONS.md.

## Things to never do

- Never add depth-3 nodes, or "just one more" level of context.
- Never write plot developments into an entity's global `summary`.
- Never fabricate sources, quotes, dates or URLs. If something can't be verified, leave it out.
- Never download copyrighted media into the repo. Link or embed it, with attribution (see SOURCES.md).
- Never commit or push unless the owner asks.
