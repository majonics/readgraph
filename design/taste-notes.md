# readgraph: design notes (taste-skill app run)

## 2.1 Inventory: data and jobs
- Objects: books (title, author, translation, 100 sections for the Comedy), entities (type, depth, importance,
  firstSection, role, in-book notes per canto), edges (label, section), media (kind, creator, publisher, minutes, why, section).
- Magnitudes: one book being read, 2 finished. The Comedy has ~60 entities in a first build, of which 25 are met by Canto V,
  plus 9 context nodes. 3–7 media items per central entity. Cantos run 1–100 (34 + 33 + 33).
- People: one reader, the owner. Opens it in the evening before or after reading a canto, for 10–20 minutes, on a laptop,
  sometimes a phone in bed.
- Jobs, most frequent first: (1) see who/what is new in the canto just read, (2) open one figure and look/listen,
  (3) move progress to the next canto, (4) start a graph for a new book (done in Claude Code: the app shows the command).
- Product's own things: the name readgraph; the books (cover art = a period artwork); the cantos; Doré's plates;
  the figures as portraits; the reader's position in the poem.

## 2.2 Each screen's question and finding
- Home (library): "Where am I in my reading, and what is waiting for me tonight?"
  Finding: "Canto V brings 8 new: Minos, Francesca, Paolo…". Biggest block: Continue reading (the Comedy, with the canto strip).
  Job one click away: Open the graph.
- Book graph (builder): "Who and what have I met so far, and how do they connect?"
  Finding: the 8 nodes new in Canto V, marked in gold. Biggest block: the graph. Job: select a node, then open it.
- Entity (detail): "Who is Virgil, what has he done so far, and what should I look at or listen to?"
  Biggest block: the hero picture + summary. Job: play or open the best source.

## 2.3 Style, face and signature
- Style: true-black-flat (seed 1898414268). Why: one reader, evening sessions, picture-led (Doré's engravings and
  Renaissance paintings sit best on true black), and colour must stay on the data.
- Face: the one data hue is the gilt of an illuminated manuscript, #e0b04f, in place of the dealt lime. It marks only
  "where you are": the current canto, and the nodes new in it.
- Signature element: the canto strip, all 100 cantos with the read ones, the current one in gilt, and the first appearances
  as a unit column of dots above each canto (counts only ahead, never names). It is also the progress control (role=slider).
- Entity types are shapes, not hues (person/figure circle, place square, work wide slab, idea/group diamond); context nodes
  are hollow. This keeps the graph to one hue and so obeys the rainbow ban.
- Second face: EB Garamond, one job: the wordmark and the home greeting.
- Grid: 12 × 77 + 11 × 16 = 1100 (home column). Gap 16 everywhere (the home pattern's gutter, over the sheet's 14, so the grid sums close).

## 2.7 Critique: final round (round 3, judged from screenshots at 1440 / 768 / 390)
1. Question answered by the biggest thing, read first? Home: yes. Continue (picture, Canto V, the strip, the faces) is the largest block.
   Book: yes, the graph. Entity: mostly. The portrait and summary lead, but "In this book" in the rail competes; acceptable.
2. Shared edges, no dead strips? Book and entity columns end level (stretched map / ego panel). Remaining: the entity
   Connections panel centres its graph in a tall panel, leaving ~100px of air above it on desktop.
3. Colour only on data? Gilt appears only on the current canto, the new-in-canto rings, the current note. The primary is a white pill.
4. Numbers agree? 25 met + 31 ahead = 56 cast (asserted); "8 new" = 8 chips = 8 list rows = 8 gilt rings; 19 ahead in Inferno
   is computed; 2 shared + 6 later = 8 shared (computed from the book lists).
5. Zeros and dashes? "No one new in this canto" covers zero. Locked items are counted, never named.
6. Legend matches marks? Shapes in the legend use the node shapes and fills; the context ring and the gilt ring match.
7. Phone: the nav folds into a menu; the strip shows only the current canticle; rows are two-line.
Defended WARN: app-title-size on home (44px serif greeting). The dealt home pattern sets the greeting as the h1 in a serif at 48px.
Still short: graph edge labels are small at fit zoom; the entity Connections panel has air above the graph; search is visual only.
