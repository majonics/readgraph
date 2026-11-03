// npm run merge-batches -- <slug>
// Step 4 of /build-graph as code: merges .work/<slug>/batch-*.json into library/ (validate afterwards).
//  - entities: a batch updates the fields it sends; fields it leaves out are kept; media lists are unioned by URL
//  - depth-1 nodes: the batch's version replaces the existing one
//  - context nodes: one per entity, `via` lists unioned
//  - edges: exact duplicates dropped; the same pair at the same section from two batches is kept once
//  - edges to cast members not researched yet go to .work/<slug>/pending-edges.json and are retried on every merge
//  - node media already listed at book level is dropped from the node
//  - merged batch files move to .work/<slug>/merged/, so a later merge never undoes hand fixes in library/
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { z } from 'zod';
import { Book, Edge, Entity, Graph, GraphNode, type MediaItem } from '../src/schema/index.ts';
import { LIBRARY } from '../src/server/library.ts';

const slug = process.argv[2];
if (!slug) {
  console.error('usage: npm run merge-batches -- <slug>');
  process.exit(2);
}
const WORK = join(LIBRARY, '..', '.work', slug);
const BOOK_DIR = join(LIBRARY, 'books', slug);

const Batch = z.object({
  entities: z.array(Entity),
  contextEntities: z.array(Entity).default([]),
  nodes: z.array(GraphNode),
  edges: z.array(Edge),
  report: z.string().optional(),
});

const readJson = async (path: string): Promise<unknown> => JSON.parse(await readFile(path, 'utf8'));
const write = (path: string, data: unknown) => writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
const unionMedia = (a: MediaItem[], b: MediaItem[]) => [...new Map([...a, ...b].map((m) => [m.url, m])).values()];

const batchFiles = (await readdir(WORK)).filter((f) => /^batch-\d+\.json$/.test(f)).sort((a, b) => parseInt(a.slice(6)) - parseInt(b.slice(6)));
if (!batchFiles.length) throw new Error(`no batch-*.json in ${WORK}`);
const batches = await Promise.all(batchFiles.map(async (f) => ({ file: f, ...Batch.parse(await readJson(join(WORK, f))) })));

// ---- entities ----
let written = 0;
for (const ent of batches.flatMap((b) => [...b.entities, ...b.contextEntities])) {
  const path = join(LIBRARY, 'entities', `${ent.id}.json`);
  const old = existsSync(path) ? Entity.parse(await readJson(path)) : undefined;
  const merged = old ? { ...old, ...ent, media: unionMedia(old.media, ent.media) } : ent;
  await write(path, Entity.parse(merged));
  written += 1;
}

// ---- graph ----
const book = Book.parse(await readJson(join(BOOK_DIR, 'book.json')));
const graph = Graph.parse(await readJson(join(BOOK_DIR, 'graph.json')));
const bookUrls = new Set(book.media.map((m) => m.url));

const nodes = new Map(graph.nodes.map((n) => [n.entity, n]));
for (const b of batches) {
  for (const n of b.nodes) {
    if (n.depth === 1) {
      nodes.set(n.entity, { ...n, media: n.media.filter((m) => !bookUrls.has(m.url)) });
      continue;
    }
    const prev = nodes.get(n.entity);
    nodes.set(n.entity, prev?.depth === 2 ? { ...prev, via: [...new Set([...prev.via, ...n.via])] } : n);
  }
}

const pendingPath = join(WORK, 'pending-edges.json');
const pendingBefore = existsSync(pendingPath) ? z.array(Edge).parse(await readJson(pendingPath)) : [];
const edges: Edge[] = [];
const pending: Edge[] = [];
const exact = new Set<string>();
const pairAt = new Map<string, string>(); // pair|section → batch that set it
const candidates: [string, Edge][] = [
  ...graph.edges.map((e) => ['library', e] as [string, Edge]),
  ...batches.flatMap((b) => b.edges.map((e) => [b.file, e] as [string, Edge])),
  ...pendingBefore.map((e) => ['pending', e] as [string, Edge]),
];
for (const [from, e] of candidates) {
  if (!nodes.has(e.source) || !nodes.has(e.target)) { pending.push(e); continue; }
  const key = `${e.source}|${e.target}|${e.type}`;
  const pair = `${[e.source, e.target].sort().join('|')}|${e.section ?? ''}`;
  if (exact.has(key)) continue;
  const owner = pairAt.get(pair);
  if (owner && owner !== from && owner !== 'library' && from !== 'pending') continue;
  exact.add(key);
  if (!owner) pairAt.set(pair, from);
  edges.push(e);
}
const uniquePending = [...new Map(pending.map((e) => [`${e.source}|${e.target}|${e.type}`, e])).values()];

// Depth-1 first, in reading order, then context; keeps graph.json readable.
const order = new Map(book.sections.map((s, i) => [s.id, i]));
const sorted = [...nodes.values()].sort((a, b) => {
  if (a.depth !== b.depth) return a.depth - b.depth;
  if (a.depth === 1 && b.depth === 1) return (order.get(a.firstSection) ?? 0) - (order.get(b.firstSection) ?? 0);
  return 0;
});

await write(join(BOOK_DIR, 'graph.json'), Graph.parse({ nodes: sorted, edges }));
await write(join(BOOK_DIR, 'book.json'), Book.parse({
  ...book,
  media: book.media,
  generatedAt: new Date().toISOString().slice(0, 10),
  generator: { skill: 'build-graph', version: 1 },
}));
await write(pendingPath, uniquePending);
await mkdir(join(WORK, 'merged'), { recursive: true });
for (const f of batchFiles) await rename(join(WORK, f), join(WORK, 'merged', f));

const d1 = sorted.filter((n) => n.depth === 1).length;
console.log(`Merged ${batchFiles.join(', ')}: ${written} entity files, ${d1} in the book, ${sorted.length - d1} context, ${edges.length} edges.`);
console.log(`${uniquePending.length} edges wait in .work/${slug}/pending-edges.json for cast not yet researched.`);
console.log('Next: npm run validate -- ' + slug + ' && npm run check-links -- ' + slug);
