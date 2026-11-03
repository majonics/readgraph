// Browser-side calls to the local API (src/api/plugin.ts). Every response is parsed, never trusted.
import { z } from 'zod';
import { BookBundle, Progress } from '../schema/index.ts';

export const BookSummary = z.object({
  slug: z.string(),
  title: z.string(),
  author: z.string(),
  currentSection: z.string(),
  sections: z.number(),
  cover: z.string().optional(),
  sectionLabel: z.string(),
  about: z.string(),
  figures: z.number(),
  contextEntries: z.number(),
  sources: z.number(),
});
export type BookSummary = z.infer<typeof BookSummary>;

async function json(res: Response): Promise<unknown> {
  const body: unknown = await res.json();
  if (!res.ok) throw new Error(`${res.status}: ${JSON.stringify(body)}`);
  return body;
}

export async function fetchBooks(): Promise<BookSummary[]> {
  return z.array(BookSummary).parse(await json(await fetch('/api/books')));
}

export async function fetchBook(slug: string): Promise<BookBundle> {
  return BookBundle.parse(await json(await fetch(`/api/books/${encodeURIComponent(slug)}`)));
}

export async function putProgress(slug: string, currentSection: string): Promise<Progress> {
  const res = await fetch(`/api/books/${encodeURIComponent(slug)}/progress`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ currentSection }),
  });
  return Progress.parse(await json(res));
}
