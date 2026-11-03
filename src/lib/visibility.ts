// The spoiler model (docs/DATA_MODEL.md > Spoiler model) as one pure function.
import type { BookBundle, BookNode, ContextNode, Edge, MediaItem } from '../schema/index.ts';
import { reached, sectionIndex } from './sections.ts';

export interface Visible {
  at: string;
  nodes: BookNode[];
  context: ContextNode[];
  edges: Edge[];
  bookMedia: MediaItem[];
  /** Depth-1 nodes whose first appearance is the current section. */
  newHere: BookNode[];
  /** Counts of what is hidden ahead. Never names. */
  ahead: { nodes: number; notes: number; media: number; edges: number };
}

/** What the reader may see at section `at`. Notes and media inside each returned node are already filtered. */
export function computeVisibility(bundle: BookBundle, at: string): Visible {
  const order = sectionIndex(bundle.book);
  if (!order.has(at)) throw new Error(`unknown section "${at}" for ${bundle.book.slug}`);
  const ok = (section: string | undefined) => section === undefined || reached(order, section, at);

  const ahead = { nodes: 0, notes: 0, media: 0, edges: 0 };
  const nodes: BookNode[] = [];
  const contextAll: ContextNode[] = [];
  for (const n of bundle.graph.nodes) {
    if (n.depth === 2) {
      contextAll.push(n);
      continue;
    }
    if (!ok(n.firstSection)) {
      ahead.nodes += 1;
      continue;
    }
    const inBook = n.inBook.filter((note) => ok(note.section));
    const media = n.media.filter((m) => ok(m.section));
    ahead.notes += n.inBook.length - inBook.length;
    ahead.media += n.media.length - media.length;
    nodes.push({ ...n, inBook, media });
  }

  const shown = new Set(nodes.map((n) => n.entity));
  const context = contextAll.filter((c) => c.via.some((v) => shown.has(v)));
  context.forEach((c) => shown.add(c.entity));

  const edges = bundle.graph.edges.filter((e) => shown.has(e.source) && shown.has(e.target) && ok(e.section));
  ahead.edges = bundle.graph.edges.length - edges.length;

  const bookMedia = bundle.book.media.filter((m) => ok(m.section));
  ahead.media += bundle.book.media.length - bookMedia.length;

  return { at, nodes, context, edges, bookMedia, newHere: nodes.filter((n) => n.firstSection === at), ahead };
}
