# Design language

**Decided 2026-11-03** with the `design-taste-frontend` skill (see CLAUDE.md > Design work).
The working reference is the static prototype in [design/prototype/](../design/prototype/): open `index.html`.
Phases 3–4 port it to React. Where this document and the prototype disagree, the prototype wins; then fix this document.

Goal: **an illuminated atlas, not a dashboard.** It is a night-reading tool where pictures (Doré, Botticelli, mosaics)
carry the mood and colour is kept for one meaning only.

## Direction

- **Style:** taste-skill app style *true-black-flat*, dealt with seed 1898414268 ([design/taste-direction.json](../design/taste-direction.json)).
  Elevation is lightness alone (#000 ground, #111 panel, #191919 inner card, #2a2a2a nested). There are no borders or shadows on
  panels, the active nav item is shown by its label brightening, and the primary action is a white pill with black text.
- **Face: illuminator's gilt `#e0b04f`.** This is the only hue. It means *where you are*: the current canto, the figures new
  in it (a gilt ring), and the current in-book note. It never goes on buttons, tabs or navigation.
- **Signature element: the canto strip.** All 100 cantos (34 + 33 + 33) are shown as bars: read, current in gilt, and ahead.
  The dots above each canto count first appearances. Ahead of the reader, the dots show how many, never who. The strip is also the
  progress control (`role="slider"`, arrow keys). On a phone it shows only the current canticle.
- Design notes, data inventory, each screen's question and the final critique: [design/taste-notes.md](../design/taste-notes.md).

## Type

- **Inter** for everything: 400 / 500 / 600, with sizes 12 · 14 · 16 · 20 · 24. Use tabular figures on every number.
- **EB Garamond 500** has one job: the wordmark and the home greeting (44px).
- Sentence case everywhere. No tracked capitals, no monospace, no eyebrow labels.

## Tokens

See `:root` in [design/prototype/app.css](../design/prototype/app.css). Key values: `--ground #000`, `--surface #111`,
`--raised #2a2a2a`, `--text #fff`, `--muted #b4b4b4`, `--faint #949494`, `--accent #e0b04f`, panel radius 20,
inner radius 12, pills 999. The gap is 16 everywhere, padding 22, sidebar 210, top bar 64.

## Graph visuals

- **Entity type is shape, not colour.** People and figures are circles, places squares, works wide rounded slabs,
  ideas and groups diamonds. This replaces the earlier draft of one colour per type, which the skill rejects as a rainbow chart.
- Depth 1 is filled: a portrait or artwork inside the shape when one exists, otherwise #e6e6e6, or #8a8a8a for minor (importance 1).
  The size follows importance: 72 / 52 / 38.
- Depth 2 (context) nodes are **hollow**: a black fill with a 1.5px grey ring, and smaller. They read as "one step out".
- The book is at the centre with its cover artwork. Edges are 1px #333. Edges to the book are almost invisible.
- Selecting a node dims the rest to 28% and shows the edge labels of its neighbourhood. On first load the map is never dimmed.
- **Layout:** concentric. The book is in the centre, then the central figures, then everyone else, then the context ring.

## Screens (prototype)

| Screen | Its one question | Biggest block |
|---|---|---|
| Library (`index.html`) | Where am I in my reading, and what is waiting tonight? | Continue panel: cover art, the current canto, the strip, the faces new here |
| Book graph (`book.html`) | Who and what have I met so far, and how do they connect? | The graph, with a right rail for the selected entity and "new in this canto" |
| Entity (`entity.html`) | Who is this, what have they done so far, what should I look at or listen to? | Portrait and summary, then *Look* (artworks large), *Listen and read*, *To know him by*, with *In this book* and *Connections* in the rail |

## Rules carried from the skill (checked by its linter and inspector)

No gradients, glows, glass, shadows on resting things, emoji, icon-in-a-tinted-square, rainbow palettes, or index numbering.
Headlines run two lines at most. Every found picture carries its credit on the page. Run the skill's `lint.mjs --app` and
`inspect.mjs --app` on every UI change and fix every FAIL.
