import { describe, expect, it } from 'vitest';
import { entityView, groupOf, type EntityView } from '../src/lib/entityView.ts';
import { sectionIndex } from '../src/lib/sections.ts';
import { computeVisibility } from '../src/lib/visibility.ts';
import { loadBook } from '../src/server/library.ts';
import type { BookBundle, MediaItem } from '../src/schema/index.ts';
import { tinyBundle } from './helpers.ts';

const item = (kind: MediaItem['kind'], title: string, extra: Partial<MediaItem> = {}): MediaItem => ({
  kind, title, publisher: 'Test', url: 'https://example.org/', language: 'en', tier: 1, why: 'test', verifiedAt: '2026-11-03', ...extra,
});
const pic = { imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/P.jpg', license: 'PD', attribution: 'Someone' };

/** Every part of a view that comes from the book must be reached at `at`, and every entity it names must be visible there. */
function expectSpoilerSafe(bundle: BookBundle, v: EntityView, at: string) {
  const order = sectionIndex(bundle.book);
  const ok = (s?: string) => s === undefined || (order.get(s) ?? Infinity) <= (order.get(at) ?? -1);
  const visible = computeVisibility(bundle, at);
  const shown = new Set([...visible.nodes, ...visible.context].map((n) => n.entity));
  expect(v.firstSection === undefined || ok(v.firstSection)).toBe(true);
  v.notes.forEach((n) => expect(ok(n.section), n.text).toBe(true));
  Object.values(v.media).flat().forEach((m) => expect(ok(m.section), m.title).toBe(true));
  v.neighbours.forEach((n) => { expect(shown.has(n.id), n.id).toBe(true); expect(ok(n.section)).toBe(true); });
  [...v.context, ...v.via].forEach((c) => expect(shown.has(c.id), c.id).toBe(true));
}

describe('entityView', () => {
  const b = tinyBundle();

  it('is undefined for an entity the reader has not met, or one not in the book', () => {
    expect(entityView(b, 'c', 's-04')).toBeUndefined();
    expect(entityView(b, 'y', 's-04')).toBeUndefined();
    expect(entityView(b, 'nobody', 's-05')).toBeUndefined();
    expect(entityView(b, 'c', 's-05')?.name).toBe('c');
  });

  it('shows notes and book media up to the reader, and only counts the rest', () => {
    const at1 = entityView(b, 'a', 's-01');
    expect(at1?.notes.map((n) => n.text)).toEqual(['a1']);
    expect(at1?.hidden).toEqual({ notes: 1, media: 1 });
    expect(JSON.stringify(at1)).not.toMatch(/a4|about s-02/);
    const at4 = entityView(b, 'a', 's-04');
    expect(at4?.notes.map((n) => n.text)).toEqual(['a1', 'a4']);
    expect(at4?.hidden).toEqual({ notes: 0, media: 0 });
    expect(at4?.media.read.map((m) => m.title)).toEqual(['about s-02']);
  });

  it('lists only neighbours and relations already revealed', () => {
    expect(entityView(b, 'a', 's-02')?.neighbours.map((n) => n.id)).toEqual(['x']);
    expect(entityView(b, 'a', 's-03')?.neighbours).toEqual([
      { id: 'b', name: 'b', direction: 'out', label: 'knows', section: 's-03' },
      { id: 'x', name: 'x', direction: 'out', label: 'from' },
    ]);
    expect(entityView(b, 'b', 's-04')?.neighbours.map((n) => [n.id, n.direction])).toEqual([['a', 'in']]);
  });

  it('gives a figure its context, and a context leaf its figures and why', () => {
    expect(entityView(b, 'a', 's-01')?.context).toEqual([{ id: 'x', name: 'x', why: 'context for a', summary: 'x.' }]);
    const x = entityView(b, 'x', 's-01');
    expect(x).toMatchObject({ depth: 2, role: 'context for a', via: [{ id: 'a', name: 'a' }], notes: [], context: [] });
    expect(x?.firstSection).toBeUndefined();
  });

  it('groups media into Look, Watch and listen, and Read, book-specific first in reading order', () => {
    const r = tinyBundle({
      graph: {
        nodes: [
          { entity: 'a', depth: 1, importance: 3, role: 'lead', firstSection: 's-01', inBook: [],
            media: [item('artwork', 'plate 3', { ...pic, section: 's-03' }), item('artwork', 'plate 1', { ...pic, section: 's-01' })] },
        ],
        edges: [],
      },
    });
    const a = r.entities.a;
    if (a) r.entities.a = { ...a, image: item('artwork', 'own portrait', pic), media: [item('artwork', 'portrait', pic), item('lecture', 'lecture'), item('podcast', 'podcast'), item('artwork', 'no image'), item('book', 'book')] };
    const v = entityView(r, 'a', 's-05');
    expect(v?.media.look.map((m) => m.title)).toEqual(['plate 1', 'plate 3', 'portrait']);
    expect(v?.media.watch.map((m) => m.title)).toEqual(['lecture', 'podcast']);
    expect(v?.media.read.map((m) => m.title)).toEqual(['no image', 'book']);
  });

  it('shows the About picture once: a borrowed book picture leaves Look', () => {
    const r = tinyBundle({
      graph: {
        nodes: [{ entity: 'a', depth: 1, importance: 3, role: 'lead', firstSection: 's-01', inBook: [],
          media: [item('artwork', 'plate 1', { ...pic, section: 's-01' }), item('artwork', 'plate 2', { ...pic, section: 's-02' })] }],
        edges: [],
      },
    });
    const v = entityView(r, 'a', 's-05');
    expect(v?.picture?.title).toBe('plate 1');
    expect(v?.media.look.map((m) => m.title)).toEqual(['plate 2']);
  });

  it('classifies kinds', () => {
    expect(groupOf(item('map', 'm', pic))).toBe('look');
    expect(groupOf(item('video', 'v'))).toBe('watch');
    expect(groupOf(item('audio', 'a'))).toBe('watch');
    expect(groupOf(item('website', 'w'))).toBe('read');
    expect(groupOf(item('image', 'i'))).toBe('read');
  });

  it('is spoiler-safe for every entity at every section of the tiny book', () => {
    for (const { id: at } of b.book.sections) {
      for (const id of Object.keys(b.entities)) {
        const v = entityView(b, id, at);
        if (v) expectSpoilerSafe(b, v, at);
      }
    }
  });

  it('is spoiler-safe for every entity at every canto of the Divine Comedy', async () => {
    const { bundle } = await loadBook('divine-comedy');
    if (!bundle) throw new Error('divine-comedy failed to load');
    let pages = 0;
    for (const { id: at } of bundle.book.sections) {
      const visible = computeVisibility(bundle, at);
      for (const id of Object.keys(bundle.entities)) {
        const v = entityView(bundle, id, at, visible);
        if (!v) continue;
        expectSpoilerSafe(bundle, v, at);
        pages += 1;
      }
    }
    expect(pages).toBeGreaterThan(0);
  });
});
