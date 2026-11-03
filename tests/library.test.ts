import { describe, expect, it } from 'vitest';
import { listBooks, loadBook } from '../src/server/library.ts';
import { computeVisibility } from '../src/lib/visibility.ts';

describe('library/ on disk', () => {
  it('every book passes validation', async () => {
    for (const slug of await listBooks()) {
      const { issues } = await loadBook(slug);
      expect(issues, slug).toEqual([]);
    }
  });

  it('the Divine Comedy reveals Francesca only from Canto V, and Ciacco only from Canto VI', async () => {
    const { bundle } = await loadBook('divine-comedy');
    if (!bundle) throw new Error('divine-comedy failed to load');
    const names = (at: string) => computeVisibility(bundle, at).nodes.map((n) => n.entity);
    expect(names('inf-04')).not.toContain('francesca-da-rimini');
    expect(names('inf-05')).toContain('francesca-da-rimini');
    const newAt5 = computeVisibility(bundle, 'inf-05').newHere.map((n) => n.entity);
    expect(newAt5).toEqual(expect.arrayContaining(['minos', 'francesca-da-rimini', 'paolo-malatesta']));
    expect(newAt5).not.toContain('ciacco');
    expect(names('inf-06')).toContain('ciacco');
  });
});
