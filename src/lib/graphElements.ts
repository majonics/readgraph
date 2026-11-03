// Visible graph → Cytoscape element definitions. Pure, so the shape language is tested without a canvas.
// Shapes encode type (docs/DESIGN.md > Graph visuals): people and figures are circles, places squares,
// works wide slabs, ideas and groups diamonds; context is hollow. Gilt marks what is new at the reader's section.
import type { BookBundle, EntityType } from '../schema/index.ts';
import type { Visible } from './visibility.ts';
import { pictureOf, thumb } from './media.ts';

export type Shape = 'ellipse' | 'rectangle' | 'round-rectangle' | 'diamond';
export const SHAPE: Record<EntityType, Shape> = {
  person: 'ellipse', figure: 'ellipse', place: 'rectangle', work: 'round-rectangle',
  concept: 'diamond', group: 'diamond', event: 'diamond', era: 'diamond',
};
/** The legend's groups, in order. */
export const KINDS = [
  { id: 'people', label: 'People and figures', types: ['person', 'figure'] },
  { id: 'places', label: 'Places', types: ['place'] },
  { id: 'works', label: 'Works', types: ['work'] },
  { id: 'ideas', label: 'Ideas and groups', types: ['concept', 'group', 'event', 'era'] },
] as const satisfies readonly { id: string; label: string; types: readonly EntityType[] }[];
export type KindId = (typeof KINDS)[number]['id'];
export const kindOf = (t: EntityType): KindId => KINDS.find((k) => (k.types as readonly EntityType[]).includes(t))?.id ?? 'ideas';

const SIZE = { 3: 72, 2: 52, 1: 38 } as const;
export const BOOK_ID = '__book__';

export interface ElementOptions {
  /** Show only these kinds (all when undefined). */
  kinds?: ReadonlySet<KindId>;
  /** Hide depth-2 context. */
  bookOnly?: boolean;
  /** Ego view: this entity, its neighbours, nothing else, no book node. */
  focus?: string;
}

export interface NodeData {
  id: string;
  label: string;
  level: number;
  w: number;
  h: number;
  shape: Shape;
  image?: string;
  kind?: KindId;
}
export interface EdgeData { id: string; source: string; target: string; label: string }
export type ElementDef = { group: 'nodes'; data: NodeData; classes: string } | { group: 'edges'; data: EdgeData; classes: string };

export function graphElements(bundle: BookBundle, visible: Visible, opts: ElementOptions = {}): ElementDef[] {
  const name = (id: string) => {
    const e = bundle.entities[id];
    return e ? (e.name[bundle.book.language] ?? Object.values(e.name)[0] ?? id) : id;
  };
  const typeOf = (id: string): EntityType => bundle.entities[id]?.type ?? 'concept';
  const kindOk = (id: string) => !opts.kinds || opts.kinds.has(kindOf(typeOf(id)));

  let d1 = visible.nodes.filter((n) => kindOk(n.entity));
  let d2 = opts.bookOnly ? [] : visible.context.filter((c) => kindOk(c.entity));
  let edges = visible.edges;

  if (opts.focus) {
    const near = new Set([opts.focus]);
    for (const e of edges) {
      if (e.source === opts.focus) near.add(e.target);
      if (e.target === opts.focus) near.add(e.source);
    }
    d1 = d1.filter((n) => near.has(n.entity));
    d2 = d2.filter((c) => near.has(c.entity));
  }
  const present = new Set([...d1.map((n) => n.entity), ...d2.map((c) => c.entity)]);
  edges = edges.filter((e) => present.has(e.source) && present.has(e.target));

  const out: ElementDef[] = [];
  if (!opts.focus) {
    const cover = bundle.book.cover?.imageUrl;
    out.push({ group: 'nodes', classes: 'book', data: { id: BOOK_ID, label: '', level: 4, w: 84, h: 84, shape: 'ellipse', ...(cover ? { image: thumb(cover, 330) } : {}) } });
  }
  for (const n of d1) {
    const type = typeOf(n.entity);
    const focused = opts.focus === n.entity;
    const size = focused ? 84 : SIZE[n.importance];
    const pic = pictureOf(bundle.entities[n.entity], n);
    out.push({
      group: 'nodes',
      classes: ['d1', n.firstSection === visible.at ? 'new' : '', pic ? 'img' : '', n.importance === 1 ? 'minor' : ''].filter(Boolean).join(' '),
      data: {
        id: n.entity, label: name(n.entity), level: focused ? 4 : n.importance === 3 ? 3 : 2,
        w: type === 'work' ? Math.round(size * 1.5) : size, h: size, shape: SHAPE[type], kind: kindOf(type),
        ...(pic?.imageUrl ? { image: thumb(pic.imageUrl, 330) } : {}),
      },
    });
    if (!opts.focus) out.push({ group: 'edges', classes: 'to-book', data: { id: `${BOOK_ID}-${n.entity}`, source: BOOK_ID, target: n.entity, label: '' } });
  }
  for (const c of d2) {
    const type = typeOf(c.entity);
    out.push({ group: 'nodes', classes: 'd2', data: { id: c.entity, label: name(c.entity), level: 1, w: type === 'work' ? 39 : 26, h: 26, shape: SHAPE[type], kind: kindOf(type) } });
  }
  edges.forEach((e) => out.push({ group: 'edges', classes: '', data: { id: `${e.source}|${e.type}|${e.target}`, source: e.source, target: e.target, label: e.label } }));
  return out;
}
