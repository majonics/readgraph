import { describe, expect, it } from 'vitest';
import { checkBook } from '../src/lib/rules.ts';
import { Graph, MediaItem } from '../src/schema/index.ts';
import { tinyBundle } from './helpers.ts';

function check(bundle = tinyBundle()) {
  return checkBook({ slug: bundle.book.slug, book: bundle.book, graph: bundle.graph, progress: bundle.progress, entities: new Map(Object.entries(bundle.entities)) })
    .map((i) => i.message);
}
const withGraph = (fn: (g: Graph) => void) => {
  const b = tinyBundle();
  fn(b.graph);
  return b;
};

describe('checkBook', () => {
  it('accepts a valid book', () => {
    expect(check()).toEqual([]);
  });

  it('rejects context that hangs off another context node (no depth 3)', () => {
    const b = withGraph((g) => {
      g.nodes.push({ entity: 'z', depth: 2, via: ['x'], why: 'too deep' });
      g.edges.push({ source: 'x', target: 'z', type: 't', label: 't' });
    });
    b.entities.z = { id: 'z', type: 'place', name: { en: 'z' }, summary: { en: 'z.' }, media: [] };
    expect(check(b)).toContainEqual(expect.stringMatching(/"x" is not a depth-1 node/));
  });

  it('requires an edge from context to one of its via nodes', () => {
    const b = withGraph((g) => { g.edges = g.edges.filter((e) => e.target !== 'x'); });
    expect(check(b)).toContainEqual(expect.stringMatching(/context "x" needs an edge/));
  });

  it('rejects edges to nodes that are not in the graph', () => {
    const b = withGraph((g) => { g.edges.push({ source: 'a', target: 'ghost', type: 't', label: 't' }); });
    expect(check(b)).toContainEqual(expect.stringMatching(/"ghost" is not a node/));
  });

  it('rejects an edge revealed before one of its ends first appears', () => {
    const b = withGraph((g) => { g.edges.push({ source: 'a', target: 'c', type: 'early', label: 'early', section: 's-02' }); });
    expect(check(b)).toContainEqual(expect.stringMatching(/before "c" first appears/));
  });

  it('rejects a note placed before the entity first appears', () => {
    const b = withGraph((g) => {
      const n = g.nodes[1];
      if (n?.depth === 1) n.inBook.push({ section: 's-01', text: 'too early' });
    });
    expect(check(b)).toContainEqual(expect.stringMatching(/comes before "b" first appears/));
  });

  it('rejects unknown sections, duplicate nodes and missing entity files', () => {
    const b = withGraph((g) => {
      const n = g.nodes[0];
      if (n?.depth === 1) n.firstSection = 's-99';
      g.nodes.push({ entity: 'b', depth: 1, importance: 1, role: 'again', firstSection: 's-03', inBook: [], media: [] });
    });
    delete b.entities.c;
    const msgs = check(b);
    expect(msgs).toContainEqual('unknown section "s-99"');
    expect(msgs).toContainEqual('"b" appears more than once');
    expect(msgs).toContainEqual(expect.stringMatching(/"c" has no file/));
  });

  it('rejects section tags on global entity media (spoiler leak)', () => {
    const b = tinyBundle();
    b.entities.a?.media.push({ kind: 'article', title: 't', publisher: 'p', url: 'https://example.org/', language: 'en', tier: 1, why: 'w', section: 's-02', verifiedAt: '2026-11-03' });
    expect(check(b)).toContainEqual(expect.stringMatching(/global media cannot carry a section/));
  });
});

describe('MediaItem schema', () => {
  const base = { kind: 'artwork', title: 't', publisher: 'p', url: 'https://example.org/', language: 'en', tier: 1, why: 'w', verifiedAt: '2026-11-03' };
  it('requires license and attribution for inline images', () => {
    expect(MediaItem.safeParse({ ...base, imageUrl: 'https://example.org/a.jpg' }).success).toBe(false);
    expect(MediaItem.safeParse({ ...base, imageUrl: 'https://example.org/a.jpg', license: 'PD', attribution: 'x' }).success).toBe(true);
  });
  it('rejects http and tier 3', () => {
    expect(MediaItem.safeParse({ ...base, url: 'http://example.org/' }).success).toBe(false);
    expect(MediaItem.safeParse({ ...base, tier: 3 }).success).toBe(false);
  });
});
