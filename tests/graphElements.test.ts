import { describe, expect, it } from 'vitest';
import { anchorsOf, graphElements, type ElementDef } from '../src/lib/graphElements.ts';
import { constellation, type LayoutLeaf, type LayoutNode } from '../src/lib/constellation.ts';
import { thumb } from '../src/lib/media.ts';
import { computeVisibility } from '../src/lib/visibility.ts';
import { tinyBundle } from './helpers.ts';

const nodeIds = (els: ElementDef[]) => els.filter((e) => e.group === 'nodes').map((e) => e.data.id);
const node = (els: ElementDef[], id: string) => els.find((e) => e.group === 'nodes' && e.data.id === id);

describe('graphElements', () => {
  const b = tinyBundle();
  const x = b.entities.x;
  if (x) b.entities.x = { ...x, type: 'place' };

  it('lays the whole-book map out with positions and no book node', () => {
    const els = graphElements(b, computeVisibility(b, 's-03'));
    expect(nodeIds(els)).toEqual(['a', 'b', 'x']);
    expect(els.every((e) => e.group === 'edges' || e.position)).toBe(true);
  });

  it('marks companions and nodes new at the current section, and encodes type as shape and context as hollow', () => {
    const els = graphElements(b, computeVisibility(b, 's-03'));
    expect(node(els, 'b')?.classes).toContain('new');
    expect(node(els, 'a')?.classes).toContain('companion');
    expect(node(els, 'a')?.data).toMatchObject({ shape: 'ellipse', w: 96 });
    expect(node(els, 'x')).toMatchObject({ classes: 'd2', data: { shape: 'rectangle', level: 1 } });
    expect(anchorsOf(els).sort()).toEqual(['a', 'b']);
  });

  it('drops context with bookOnly and filters by kind', () => {
    const v = computeVisibility(b, 's-05');
    expect(nodeIds(graphElements(b, v, { bookOnly: true }))).toEqual(['a', 'b', 'c']);
    expect(nodeIds(graphElements(b, v, { kinds: new Set(['places']) }))).toEqual(['x']);
  });

  it('builds an ego graph without positions (laid out around its focus)', () => {
    const els = graphElements(b, computeVisibility(b, 's-05'), { focus: 'b' });
    expect(nodeIds(els).sort()).toEqual(['a', 'b', 'c']);
    expect(node(els, 'b')?.data).toMatchObject({ level: 2, w: 96 });
    expect(els.flatMap((e) => (e.group === 'nodes' && e.data.id !== 'b' ? [e.data.level] : []))).toEqual([1, 1]);
    expect(els.some((e) => e.group === 'nodes' && e.position)).toBe(false);
  });
});

describe('constellation (the reading spiral)', () => {
  const nodes: LayoutNode[] = Array.from({ length: 40 }, (_, i) => ({
    id: `n${i}`, size: i < 2 ? 96 : i % 3 === 0 ? 72 : 54, order: i, importance: i < 2 ? 3 : 2,
  }));
  const leaves: LayoutLeaf[] = nodes.flatMap((n, i) => (i % 2 ? [] : [{ id: `${n.id}-a`, size: 30, parents: [n.id] }, { id: `${n.id}-b`, size: 30, parents: [n.id] }]));
  const pos = constellation(nodes, leaves, ['n0', 'n1']);
  const sizes = new Map([...nodes, ...leaves].map((n) => [n.id, n.size]));

  it('places every node, and no two overlap', () => {
    expect(pos.size).toBe(nodes.length + leaves.length);
    const ids = [...pos.keys()];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const [a, c] = [ids[i] ?? '', ids[j] ?? ''];
      const p = pos.get(a), q = pos.get(c);
      if (!p || !q) throw new Error('missing position');
      const gap = Math.hypot(p.x - q.x, p.y - q.y) - ((sizes.get(a) ?? 0) + (sizes.get(c) ?? 0)) / 2;
      expect(gap, `${a} / ${c}`).toBeGreaterThan(12);
    }
  });

  it('puts the companions at the centre and the rest outward in reading order', () => {
    const r = (id: string) => { const p = pos.get(id); return p ? Math.hypot(p.x, p.y) : NaN; };
    expect(r('n0')).toBeLessThan(100);
    expect(r('n2')).toBeLessThan(r('n20'));
    expect(r('n20')).toBeLessThan(r('n39'));
    expect(pos.get('n2')?.y).toBeLessThan(0); // the first figure after the companions sits at twelve o'clock
  });

  it('keeps satellites close to their parent', () => {
    const p = pos.get('n4'), s = pos.get('n4-a');
    if (!p || !s) throw new Error('missing position');
    expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeLessThan(150);
  });
});

describe('thumb', () => {
  it('rewrites originals and thumbnails to a standard width', () => {
    expect(thumb('https://upload.wikimedia.org/wikipedia/commons/6/6b/Dante.jpg', 330)).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Dante.jpg/330px-Dante.jpg');
    expect(thumb('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/V.jpg/1920px-V.jpg', 960)).toBe('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/V.jpg/960px-V.jpg');
    expect(thumb('https://example.org/a.jpg', 330)).toBe('https://example.org/a.jpg');
  });
});
