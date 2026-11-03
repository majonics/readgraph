---
name: expand
description: Add one entity to an existing readgraph book graph, or enrich one already there (notes, context, sources). Use when the owner says /expand, or asks to add someone or something to a book's graph, or to find more or better sources for one node.
argument-hint: "<book-slug> <entity name or id>"
---

# /expand

You change **one node** (plus its depth-2 context) in an existing graph. Follow the research rules of
[docs/GENERATION.md](../../../docs/GENERATION.md) step 3–4 and [docs/SOURCES.md](../../../docs/SOURCES.md) for that node only.

1. Load `library/books/<slug>/book.json` and `graph.json`. Find the entity by id, name or `npm run wikidata -- search`.
2. **New node:** decide its `firstSection`, `importance` and `role` from the text. Show the owner the one-line plan and wait for a yes.
   **Existing node:** say what you will add (notes for later sections, a missing context entry, better sources).
3. Research it as a build-graph batch of one: Wikidata facts, a Commons image, `inBook` notes by section, 0–4 context leaves,
   edges to nodes already in the graph (with their `section`), and 2–5 verified sources.
4. Never create depth-3 nodes. A context entity proposed for this node may already exist as context for another node: then add
   this node to its `via` list rather than duplicating it.
5. Edit the JSON files, then run `npm run validate -- <slug>`, `npm run check-links -- <slug>` and `npm test`. Report what changed.
