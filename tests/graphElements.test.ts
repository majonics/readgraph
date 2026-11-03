import { describe, expect, it } from 'vitest';
import { BOOK_ID, graphElements, type ElementDef } from '../src/lib/graphElements.ts';
import { thumb } from '../src/lib/media.ts';
import { computeVisibility } from '../src/lib/visibility.ts';
import { tinyBundle } from './helpers.ts';

const nodeIds = (els: ElementDef[]) => els.filter((e) => e.group === 'nodes').map((e) => e.data.id);
const node = (els: ElementDef[], id: string) => els.find((e) => e.group === 'nodes' && e.data.id === id);

describe('graphElements', () => {
  const b = tinyBundle();
  const x = b.entities.x;
  if (x) b.entities.x = { ...x, type: 'place' };

  it('puts the book at the centre and links every depth-1 node to it', () => {
    const els = graphElements(b, computeVisibility(b, 's-03'));
    expect(nodeIds(els)).toEqual([BOOK_ID, 'a', 'b', 'x']);
    expect(els.filter((e) => e.classes === 'to-book')).toHaveLength(2);
  });

  it('marks nodes new at the current section, and encodes type as shape and context as hollow', () => {
    const els = graphElements(b, computeVisibility(b, 's-03'));
    expect(node(els, 'b')?.classes).toContain('new');
    expect(node(els, 'a')?.classes).not.toContain('new');
    expect(node(els, 'a')?.data).toMatchObject({ shape: 'ellipse', w: 72, level: 3 });
    expect(node(els, 'x')).toMatchObject({ classes: 'd2', data: { shape: 'rectangle', level: 1 } });
  });

  it('drops context with bookOnly and filters by kind', () => {
    const v = computeVisibility(b, 's-05');
    expect(nodeIds(graphElements(b, v, { bookOnly: true }))).toEqual([BOOK_ID, 'a', 'b', 'c']);
    expect(nodeIds(graphElements(b, v, { kinds: new Set(['places']) }))).toEqual([BOOK_ID, 'x']);
  });

  it('builds an ego graph without the book node', () => {
    const els = graphElements(b, computeVisibility(b, 's-05'), { focus: 'b' });
    expect(nodeIds(els).sort()).toEqual(['a', 'b', 'c']);
    expect(node(els, 'b')?.data).toMatchObject({ level: 4, w: 84 });
    expect(els.filter((e) => e.group === 'edges').map((e) => e.data.id).sort()).toEqual(['a|knows|b', 'b|meets|c']);
  });
});

describe('thumb', () => {
  it('rewrites originals and thumbnails to a standard width', () => {
    expect(thumb('https://upload.wikimedia.org/wikipedia/commons/6/6b/Dante.jpg', 330)).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Dante.jpg/330px-Dante.jpg');
    expect(thumb('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/V.jpg/1920px-V.jpg', 960)).toBe('https://thumb.wikimedia.org/wikipedia/commons/thumb/1/15/V.jpg/960px-V.jpg');
    expect(thumb('https://example.org/a.jpg', 330)).toBe('https://example.org/a.jpg');
  });
});
