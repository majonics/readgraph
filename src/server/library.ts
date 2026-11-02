// Reads library/ from disk (Node only). Used by scripts/validate.ts and the dev-server API.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { z } from 'zod';
import { Book, BookBundle, Entity, Graph, Progress } from '../schema/index.ts';
import { checkBook, type Issue } from '../lib/rules.ts';

export const LIBRARY = join(import.meta.dirname, '..', '..', 'library');

async function readParsed<T extends z.ZodType>(root: string, rel: string, schema: T, issues: Issue[]): Promise<z.infer<T> | undefined> {
  const file = join(root, rel);
  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(file, 'utf8'));
  } catch (err) {
    issues.push({ file: `library/${rel}`, path: '', message: err instanceof SyntaxError ? `invalid JSON: ${err.message}` : 'file is missing' });
    return undefined;
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    for (const issue of result.error.issues) {
      issues.push({ file: `library/${rel}`, path: issue.path.join('.'), message: issue.message });
    }
    return undefined;
  }
  return result.data;
}

async function listJson(dir: string): Promise<string[]> {
  try {
    return (await readdir(dir)).filter((f) => f.endsWith('.json')).sort();
  } catch {
    return [];
  }
}

export async function listBooks(root = LIBRARY): Promise<string[]> {
  try {
    const entries = await readdir(join(root, 'books'), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  } catch {
    return [];
  }
}

export async function loadEntities(root = LIBRARY, issues: Issue[] = []): Promise<Map<string, Entity>> {
  const map = new Map<string, Entity>();
  for (const f of await listJson(join(root, 'entities'))) {
    const ent = await readParsed(root, `entities/${f}`, Entity, issues);
    if (!ent) continue;
    if (`${ent.id}.json` !== f) issues.push({ file: `library/entities/${f}`, path: 'id', message: `id "${ent.id}" does not match its file name` });
    map.set(ent.id, ent);
  }
  return map;
}

export interface Loaded {
  bundle?: BookBundle;
  issues: Issue[];
}

/** Loads one book with only the entities it uses, checking schema and graph rules. */
export async function loadBook(slug: string, root = LIBRARY, entities?: Map<string, Entity>): Promise<Loaded> {
  const issues: Issue[] = [];
  const registry = entities ?? (await loadEntities(root, issues));
  const book = await readParsed(root, `books/${slug}/book.json`, Book, issues);
  const graph = await readParsed(root, `books/${slug}/graph.json`, Graph, issues);
  const progress = await readParsed(root, `books/${slug}/progress.json`, Progress, issues);
  if (!book || !graph || !progress) return { issues };

  issues.push(...checkBook({ slug, book, graph, progress, entities: registry }));
  if (issues.length) return { issues };

  const used = new Set([book.author, ...graph.nodes.map((n) => n.entity)]);
  const bundle: BookBundle = {
    book,
    graph,
    progress,
    entities: Object.fromEntries([...used].flatMap((id) => {
      const e = registry.get(id);
      return e ? [[id, e] as const] : [];
    })),
  };
  return { bundle, issues };
}

export async function saveProgress(slug: string, currentSection: string, root = LIBRARY): Promise<Progress> {
  const { bundle, issues } = await loadBook(slug, root);
  if (!bundle) throw new Error(issues.map((i) => `${i.file} ${i.path}: ${i.message}`).join('\n'));
  if (!bundle.book.sections.some((s) => s.id === currentSection)) throw new Error(`unknown section "${currentSection}"`);
  const progress = Progress.parse({ currentSection, updatedAt: new Date().toISOString() });
  await writeFile(join(root, 'books', slug, 'progress.json'), `${JSON.stringify(progress, null, 2)}\n`);
  return progress;
}
