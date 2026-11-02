# Data model

The Zod schemas in `src/schema/` are the source of truth. This document explains them and must be kept
in sync with them.

## Two levels of data

- **Global entities** (`library/entities/<id>.json`) hold facts that are true regardless of the book:
  who Virgil was, Florence's coordinates, a portrait, the best general lecture. They are reused across books.
- **Book graphs** (`library/books/<slug>/`) hold what is specific to one book: Virgil's *role* in the
  *Comedy*, when he first appears, what he does canto by canto, his edges, and media about *this* book.

This split lets Florence be one node shared by the *Divine Comedy*, *The Prince* and *A Room with a View*,
and powers "also appears in…".

## Entity (global)

```jsonc
// library/entities/virgil.json
{
  "id": "virgil",                     // kebab-case, globally unique, stable
  "type": "person",                   // see Entity types
  "name": { "en": "Virgil", "it": "Virgilio" },
  "wikidataId": "Q1398",              // identity anchor for dedupe; omit only if none exists
  "dates": { "start": "-0070-10-15", "end": "-0019-09-21", "label": "70–19 BC" },  // optional
  "location": { "lat": 41.9, "lon": 12.5 },        // places only
  "image": { "$ref": "MediaItem" },                 // one representative image (portrait, view, cover)
  "summary": {                                       // spoiler-free, book-independent, 2–4 sentences
    "en": "Roman poet of the Augustan age, author of the Aeneid…"
  },
  "facts": { "en": ["Born near Mantua", "Wrote the Aeneid, Eclogues and Georgics"] },  // optional, short
  "media": [ /* MediaItem[]: general, book-independent sources */ ],
  "links": { "wikipedia": { "en": "https://en.wikipedia.org/wiki/Virgil" } }
}
```

Text fields are **language maps** (`{ "en": "...", "uk": "..." }`). A book declares its language, and generation
fills that language (and may add others later).

### Entity types

| type | meaning | example |
|---|---|---|
| `person` | real historical person | Dante, Virgil, Beatrice Portinari, Pope Boniface VIII |
| `figure` | mythological, legendary or fictional being | Minos, Charon, Ulysses, Lucifer |
| `place` | real or literary location | Florence, Ravenna, Limbo, Mount Purgatory |
| `work` | text, artwork or piece of music | *Aeneid*, *Vita Nuova*, Botticelli's *Map of Hell* |
| `concept` | idea, doctrine, school, motif | *contrapasso*, courtly love, Thomism |
| `group` | faction, order, people, institution | Guelphs & Ghibellines, Franciscans |
| `event` | dated happening | Battle of Campaldino, Dante's exile (1302) |
| `era` | period or movement | Dolce Stil Novo, the Trecento |

## Book

```jsonc
// library/books/divine-comedy/book.json
{
  "slug": "divine-comedy",
  "title": "The Divine Comedy",
  "originalTitle": "Commedia",
  "author": "dante-alighieri",        // entity id
  "year": { "label": "c. 1308–1321" },
  "language": "en",                   // language of generated content for this book
  "edition": "Trans. Robert Hollander & Jean Hollander",   // optional; section ids should match it
  "cover": { "url": "https://covers.openlibrary.org/...", "source": "Open Library" },
  "about": "2–4 sentence spoiler-free framing of the book and why it matters.",
  "sections": [                       // ordered; defines the spoiler axis
    { "id": "inf-01", "label": "Canto I", "group": "Inferno" },
    { "id": "inf-02", "label": "Canto II", "group": "Inferno" }
  ],
  "media": [ /* MediaItem[]: about the whole book, each with optional "section" */ ],
  "generatedAt": "2026-11-02",
  "generator": { "skill": "build-graph", "version": 1 }
}
```

## Graph

```jsonc
// library/books/divine-comedy/graph.json
{
  "nodes": [
    {
      "entity": "virgil",
      "depth": 1,
      "importance": 3,                 // 1 minor · 2 notable · 3 central (drives size and default filters)
      "role": "Dante's guide through Hell and Purgatory",
      "firstSection": "inf-01",        // when the reader first meets it
      "inBook": [                      // progressive notes, each revealed at its section
        { "section": "inf-01", "text": "Appears to Dante in the dark wood…" },
        { "section": "purg-30", "text": "…" }
      ],
      "media": [ /* MediaItem[]: specific to this entity *in this book*, e.g. Doré plate for Canto I */ ]
    },
    {
      "entity": "florence",
      "depth": 2,
      "via": ["dante-alighieri"],     // the depth-1 node(s) this context belongs to (≥1, required)
      "why": "Dante's city: its politics explain who he puts in Hell"
    }
  ],
  "edges": [
    { "source": "dante-alighieri", "target": "virgil", "type": "guided-by", "label": "guided by", "section": "inf-01" },
    { "source": "dante-alighieri", "target": "florence", "type": "born-in", "label": "born in" }
  ]
}
```

The book node itself (depth 0) is implicit: every depth-1 node is drawn connected to the book.

### Graph rules (enforced by `npm run validate`)

1. `depth` ∈ {1, 2}. There are no other depths.
2. Every depth-2 node has a non-empty `via` whose ids are all depth-1 nodes, and an edge to at least one of them.
3. Edges may connect 1–1, 1–2 or 2–2 (both already present). Nodes are never created to satisfy an edge.
4. Depth-2 nodes have no `firstSection` or `inBook`. They inherit visibility from their `via` parents.
5. Every `section` reference exists in `book.sections`. Every entity id resolves to a file in `library/entities/`.
6. Edge `section` ≥ the `firstSection` of both its depth-1 endpoints.
7. Every MediaItem passes the MediaItem schema: `https` URLs, tier 1 or 2, a `why`, a `verifiedAt` date, and a
   `license` + `attribution` whenever `imageUrl` is set.
8. An in-book note's `section` is not before its node's `firstSection`.
9. Global entity media never carries a `section` (it would leak past the spoiler line); book-specific media lives on the graph node or the book.
10. No duplicate nodes, no duplicate edges (same source, target and type), no self-loops; `book.slug` matches its folder;
    an entity's `id` matches its file name; `book.author` resolves to an entity.

Required vs optional fields are exactly what `src/schema/index.ts` says; every object is strict (unknown keys are errors).

## MediaItem

```jsonc
{
  "kind": "artwork",                   // artwork | image | video | lecture | podcast | article | book | map | audio | website
  "title": "Dante and Virgil in the dark wood",
  "creator": "Gustave Doré",
  "year": "1857",
  "publisher": "Wikimedia Commons",    // where it lives: Yale Open Courses, BBC Radio 4, SEP, The Met…
  "url": "https://commons.wikimedia.org/wiki/File:...",       // canonical page (always)
  "embed": { "type": "youtube", "id": "..." },               // optional: youtube | vimeo | spotify | apple-podcasts | image | iframe
  "imageUrl": "https://upload.wikimedia.org/...",            // for artwork/image kinds; plus "thumbUrl"
  "license": "Public domain",          // required for images shown inline
  "attribution": "Gustave Doré, public domain, via Wikimedia Commons",
  "durationMin": 52,                   // video/lecture/podcast
  "language": "en",
  "tier": 1,                           // 1 = definitive, 2 = very good (see SOURCES.md). No tier 3.
  "why": "The image most readers picture when they think of Inferno",   // one line, required
  "section": "inf-01",                 // book-specific media only: hidden until reached (spoiler-safe)
  "verifiedAt": "2026-11-02"           // last time the URL was confirmed live
}
```

## Progress

```jsonc
// library/books/divine-comedy/progress.json
{ "currentSection": "inf-05", "updatedAt": "2026-11-02T21:30:00Z" }
```

## Spoiler model

The reader is at section `S`. Sections compare by their index in `book.sections`.

| Item | Visible when |
|---|---|
| depth-1 node | `firstSection ≤ S` |
| depth-2 node | at least one `via` parent is visible |
| edge | both endpoints are visible **and** (`section` is absent or `section ≤ S`) |
| `inBook` note | `section ≤ S` |
| media with `section` | `section ≤ S` |
| global entity `summary`, `facts`, `media` | always, so **they must be plot-free** |

Writing rule for generation: anything that happens *in the story* goes into a section-tagged `inBook`
note, never into `summary`. For purely fictional characters, the summary is a one-line introduction
as of their first appearance.

A "show everything" toggle in the UI sets `S` to the last section without changing `progress.json`.
