// The entity page as data: everything /book/:slug/e/:id shows at reading position `at`, already spoiler-filtered.
// Built on computeVisibility, so it can only ever contain what the map may show.
import type { BookBundle, BookNode, ContextNode, Entity, MediaItem } from '../schema/index.ts';
import { pictureOf } from './media.ts';
import { sectionIndex } from './sections.ts';
import { computeVisibility, type Visible } from './visibility.ts';

export type MediaGroup = 'look' | 'watch' | 'read';
type InBookNote = BookNode['inBook'][number];

/** Look is for pictures shown inline; something without an image to show is read (or opened) instead. */
export function groupOf(m: MediaItem): MediaGroup {
  if ((m.kind === 'artwork' || m.kind === 'image' || m.kind === 'map') && m.imageUrl) return 'look';
  if (m.kind === 'video' || m.kind === 'lecture' || m.kind === 'podcast' || m.kind === 'audio') return 'watch';
  return 'read';
}

export interface EntityRef { id: string; name: string }
export interface ContextEntry extends EntityRef { why: string; summary: string; picture?: MediaItem }
export interface Neighbour extends EntityRef {
  /** The edge as a sentence: `out` reads "<this> label <other>", `in` reads "<other> label <this>". */
  direction: 'out' | 'in';
  label: string;
  section?: string;
}

export interface EntityView {
  id: string;
  depth: 1 | 2;
  entity: Entity;
  name: string;
  /** Plot-free, shown at every position. */
  summary: string;
  facts: string[];
  picture?: MediaItem;
  /** depth 1: the role as of its first section; depth 2: why it is here. */
  role: string;
  firstSection?: string;
  /** depth 2 only: the visible figures this context belongs to. */
  via: EntityRef[];
  /** In-book notes up to `at`, in reading order. */
  notes: InBookNote[];
  /** Book-specific first (in reading order), then the entity's global media. */
  media: Record<MediaGroup, MediaItem[]>;
  /** depth 1 only: its visible context leaves. */
  context: ContextEntry[];
  neighbours: Neighbour[];
  /** What is still ahead for this entity. Counts only, never content. */
  hidden: { notes: number; media: number };
}

/** The entity page for `id` at section `at`, or undefined when the reader hasn't met it yet (or it isn't in this book). */
export function entityView(bundle: BookBundle, id: string, at: string, visible: Visible = computeVisibility(bundle, at)): EntityView | undefined {
  const entity = bundle.entities[id];
  const node: BookNode | ContextNode | undefined = visible.nodes.find((n) => n.entity === id) ?? visible.context.find((c) => c.entity === id);
  if (!entity || !node) return undefined;

  const lang = bundle.book.language;
  const text = (m: Partial<Record<string, string>>) => m[lang] ?? Object.values(m)[0] ?? '';
  const nameOf = (e: string) => { const x = bundle.entities[e]; return x ? text(x.name) : e; };
  const order = sectionIndex(bundle.book);
  const pos = (s: string | undefined) => (s === undefined ? Infinity : order.get(s) ?? Infinity);

  const full = bundle.graph.nodes.find((n) => n.entity === id);
  const hidden = node.depth === 1 && full?.depth === 1
    ? { notes: full.inBook.length - node.inBook.length, media: full.media.length - node.media.length }
    : { notes: 0, media: 0 };

  // The About picture is shown once: a figure without a portrait borrows its first book picture, which then leaves Look.
  const picture = pictureOf(entity, node.depth === 1 ? node : undefined);
  const bookMedia = node.depth === 1 ? node.media.toSorted((a, b) => pos(a.section) - pos(b.section)) : [];
  const media: Record<MediaGroup, MediaItem[]> = { look: [], watch: [], read: [] };
  for (const m of [...bookMedia, ...entity.media]) if (m !== picture) media[groupOf(m)].push(m);

  const context: ContextEntry[] = node.depth === 1
    ? visible.context.filter((c) => c.via.includes(id)).map((c) => {
        const e = bundle.entities[c.entity];
        const picture = pictureOf(e);
        return { id: c.entity, name: nameOf(c.entity), why: c.why, summary: e ? text(e.summary) : '', ...(picture ? { picture } : {}) };
      })
    : [];

  const shown = new Set([...visible.nodes, ...visible.context].map((n) => n.entity));
  const via = node.depth === 2 ? node.via.filter((v) => shown.has(v)).map((v) => ({ id: v, name: nameOf(v) })) : [];

  const neighbours: Neighbour[] = visible.edges
    .filter((e) => e.source === id || e.target === id)
    .map((e) => {
      const other = e.source === id ? e.target : e.source;
      return { id: other, name: nameOf(other), direction: e.source === id ? 'out' : 'in', label: e.label, ...(e.section ? { section: e.section } : {}) };
    });

  return {
    id, depth: node.depth, entity, name: text(entity.name), summary: text(entity.summary),
    facts: entity.facts?.[lang] ?? Object.values(entity.facts ?? {})[0] ?? [],
    ...(picture ? { picture } : {}),
    role: node.depth === 1 ? node.role : node.why,
    ...(node.depth === 1 ? { firstSection: node.firstSection } : {}),
    via,
    notes: node.depth === 1 ? node.inBook.toSorted((a, b) => pos(a.section) - pos(b.section)) : [],
    media, context, neighbours, hidden,
  };
}
