---
name: chapter
description: Read-along update for a book the owner is reading now and for which no text is available (D-018). The owner says what happened in a chapter; you turn it into spoiler-tagged notes, new nodes, edges and context. Use when the owner says /chapter, or reports what they read in a chapter of a read-along book (first: la-bestia).
argument-hint: "<book-slug> <chapter number> [what happened]"
---

# /chapter

For read-along books the **owner's account is the source** for everything in the story: who appears, what happens, who
is related to whom. You never add story facts from memory, reviews or summaries, because one wrong chapter tag in a
thriller is a spoiler. Global, plot-free data (history, places, images, sources) is researched as in
[docs/GENERATION.md](../../../docs/GENERATION.md) and [docs/SOURCES.md](../../../docs/SOURCES.md).

## Inputs

- `$ARGUMENTS`: the slug, the chapter number, and usually the owner's account. If the account is missing, ask:
  "Who appeared in chapter N, and what happened?" A few lines are enough.
- The section id is `ch-NN` (two digits). It must exist in `book.json`.

## Procedure

1. **Read the account back as a plan** before editing. A short table:
   - new nodes: id, name, type, importance (1–3), a `role` written as of this chapter;
   - `inBook` notes for this chapter, one or two sentences each, in your words, on existing or new nodes;
   - new edges with `section: "ch-NN"`;
   - background to pull in (a real place, person or event the chapter names), as depth-1 or as context.
   Ask about anything unclear (spelling of names, who did what). **Wait for a yes.**
2. **Story nodes:** fictional characters get `summary` as a one-line introduction as of their first chapter, no plot
   (DATA_MODEL.md > Spoiler model). Never reveal later identities, motives or fates, even when you think you know them.
3. **Background:** research real people, places and events as a build-graph batch of one: `npm run wikidata`,
   `npm run commons`, sources fetched in this run with the project's own user agent. A site that refuses an honest request
   is unverified: leave it out. Context entries stay leaves (depth 2), with a `why` written as of this chapter.
4. **Write** `library/books/<slug>/graph.json` and new `library/entities/*.json`. Move `progress.json` to this chapter
   only if the owner says so (the app's strip does it too).
5. **Check:** `npm run validate -- <slug>`, `npm run check-links -- <slug>`, `npm test`. Report what changed in a few lines.

## Rules

- Notes are summaries in your own words. No quotes from the book.
- A node's `role` and a context `why` are shown from their first chapter on, so they say only what is known by then.
- If the owner's account contradicts an earlier note, ask which is right. Don't silently rewrite earlier chapters.
