// The reading spiral: a deterministic layout for the whole-book map (replaces concentric rings).
//  - the companions (the two best-connected central figures, e.g. Dante and Virgil) sit at the centre;
//  - everyone else sits on an elliptical Archimedean spiral in reading order, clockwise from twelve o'clock, so the map grows outward as you read;
//  - each context leaf orbits just outside its parent, so its edge is short and never crosses the map.
// Pure: positions are computed from sizes and order only, and tests assert that nothing overlaps.

export interface LayoutNode {
  id: string;
  /** Diameter in model units. */
  size: number;
  /** Reading order (section index of first appearance). */
  order: number;
  importance: 1 | 2 | 3;
}
export interface LayoutLeaf {
  id: string;
  size: number;
  parents: string[];
}
export interface Point { x: number; y: number }

export const LABEL_ROOM = 44; // space under a node for a two-line label
const GAP = 34; // free space between neighbours on the spiral
const TURN = 300; // distance between spiral turns (before squashing): room for satellites between them
// Screens are wide: the spiral is an ellipse, stretched sideways and squashed a little in height.
const KX = 1.45;
const KY = 0.85;
const ORBIT = 64; // distance from a node's edge to its satellites' centres

export function companionsOf(nodes: LayoutNode[], degree: ReadonlyMap<string, number>, max = 2): string[] {
  return nodes
    .filter((n) => n.importance === 3)
    .toSorted((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0) || a.order - b.order)
    .slice(0, max)
    .map((n) => n.id);
}

export function constellation(nodes: LayoutNode[], leaves: LayoutLeaf[], companions: string[]): Map<string, Point> {
  const pos = new Map<string, Point>();
  const centre = nodes.filter((n) => companions.includes(n.id));
  const ring = nodes.filter((n) => !companions.includes(n.id)).toSorted((a, b) => a.order - b.order || b.importance - a.importance);

  // Companions side by side at the centre.
  const span = centre.reduce((w, n) => w + n.size, 0) + GAP * Math.max(0, centre.length - 1);
  let x = -span / 2;
  for (const n of centre) {
    pos.set(n.id, { x: x + n.size / 2, y: 0 });
    x += n.size + GAP;
  }

  // r = a + bθ, with θ measured clockwise from twelve o'clock.
  const biggest = Math.max(0, ...centre.map((n) => n.size));
  const a = Math.max(span / 2, biggest) + LABEL_ROOM + 150;
  const b = TURN / (2 * Math.PI);
  let theta = 0;
  let prev: LayoutNode | undefined;
  for (const n of ring) {
    if (prev) {
      // Walk along the spiral until the chord to the previous node leaves room for both and a gap.
      const need = (prev.size + n.size) / 2 + GAP + 70; // +70: labels are wider than nodes
      const from = at(a, b, theta);
      let t = theta;
      do { t += 0.004; } while (dist(from, at(a, b, t)) < need);
      theta = t;
    }
    pos.set(n.id, at(a, b, theta));
    prev = n;
  }

  // Satellites: fanned outward around the first visible parent's angle.
  const byParent = new Map<string, LayoutLeaf[]>();
  for (const leaf of leaves) {
    const parent = leaf.parents.find((p) => pos.has(p));
    if (parent) byParent.set(parent, [...(byParent.get(parent) ?? []), leaf]);
  }
  for (const [parentId, kids] of byParent) {
    const p = pos.get(parentId);
    const parent = nodes.find((n) => n.id === parentId);
    if (!p || !parent) continue;
    const r = Math.hypot(p.x, p.y);
    const out = r < 1 ? -Math.PI / 2 : Math.atan2(p.y, p.x); // centre nodes send theirs upward
    const dist0 = parent.size / 2 + ORBIT + LABEL_ROOM / 2;
    const step = Math.min(0.9, 110 / dist0);
    kids.forEach((k, i) => {
      const angle = out + (i - (kids.length - 1) / 2) * step;
      pos.set(k.id, { x: p.x + Math.cos(angle) * dist0, y: p.y + Math.sin(angle) * dist0 });
    });
  }
  return pos;
}

function at(a: number, b: number, theta: number): Point {
  const r = a + b * theta;
  return { x: KX * r * Math.sin(theta), y: -KY * r * Math.cos(theta) };
}
const dist = (p: Point, q: Point) => Math.hypot(p.x - q.x, p.y - q.y);
