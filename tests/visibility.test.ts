import { describe, expect, it } from 'vitest';
import { computeVisibility } from '../src/lib/visibility.ts';
import { tinyBundle } from './helpers.ts';

const ids = (xs: { entity: string }[]) => xs.map((x) => x.entity);

describe('computeVisibility', () => {
  const bundle = tinyBundle();

  it('shows only depth-1 nodes already met, and counts the rest without naming them', () => {
    const v = computeVisibility(bundle, 's-02');
    expect(ids(v.nodes)).toEqual(['a']);
    expect(v.ahead.nodes).toBe(2);
    expect(v.newHere).toEqual([]);
  });

  it('marks nodes first met at the current section as new', () => {
    expect(ids(computeVisibility(bundle, 's-03').newHere)).toEqual(['b']);
  });

  it('shows context only while one of its via parents is visible', () => {
    expect(ids(computeVisibility(bundle, 's-04').context)).toEqual(['x']);
    expect(ids(computeVisibility(bundle, 's-05').context)).toEqual(['x', 'y']);
  });

  it('hides edges until their section and until both ends are visible', () => {
    const at = (s: string) => computeVisibility(bundle, s).edges.map((e) => `${e.source}-${e.target}`);
    expect(at('s-02')).toEqual(['a-x']);
    expect(at('s-03')).toEqual(['a-b', 'a-x']);
    expect(at('s-05')).toEqual(['a-b', 'a-x', 'b-c', 'c-y']);
  });

  it('filters in-book notes and node media by section', () => {
    const a1 = computeVisibility(bundle, 's-01').nodes[0];
    expect(a1?.inBook.map((n) => n.text)).toEqual(['a1']);
    expect(a1?.media).toEqual([]);
    const a4 = computeVisibility(bundle, 's-04').nodes[0];
    expect(a4?.inBook.map((n) => n.text)).toEqual(['a1', 'a4']);
    expect(a4?.media).toHaveLength(1);
  });

  it('filters book-level media and counts what is hidden', () => {
    const v = computeVisibility(bundle, 's-03');
    expect(v.bookMedia).toHaveLength(1);
    expect(v.ahead.media).toBe(1);
    expect(v.ahead.notes).toBe(1);
  });

  it('does not mutate the bundle', () => {
    computeVisibility(bundle, 's-01');
    expect(bundle.graph.nodes[0]).toMatchObject({ inBook: [{ text: 'a1' }, { text: 'a4' }] });
  });

  it('rejects an unknown section', () => {
    expect(() => computeVisibility(bundle, 'nope')).toThrow(/unknown section/);
  });
});
