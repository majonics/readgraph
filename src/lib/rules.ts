// Graph rules that a schema cannot express (docs/DATA_MODEL.md > Graph rules). Pure: used by the validator and in tests.
import type { Book, Entity, Graph, MediaItem, Progress } from '../schema/index.ts';
import { sectionIndex } from './sections.ts';

export interface Issue {
  file: string;
  path: string;
  message: string;
}

export interface RuleInput {
  slug: string;
  book: Book;
  graph: Graph;
  progress?: Progress;
  /** Every entity in the registry, by id. */
  entities: ReadonlyMap<string, Entity>;
}

export function checkBook({ slug, book, graph, progress, entities }: RuleInput): Issue[] {
  const issues: Issue[] = [];
  const bookFile = `library/books/${slug}/book.json`;
  const graphFile = `library/books/${slug}/graph.json`;
  const add = (file: string, path: string, message: string) => issues.push({ file, path, message });

  const order = sectionIndex(book);
  if (order.size !== book.sections.length) add(bookFile, 'sections', 'section ids must be unique');
  const knownSection = (file: string, path: string, id: string | undefined) => {
    if (id !== undefined && !order.has(id)) add(file, path, `unknown section "${id}"`);
  };

  if (book.slug !== slug) add(bookFile, 'slug', `slug "${book.slug}" does not match its folder "${slug}"`);
  if (!entities.has(book.author)) add(bookFile, 'author', `author "${book.author}" has no file in library/entities/`);

  const sectionedMedia = (file: string, path: string, media: MediaItem[]) =>
    media.forEach((m, i) => knownSection(file, `${path}[${i}].section`, m.section));
  sectionedMedia(bookFile, 'media', book.media);

  // Nodes: unique, resolvable, sections known.
  const depthOf = new Map<string, 1 | 2>();
  graph.nodes.forEach((n, i) => {
    const p = `nodes[${i}]`;
    if (depthOf.has(n.entity)) add(graphFile, p, `"${n.entity}" appears more than once`);
    depthOf.set(n.entity, n.depth);
    if (!entities.has(n.entity)) add(graphFile, `${p}.entity`, `"${n.entity}" has no file in library/entities/`);
    if (n.depth === 1) {
      knownSection(graphFile, `${p}.firstSection`, n.firstSection);
      n.inBook.forEach((note, j) => {
        knownSection(graphFile, `${p}.inBook[${j}].section`, note.section);
        if (before(order, note.section, n.firstSection)) {
          add(graphFile, `${p}.inBook[${j}]`, `note in "${note.section}" comes before "${n.entity}" first appears ("${n.firstSection}")`);
        }
      });
      sectionedMedia(graphFile, `${p}.media`, n.media);
    }
  });

  // Depth 2 hangs off depth 1 and stays a leaf (rule 2).
  graph.nodes.forEach((n, i) => {
    if (n.depth !== 2) return;
    n.via.forEach((v, j) => {
      if (depthOf.get(v) !== 1) add(graphFile, `nodes[${i}].via[${j}]`, `"${v}" is not a depth-1 node; context must hang off the book's own cast`);
    });
    const linked = graph.edges.some(
      (e) => (e.source === n.entity && n.via.includes(e.target)) || (e.target === n.entity && n.via.includes(e.source)),
    );
    if (!linked) add(graphFile, `nodes[${i}]`, `context "${n.entity}" needs an edge to one of its via nodes (${n.via.join(', ')})`);
  });

  // Edges (rules 3 and 6).
  const firstOf = new Map(graph.nodes.flatMap((n) => (n.depth === 1 ? [[n.entity, n.firstSection] as const] : [])));
  const seen = new Set<string>();
  graph.edges.forEach((e, i) => {
    const p = `edges[${i}]`;
    for (const end of [e.source, e.target]) {
      if (!depthOf.has(end)) add(graphFile, p, `"${end}" is not a node in this graph; edges never create nodes`);
    }
    if (e.source === e.target) add(graphFile, p, 'an edge cannot connect a node to itself');
    const key = [e.source, e.target, e.type].join('|');
    if (seen.has(key)) add(graphFile, p, `duplicate edge ${e.source} → ${e.target} (${e.type})`);
    seen.add(key);
    knownSection(graphFile, `${p}.section`, e.section);
    for (const end of [e.source, e.target]) {
      const first = firstOf.get(end);
      if (first && e.section && before(order, e.section, first)) {
        add(graphFile, `${p}.section`, `edge revealed in "${e.section}" before "${end}" first appears ("${first}")`);
      }
    }
  });

  // Global entity text is shown at every position, so it can never carry a section tag.
  for (const id of depthOf.keys()) {
    const ent = entities.get(id);
    ent?.media.forEach((m, i) => {
      if (m.section) add(`library/entities/${id}.json`, `media[${i}].section`, 'global media cannot carry a section; put book-specific media on the graph node');
    });
  }

  if (progress) knownSection(`library/books/${slug}/progress.json`, 'currentSection', progress.currentSection);

  return issues;
}

function before(order: Map<string, number>, a: string, b: string): boolean {
  const ia = order.get(a);
  const ib = order.get(b);
  return ia !== undefined && ib !== undefined && ia < ib;
}
