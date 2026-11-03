// Visible graph → Cytoscape element definitions. Pure, so the shape language is tested without a canvas.
// Shapes encode type (docs/DESIGN.md > Graph visuals): people and figures are circles, places squares,
// works wide slabs, ideas and groups diamonds; context is hollow. Gilt marks what is new at the reader's section.
import type { BookBundle, EntityType } from '../schema/index.ts';
import type { Visible } from './visibility.ts';
import { pictureOf, thumb } from './media.ts';
import { companionsOf, constellation, type Point } from './constellation.ts';

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

export const SIZE = { 3: 96, 2: 72, 1: 54 } as const;
const LEAF = 30;

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
  /** Ring for the ego graph's concentric layout: the focus (2) in the centre, every neighbour (1) on one ring. */
  level: number;
  w: number;
  h: number;
  shape: Shape;
  image?: string;
  kind?: KindId;
}
export interface EdgeData { id: string; source: string; target: string; label: string }
export type ElementDef =
  | { group: 'nodes'; data: NodeData; classes: string; position?: Point }
  | { group: 'edges'; data: EdgeData; classes: string };

/** The ids the view should open on: the companions and whoever is new at the reader's section. */
export function anchorsOf(els: ElementDef[]): string[] {
  return els.filter((e) => e.group === 'nodes' && /\b(companion|new)\b/.test(e.classes)).map((e) => e.data.id);
}

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

  // The whole-book map uses the reading spiral (constellation.ts); the ego graph keeps concentric rings around its focus.
  const order = new Map(bundle.book.sections.map((s, i) => [s.id, i]));
  const sizeOf = (imp: 1 | 2 | 3, type: EntityType) => (type === 'work' ? Math.round(SIZE[imp] * 1.25) : SIZE[imp]);
  let positions: Map<string, Point> | undefined;
  let companions: string[] = [];
  if (!opts.focus) {
    const degree = new Map<string, number>();
    for (const e of edges) for (const id of [e.source, e.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
    const layoutNodes = d1.map((n) => ({ id: n.entity, size: sizeOf(n.importance, typeOf(n.entity)), order: order.get(n.firstSection) ?? 0, importance: n.importance }));
    companions = companionsOf(layoutNodes, degree);
    positions = constellation(layoutNodes, d2.map((c) => ({ id: c.entity, size: LEAF, parents: c.via })), companions);
  }

  const out: ElementDef[] = [];
  for (const n of d1) {
    const type = typeOf(n.entity);
    const focused = opts.focus === n.entity;
    const h = focused ? SIZE[3] : SIZE[n.importance];
    const pic = pictureOf(bundle.entities[n.entity], n);
    const position = positions?.get(n.entity);
    out.push({
      group: 'nodes',
      classes: ['d1', n.firstSection === visible.at ? 'new' : '', pic ? 'img' : '', n.importance === 1 ? 'minor' : '', companions.includes(n.entity) ? 'companion' : ''].filter(Boolean).join(' '),
      data: {
        id: n.entity, label: name(n.entity), level: focused ? 2 : 1,
        w: focused ? h : sizeOf(n.importance, type), h, shape: SHAPE[type], kind: kindOf(type),
        ...(pic?.imageUrl ? { image: thumb(pic.imageUrl, 330) } : {}),
      },
      ...(position ? { position } : {}),
    });
  }
  for (const c of d2) {
    const type = typeOf(c.entity);
    const position = positions?.get(c.entity);
    out.push({
      group: 'nodes', classes: 'd2',
      data: { id: c.entity, label: name(c.entity), level: 1, w: type === 'work' ? Math.round(LEAF * 1.25) : LEAF, h: LEAF, shape: SHAPE[type], kind: kindOf(type) },
      ...(position ? { position } : {}),
    });
  }
  edges.forEach((e) => out.push({ group: 'edges', classes: '', data: { id: `${e.source}|${e.type}|${e.target}`, source: e.source, target: e.target, label: e.label } }));
  return out;
}
