// npm run check-links [-- <slug> ...]
// Fetches every URL in the entity registry and the named books (default: all). Exits 1 if any link is dead.
// Bot walls (401/403/429) are listed as "blocked": check those in a browser.
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { LIBRARY, listBooks } from '../src/server/library.ts';
import { USER_AGENT } from '../src/server/wiki.ts';
import { classify, collectLinks, type FoundLink } from '../src/lib/links.ts';

const requested = process.argv.slice(2);
const slugs = requested.length ? requested : await listBooks();
const files = [
  ...(await readdir(join(LIBRARY, 'entities'))).filter((f) => f.endsWith('.json')).map((f) => `entities/${f}`),
  ...slugs.flatMap((s) => ['book.json', 'graph.json'].map((f) => `books/${s}/${f}`)),
];

const where = new Map<string, string[]>();
for (const f of files) {
  const found: FoundLink[] = collectLinks(JSON.parse(await readFile(join(LIBRARY, f), 'utf8')));
  for (const { url, path } of found) where.set(url, [...(where.get(url) ?? []), `library/${f} ${path}`]);
}

async function probe(url: string): Promise<number | 'error'> {
  const opts = { headers: { 'User-Agent': USER_AGENT }, redirect: 'follow' as const, signal: AbortSignal.timeout(20_000) };
  try {
    const head = await fetch(url, { ...opts, method: 'HEAD' });
    if (head.ok || ![403, 405, 501].includes(head.status)) return head.status;
    return (await fetch(url, { ...opts, method: 'GET' })).status; // some servers refuse HEAD
  } catch {
    return 'error';
  }
}

// A few at a time, one request per host at a time, so no site sees a burst.
const queue = [...where.keys()];
const busy = new Set<string>();
const results = new Map<string, number | 'error'>();
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) {
    const i = queue.findIndex((u) => !busy.has(new URL(u).host));
    if (i < 0) { await new Promise((r) => setTimeout(r, 100)); continue; }
    const [url] = queue.splice(i, 1);
    if (!url) continue;
    const host = new URL(url).host;
    busy.add(host);
    results.set(url, await probe(url));
    await new Promise((r) => setTimeout(r, 250));
    busy.delete(host);
  }
}));

const by = { ok: 0, blocked: [] as string[], dead: [] as string[] };
for (const [url, status] of results) {
  const c = classify(status);
  if (c === 'ok') by.ok += 1;
  else by[c].push(`${status}  ${url}\n        ${(where.get(url) ?? []).join('\n        ')}`);
}
if (by.blocked.length) console.log(`Blocked (check by hand):\n  ${by.blocked.join('\n  ')}\n`);
if (by.dead.length) console.log(`Dead:\n  ${by.dead.join('\n  ')}\n`);
console.log(`${results.size} links: ${by.ok} ok, ${by.blocked.length} blocked, ${by.dead.length} dead.`);
if (by.dead.length) process.exit(1);
