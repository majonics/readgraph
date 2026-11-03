// A tiny local API inside the Vite dev/preview server (D-002): no separate backend.
//   GET  /api/books                  → [{ slug, title, author, currentSection, sections }]
//   GET  /api/books/:slug            → BookBundle, or 422 with the validation issues
//   PUT  /api/books/:slug/progress   ← { currentSection } → Progress
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Connect, Plugin } from 'vite';
import { listBooks, loadBook, loadEntities, saveProgress } from '../server/library.ts';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(body));
}

async function readBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const c of req) chunks.push(c as Buffer);
  return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
}

async function handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean);
  if (parts[0] !== 'api' || parts[1] !== 'books') return false;
  const slug = parts[2];

  if (!slug && req.method === 'GET') {
    const entities = await loadEntities();
    const rows = [];
    for (const s of await listBooks()) {
      const { bundle } = await loadBook(s, undefined, entities);
      if (!bundle) continue;
      const author = bundle.entities[bundle.book.author];
      const at = bundle.book.sections.find((x) => x.id === bundle.progress.currentSection);
      rows.push({
        slug: s,
        title: bundle.book.title,
        author: author?.name[bundle.book.language] ?? Object.values(author?.name ?? {})[0] ?? bundle.book.author,
        currentSection: bundle.progress.currentSection,
        sections: bundle.book.sections.length,
        ...(bundle.book.cover?.imageUrl ? { cover: bundle.book.cover.imageUrl } : {}),
        sectionLabel: at ? [at.group, at.label].filter(Boolean).join(', ') : bundle.progress.currentSection,
        about: bundle.book.about,
        figures: bundle.graph.nodes.filter((n) => n.depth === 1).length,
        contextEntries: bundle.graph.nodes.filter((n) => n.depth === 2).length,
        sources: bundle.book.media.length
          + bundle.graph.nodes.reduce((sum, n) => sum + (n.depth === 1 ? n.media.length : 0), 0)
          + Object.values(bundle.entities).reduce((sum, e) => sum + e.media.length, 0),
      });
    }
    send(res, 200, rows);
    return true;
  }
  if (slug && parts.length === 3 && req.method === 'GET') {
    const { bundle, issues } = await loadBook(slug);
    if (bundle) send(res, 200, bundle);
    else send(res, issues.some((i) => i.message === 'file is missing') ? 404 : 422, { issues });
    return true;
  }
  if (slug && parts[3] === 'progress' && req.method === 'PUT') {
    const body = await readBody(req);
    const section = typeof body === 'object' && body && 'currentSection' in body ? body.currentSection : undefined;
    if (typeof section !== 'string') {
      send(res, 400, { error: 'body must be { "currentSection": "<section id>" }' });
      return true;
    }
    try {
      send(res, 200, await saveProgress(slug, section));
    } catch (err) {
      send(res, 422, { error: err instanceof Error ? err.message : String(err) });
    }
    return true;
  }
  send(res, 405, { error: `${req.method} ${url.pathname} is not supported` });
  return true;
}

const middleware: Connect.NextHandleFunction = (req, res, next) => {
  handle(req, res)
    .then((handled) => { if (!handled) next(); })
    .catch((err: unknown) => send(res, 500, { error: err instanceof Error ? err.message : String(err) }));
};

export function libraryApi(): Plugin {
  return {
    name: 'readgraph-library-api',
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
