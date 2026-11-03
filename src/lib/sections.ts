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

/** What the book calls its sections, from the labels themselves: "Canto I" → canto/cantos, "Chapter 1" → chapter/chapters. */
export function sectionNoun(book: Pick<Book, 'sections'>): { one: string; many: string } {
  const word = /^(\p{L}+)\s+\S/u.exec(book.sections[0]?.label ?? '')?.[1]?.toLowerCase();
  const one = word ?? 'section';
  return { one, many: `${one}s` };
}
