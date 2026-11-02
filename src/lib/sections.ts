import type { Book } from '../schema/index.ts';

/** Position of each section in reading order. Sections compare by this index. */
export function sectionIndex(book: Pick<Book, 'sections'>): Map<string, number> {
  return new Map(book.sections.map((s, i) => [s.id, i]));
}

/** True when `section` has been reached at reading position `at` (both section ids). */
export function reached(order: Map<string, number>, section: string, at: string): boolean {
  const s = order.get(section);
  const a = order.get(at);
  if (s === undefined || a === undefined) return false;
  return s <= a;
}
