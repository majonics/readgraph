# design/

The visual reference for readgraph, made with the `design-taste-frontend` skill. See [docs/DESIGN.md](../docs/DESIGN.md).

- `prototype/`: a working static prototype. Open `prototype/index.html` in a browser. There is no build step. It needs network access for
  Google Fonts and Cytoscape (cdnjs).
  - `index.html` is the library, `book.html` the Divine Comedy graph, and `entity.html` is Virgil.
  - Click or arrow-key the canto strip to move your reading position. Everything recomputes and spoilers stay hidden. The position is kept in
    this browser only.
  - `assets/` holds public-domain artworks from Wikimedia Commons. Their credits are in `assets/credits.json` and on each page.
- `taste-notes.md`: the data inventory, each screen's question, the chosen face and signature element, and the final critique.
- `taste-direction.json`: the dealt style sheet (true-black-flat, seed 1898414268).

**Real:** every artwork, and every source link (verified 2026-11-02): Open Yale Courses, BBC *In Our Time* (two
episodes), the Stanford Encyclopedia of Philosophy, and Project Gutenberg.

**Sample (replace with generated data):** the reading position (Canto V), the edition, *The Decameron* and *The Prince*
with their entity lists, the cross-book counts, and the in-book notes, which were written by hand for this prototype.
