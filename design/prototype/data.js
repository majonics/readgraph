// Sample data for the design prototype. Shapes follow docs/DATA_MODEL.md, flattened into one file.
// Real: every artwork (Wikimedia Commons, see assets/credits.json) and every source URL (verified 2026-11-02).
// Sample: the reader's progress, the two finished books and their entity lists, the edition.
window.RG = (() => {
  const ROMAN = (n) => {
    const map = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
    let out = '';
    for (const [v, s] of map) while (n >= v) { out += s; n -= v; }
    return out;
  };

  // The spoiler axis: 34 + 33 + 33 cantos.
  const canticles = [
    { id: 'inf', name: 'Inferno', count: 34 },
    { id: 'purg', name: 'Purgatorio', count: 33 },
    { id: 'par', name: 'Paradiso', count: 33 },
  ];
  const sections = canticles.flatMap((c) =>
    Array.from({ length: c.count }, (_, i) => ({
      id: `${c.id}-${String(i + 1).padStart(2, '0')}`, // taste-skill-ignore: section ids, never shown
      group: c.name,
      n: i + 1,
      label: `Canto ${ROMAN(i + 1)}`,
    })),
  );
  const index = Object.fromEntries(sections.map((s, i) => [s.id, i]));

  const img = (file) => `assets/${file}`;

  // Depth-1 entities met in Inferno I–V.
  const met = [
    { id: 'dante', name: 'Dante Alighieri', type: 'person', first: 'inf-01', imp: 3, image: img('botticelli-dante.jpg'),
      role: 'The poet, and the pilgrim who walks through the poem',
      dates: '1265–1321',
      summary: 'Florentine poet and politician. Exiled from Florence in 1302, he wrote the Commedia in exile and died in Ravenna.',
      notes: [
        ['inf-01', 'Midway through life, lost in a dark wood, he is driven back from a sunlit hill by three beasts.'],
        ['inf-02', 'Doubts he is worthy of the journey until Virgil tells him who sent him.'],
        ['inf-05', 'Faints from pity after hearing Francesca’s story.'],
      ] },
    { id: 'virgil', name: 'Virgil', type: 'person', first: 'inf-01', imp: 3, image: img('virgil-mosaic-bardo.jpg'),
      role: 'Dante’s guide through Hell',
      dates: '70–19 BC',
      summary: 'Roman poet of the age of Augustus, born near Mantua. He wrote the Eclogues, the Georgics and the Aeneid, the epic of Rome’s founding. The Middle Ages read him as a sage, almost a prophet.',
      facts: [['Born', 'Andes, near Mantua, 70 BC'], ['Died', 'Brundisium, 19 BC'], ['Wrote', 'Eclogues, Georgics, Aeneid']],
      notes: [
        ['inf-01', 'Appears in the dark wood and offers to lead Dante by another road.'],
        ['inf-02', 'Explains that Beatrice came down from Heaven to ask for his help.'],
        ['inf-03', 'Silences Charon: the journey is willed where will is power.'],
        ['inf-04', 'Turns pale in Limbo, the circle that is his own home, and is greeted by the poets of antiquity.'],
        ['inf-05', 'Names the famous lovers in the storm for Dante, beginning with Semiramis and Dido.'],
        ['inf-09', 'hidden'], ['inf-11', 'hidden'], ['purg-01', 'hidden'], ['purg-30', 'hidden'],
      ] },
    { id: 'beasts', name: 'The three beasts', type: 'figure', first: 'inf-01', imp: 2, role: 'A leopard, a lion and a she-wolf that block Dante’s climb' },
    { id: 'greyhound', name: 'The Greyhound', type: 'concept', first: 'inf-01', imp: 1, role: 'Virgil’s prophecy of a hound who will drive the she-wolf back to Hell' },
    { id: 'beatrice', name: 'Beatrice', type: 'person', first: 'inf-02', imp: 3, image: img('holiday-dante-beatrice.jpg'), role: 'The woman who sends Virgil to rescue Dante' },
    { id: 'mary', name: 'The Virgin Mary', type: 'figure', first: 'inf-02', imp: 1, role: 'Moved by Dante’s plight, she sets the rescue in motion' },
    { id: 'lucy', name: 'Saint Lucy', type: 'figure', first: 'inf-02', imp: 1, role: 'Sent by Mary to Beatrice' },
    { id: 'gate', name: 'The Gate of Hell', type: 'place', first: 'inf-03', imp: 2, image: img('dore-08-abandon-hope.jpg'), role: 'Its inscription ends: abandon all hope, you who enter here' },
    { id: 'neutrals', name: 'The neutrals', type: 'group', first: 'inf-03', imp: 1, role: 'Souls who lived without blame or praise, chasing a banner forever' },
    { id: 'charon', name: 'Charon', type: 'figure', first: 'inf-03', imp: 2, image: img('dore-09-charon.jpg'), role: 'Ferryman of the Acheron, with eyes like burning coals' },
    { id: 'acheron', name: 'Acheron', type: 'place', first: 'inf-03', imp: 1, role: 'The river every soul crosses into Hell' },
    { id: 'contrapasso', name: 'Contrapasso', type: 'concept', first: 'inf-03', imp: 2, role: 'The rule that a punishment mirrors its sin' },
    { id: 'limbo', name: 'Limbo', type: 'place', first: 'inf-04', imp: 2, image: img('dore-12-limbo-poets.jpg'), role: 'The first circle: the virtuous unbaptised, sighing but not tormented' },
    { id: 'homer', name: 'Homer', type: 'person', first: 'inf-04', imp: 2, role: 'Leads the poets of antiquity who greet Virgil' },
    { id: 'ovid', name: 'Ovid', type: 'person', first: 'inf-04', imp: 1, role: 'One of the four poets who walk out to meet Virgil' },
    { id: 'aristotle', name: 'Aristotle', type: 'person', first: 'inf-04', imp: 2, role: '“The master of those who know”, seated among the philosophers' },
    { id: 'moses', name: 'Moses', type: 'person', first: 'inf-04', imp: 1, role: 'Taken out of Limbo when Christ descended, as Virgil recalls' },
    { id: 'minos', name: 'Minos', type: 'figure', first: 'inf-05', imp: 2, image: img('dore-13-minos.jpg'), role: 'Judge of the damned: his tail coils once for each circle a soul must fall' },
    { id: 'second-circle', name: 'The second circle', type: 'place', first: 'inf-05', imp: 1, role: 'The lustful, whirled forever by a storm' },
    { id: 'francesca', name: 'Francesca da Rimini', type: 'person', first: 'inf-05', imp: 3, image: img('dore-paolo-francesca.jpg'), role: 'Tells how a book led to the first kiss' },
    { id: 'paolo', name: 'Paolo Malatesta', type: 'person', first: 'inf-05', imp: 2, role: 'Weeps beside Francesca as she speaks' },
    { id: 'dido', name: 'Dido', type: 'figure', first: 'inf-05', imp: 1, role: 'Queen of Carthage, among the lovers in the storm' },
    { id: 'cleopatra', name: 'Cleopatra', type: 'person', first: 'inf-05', imp: 1, role: 'Among the lovers in the storm' },
    { id: 'helen', name: 'Helen of Troy', type: 'figure', first: 'inf-05', imp: 1, role: 'Among the lovers in the storm' },
    { id: 'lancelot', name: 'Lancelot du Lac', type: 'work', first: 'inf-05', imp: 2, role: 'The romance Paolo and Francesca were reading' },
  ];

  // Depth-1 entities further on. Their names are never rendered while they are ahead.
  const ahead = [
    ['cerberus', 'inf-06'], ['ciacco', 'inf-06'], ['plutus', 'inf-07'], ['phlegyas', 'inf-08'], ['filippo-argenti', 'inf-08'],
    ['furies', 'inf-09'], ['theseus', 'inf-09'], ['farinata', 'inf-10'], ['guido-cavalcanti', 'inf-10'], ['minotaur', 'inf-12'],
    ['pier-delle-vigne', 'inf-13'], ['brunetto-latini', 'inf-15'], ['geryon', 'inf-17'], ['boniface-viii', 'inf-19'],
    ['ulysses', 'inf-26'], ['guido-da-montefeltro', 'inf-27'], ['hannibal', 'inf-31'], ['ugolino', 'inf-33'], ['lucifer', 'inf-34'],
    ['cato', 'purg-01'], ['manfred', 'purg-03'], ['sordello', 'purg-06'], ['giotto', 'purg-11'], ['cyrus', 'purg-12'],
    ['statius', 'purg-21'], ['matelda', 'purg-28'], ['justinian', 'par-06'], ['romulus', 'par-08'], ['thomas-aquinas', 'par-10'],
    ['cacciaguida', 'par-15'], ['bernard', 'par-31'],
  ].map(([id, first]) => ({ id, first, ahead: true }));

  // Depth-2 context: leaves, visible when any parent is visible.
  const context = [
    { id: 'florence', name: 'Florence', type: 'place', via: ['dante'], image: img('schedel-florence-1493.jpg'), why: 'Dante’s city: its feuds explain whom he places in Hell' },
    { id: 'guelphs', name: 'Guelphs and Ghibellines', type: 'group', via: ['dante'], why: 'The factional war that ended in his exile in 1302' },
    { id: 'ravenna', name: 'Ravenna', type: 'place', via: ['dante', 'francesca'], why: 'Francesca’s home, and the city where Dante died in exile' },
    { id: 'mantua', name: 'Mantua', type: 'place', via: ['virgil'], why: 'Virgil’s birthplace, named in his first words to Dante' },
    { id: 'aeneid', name: 'The Aeneid', type: 'work', via: ['virgil'], why: 'His guide’s own epic, which Dante knew by heart' },
    { id: 'augustan-rome', name: 'Augustan Rome', type: 'era', via: ['virgil'], why: 'The empire Virgil wrote for, which Dante saw as willed by Providence' },
    { id: 'vita-nuova', name: 'Vita Nuova', type: 'work', via: ['beatrice'], why: 'Dante’s early book of his love for her' },
    { id: 'rimini', name: 'Rimini', type: 'place', via: ['francesca', 'paolo'], why: 'Seat of the Malatesta family she married into' },
    { id: 'iliad', name: 'The Iliad', type: 'work', via: ['homer'], why: 'The poem Dante knew only by reputation: he read no Greek' },
    { id: 'carthage', name: 'Carthage', type: 'place', via: ['dido'], why: 'Dido’s city, where Aeneas left her' },
  ];

  const edges = [
    ['dante', 'virgil', 'guided by', 'inf-01'], ['beasts', 'dante', 'block', 'inf-01'], ['virgil', 'greyhound', 'prophesies', 'inf-01'],
    ['beatrice', 'virgil', 'sends', 'inf-02'], ['mary', 'lucy', 'sends', 'inf-02'], ['lucy', 'beatrice', 'sends', 'inf-02'],
    ['dante', 'beatrice', 'loves', 'inf-02'], ['dante', 'gate', 'passes', 'inf-03'], ['gate', 'neutrals', 'inside', 'inf-03'],
    ['charon', 'acheron', 'ferries across', 'inf-03'], ['neutrals', 'contrapasso', 'first example', 'inf-03'],
    ['virgil', 'charon', 'silences', 'inf-03'], ['virgil', 'limbo', 'dwells in', 'inf-04'], ['homer', 'virgil', 'greets', 'inf-04'],
    ['ovid', 'homer', 'walks with', 'inf-04'], ['homer', 'limbo', 'in', 'inf-04'], ['aristotle', 'limbo', 'in', 'inf-04'],
    ['moses', 'limbo', 'freed from', 'inf-04'], ['minos', 'second-circle', 'guards', 'inf-05'], ['minos', 'dante', 'warns', 'inf-05'],
    ['virgil', 'minos', 'silences', 'inf-05'], ['francesca', 'paolo', 'loves', 'inf-05'], ['francesca', 'lancelot', 'read', 'inf-05'],
    ['paolo', 'lancelot', 'read', 'inf-05'], ['francesca', 'second-circle', 'in', 'inf-05'], ['paolo', 'second-circle', 'in', 'inf-05'],
    ['dido', 'second-circle', 'in', 'inf-05'], ['cleopatra', 'second-circle', 'in', 'inf-05'], ['helen', 'second-circle', 'in', 'inf-05'],
    ['dante', 'francesca', 'pities', 'inf-05'],
    // to context
    ['dante', 'florence', 'born in'], ['dante', 'guelphs', 'exiled by'], ['dante', 'ravenna', 'died in'],
    ['francesca', 'ravenna', 'born in'], ['virgil', 'mantua', 'born near'], ['virgil', 'aeneid', 'wrote'],
    ['virgil', 'augustan-rome', 'lived in'], ['beatrice', 'vita-nuova', 'subject of'], ['francesca', 'rimini', 'married into'],
    ['paolo', 'rimini', 'brother of its lord'], ['homer', 'iliad', 'wrote'], ['dido', 'carthage', 'queen of'], ['dido', 'aeneid', 'appears in'],
  ].map(([source, target, label, section]) => ({ source, target, label, section }));

  // Sources. `section` = hidden until the reader reaches it.
  const media = {
    book: [
      { kind: 'Read', title: 'Dante Alighieri', creator: 'Stanford Encyclopedia of Philosophy', publisher: 'Stanford University',
        url: 'https://plato.stanford.edu/entries/dante/', meta: 'Reference article', why: 'The philosophy under the poem, without plot' },
      { kind: 'Listen', title: 'Dante’s Inferno', creator: 'In Our Time, with John Took and Claire Honess', publisher: 'BBC Radio 4',
        url: 'https://www.bbc.co.uk/programmes/b00f05zj', minutes: 45, section: 'inf-34', why: 'Three Dante scholars on the whole of Inferno' },
      { kind: 'Read', title: 'Hell, in Longfellow’s translation', creator: 'Project Gutenberg', publisher: 'Project Gutenberg',
        url: 'https://www.gutenberg.org/ebooks/1001', meta: 'Full text', why: 'The text itself, free, in the translation this graph follows' },
    ],
    virgil: [
      { kind: 'Look', title: 'Dante meets Virgil', creator: 'Gustave Doré', year: '1857', image: img('dore-04-dante-meets-virgil.jpg'), section: 'inf-01', canto: 'Canto I' },
      { kind: 'Look', title: 'Virgil and Beatrice', creator: 'Gustave Doré', year: '1857', image: img('dore-07-beatrice.jpg'), section: 'inf-02', canto: 'Canto II' },
      { kind: 'Look', title: 'Limbo: Dante among the poets', creator: 'Gustave Doré', year: '1857', image: img('dore-12-limbo-poets.jpg'), section: 'inf-04', canto: 'Canto IV' },
      { kind: 'Listen', title: 'Inferno I, II, III, IV', creator: 'Giuseppe Mazzotta, Dante in Translation', publisher: 'Open Yale Courses',
        url: 'https://oyc.yale.edu/italian-language-and-literature/ital-310/lecture-3', meta: 'Lecture, audio and transcript', section: 'inf-04',
        why: 'A Yale Dante scholar on why a pagan poet is the right guide' },
      { kind: 'Listen', title: 'The Aeneid', creator: 'In Our Time, with Edith Hall and Philip Hardie', publisher: 'BBC Radio 4',
        url: 'https://www.bbc.co.uk/programmes/p003k9c1', minutes: 45, why: 'Virgil’s own epic, and why Rome needed it' },
      { kind: 'Read', title: 'The Aeneid, in Dryden’s translation', creator: 'Project Gutenberg', publisher: 'Project Gutenberg',
        url: 'https://www.gutenberg.org/ebooks/228', meta: 'Full text', why: 'Book VI is the descent Dante borrows from' },
    ],
  };

  // The library. The two finished books are sample data with short entity lists.
  const books = [
    { slug: 'divine-comedy', title: 'The Divine Comedy', author: 'Dante Alighieri', edition: 'Trans. Henry Wadsworth Longfellow',
      cover: img('michelino-dante-three-kingdoms.jpg'), status: 'reading', at: 'inf-05' },
    { slug: 'decameron', title: 'The Decameron', author: 'Giovanni Boccaccio', cover: img('waterhouse-decameron.jpg'), status: 'finished', sectionsLabel: '100 tales',
      entities: ['florence', 'boccaccio', 'black-death', 'fiesole', 'pampinea', 'fiammetta', 'dioneo', 'filostrato', 'emilia', 'lauretta', 'neifile', 'elissa',
        'filomena', 'panfilo', 'ser-ciappelletto', 'andreuccio', 'griselda', 'federigo', 'frate-cipolla', 'calandrino', 'giotto', 'guido-cavalcanti'] },
    { slug: 'prince', title: 'The Prince', author: 'Niccolò Machiavelli', cover: img('santi-di-tito-machiavelli.jpg'), status: 'finished', sectionsLabel: '26 chapters',
      entities: ['florence', 'machiavelli', 'lorenzo-de-medici', 'cesare-borgia', 'alexander-vi', 'julius-ii', 'louis-xii', 'ferdinand-of-aragon',
        'savonarola', 'francesco-sforza', 'agathocles', 'hannibal', 'moses', 'cyrus', 'romulus', 'theseus', 'fortuna', 'virtu'] },
  ];
  const names = { florence: 'Florence', moses: 'Moses' };

  // ---- derived values: everything on screen is computed from the rows above ----
  const all = [...met, ...ahead];
  const byId = Object.fromEntries([...met, ...context].map((e) => [e.id, e]));
  const sectionOf = (id) => sections[index[id]];
  const visibleAt = (at) => {
    const s = index[at];
    const nodes = met.filter((e) => index[e.first] <= s);
    const ids = new Set(nodes.map((n) => n.id));
    const ctx = context.filter((c) => c.via.some((v) => ids.has(v)));
    ctx.forEach((c) => ids.add(c.id));
    const es = edges.filter((e) => ids.has(e.source) && ids.has(e.target) && (!e.section || index[e.section] <= s));
    const newHere = nodes.filter((n) => n.first === at);
    const aheadAll = all.filter((e) => index[e.first] > s);
    const aheadInCanticle = aheadAll.filter((e) => sectionOf(e.first).group === sectionOf(at).group);
    return { nodes, context: ctx, edges: es, newHere, ahead: aheadAll, aheadInCanticle };
  };
  const debutsPerSection = sections.map((s) => all.filter((e) => e.first === s.id).length);

  const comedyIds = new Set([...all, ...context].map((e) => e.id));
  const otherBooks = books.filter((b) => b.entities);
  const shared = [...new Set(otherBooks.flatMap((b) => b.entities))]
    .filter((id) => comedyIds.has(id))
    .map((id) => ({ id, books: ['divine-comedy', ...otherBooks.filter((b) => b.entities.includes(id)).map((b) => b.slug)] }));
  books[0].entityCount = comedyIds.size;
  otherBooks.forEach((b) => { b.entityCount = b.entities.length; });
  const atlas = new Set([...comedyIds, ...otherBooks.flatMap((b) => b.entities)]);

  // the figures that must agree
  const v5 = visibleAt('inf-05');
  console.assert(debutsPerSection.reduce((a, b) => a + b, 0) === all.length, 'debuts sum to the cast');
  console.assert(v5.nodes.length + v5.ahead.length === all.length, 'met + ahead = cast');
  console.assert(context.every((c) => c.via.every((v) => byId[v] && !byId[v].via)), 'context hangs off depth-1 nodes only');
  console.assert(edges.every((e) => byId[e.source] && byId[e.target]), 'every edge resolves');

  return { ROMAN, canticles, sections, index, sectionOf, met, ahead, context, edges, media, books, byId, names,
    visibleAt, debutsPerSection, shared, atlas, defaultAt: 'inf-05' };
})();
