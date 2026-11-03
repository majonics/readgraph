import type { Book, BookBundle, Entity, Graph } from '../src/schema/index.ts';

/** A tiny book with sections s-01 … s-05 and entities a (s-01), b (s-03), c (s-05), plus context x via a. */
export function tinyBundle(overrides: { graph?: Partial<Graph>; book?: Partial<Book> } = {}): BookBundle {
  const sections = ['s-01', 's-02', 's-03', 's-04', 's-05'].map((id) => ({ id, label: id }));
  const media = (section?: string) => ({
    kind: 'article' as const, title: `about ${section ?? 'all'}`, publisher: 'Test', url: 'https://example.org/',
    language: 'en', tier: 1 as const, why: 'test', verifiedAt: '2026-11-03', ...(section ? { section } : {}),
  });
  const book: Book = {
    slug: 'tiny', title: 'Tiny', author: 'a', year: { label: '2026' }, language: 'en', about: 'A test book.',
    sections, media: [media(), media('s-04')], generatedAt: '2026-11-03', generator: { skill: 'test', version: 1 },
    ...overrides.book,
  };
  const graph: Graph = {
    nodes: [
      { entity: 'a', depth: 1, importance: 3, role: 'lead', firstSection: 's-01',
        inBook: [{ section: 's-01', text: 'a1' }, { section: 's-04', text: 'a4' }], media: [media('s-02')] },
      { entity: 'b', depth: 1, importance: 2, role: 'second', firstSection: 's-03', inBook: [], media: [] },
      { entity: 'c', depth: 1, importance: 1, role: 'late', firstSection: 's-05', inBook: [], media: [] },
      { entity: 'x', depth: 2, via: ['a'], why: 'context for a' },
      { entity: 'y', depth: 2, via: ['c'], why: 'context for c' },
    ],
    edges: [
      { source: 'a', target: 'b', type: 'knows', label: 'knows', section: 's-03' },
      { source: 'a', target: 'x', type: 'from', label: 'from' },
      { source: 'b', target: 'c', type: 'meets', label: 'meets', section: 's-05' },
      { source: 'c', target: 'y', type: 'from', label: 'from' },
    ],
    ...overrides.graph,
  };
  const entities: Record<string, Entity> = Object.fromEntries(
    ['a', 'b', 'c', 'x', 'y'].map((id) => [id, { id, type: 'person', name: { en: id }, summary: { en: `${id}.` }, media: [] }]),
  );
  return { book, graph, progress: { currentSection: 's-01', updatedAt: '2026-11-03T00:00:00.000Z' }, entities };
}
