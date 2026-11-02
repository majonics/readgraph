// Phase 1 page: proves the pipeline end to end (files → API → schema → visibility → screen).
// The designed screens arrive in Phases 3–4, ported from design/prototype/.
import { useEffect, useMemo, useState } from 'react';
import type { BookBundle, Entity } from './schema/index.ts';
import { computeVisibility } from './lib/visibility.ts';
import { fetchBook, fetchBooks, putProgress, type BookSummary } from './client/api.ts';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const nameOf = (e: Entity | undefined, lang: string) => (e ? (e.name[lang] ?? Object.values(e.name)[0] ?? e.id) : '');

export function App() {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [bundle, setBundle] = useState<BookBundle>();
  const [at, setAt] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    fetchBooks()
      .then(async (list) => {
        setBooks(list);
        const first = list[0];
        if (!first) return;
        const b = await fetchBook(first.slug);
        setBundle(b);
        setAt(b.progress.currentSection);
      })
      .catch((err: unknown) => setError(String(err)));
  }, []);

  const visible = useMemo(() => (bundle && at ? computeVisibility(bundle, at) : undefined), [bundle, at]);

  if (error) return <Shell><p className="text-muted">Couldn’t load the library. {error}</p></Shell>;
  if (!bundle || !at || !visible) return <Shell><p className="text-faint">Loading the library…</p></Shell>;

  const { book } = bundle;
  const lang = book.language;
  const index = book.sections.findIndex((s) => s.id === at);
  const section = book.sections[index];

  const move = (id: string) => {
    setAt(id);
    putProgress(book.slug, id).catch((err: unknown) => setError(String(err)));
  };

  return (
    <Shell>
      <header className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="text-xl font-semibold">{book.title}</h1>
          <p className="mt-1 text-muted">
            {nameOf(bundle.entities[book.author], lang)} · {books.length} book{books.length === 1 ? '' : 's'} in the library
          </p>
        </div>
        <label className="flex items-center gap-3 text-muted">
          Reading position
          <select
            className="h-9 rounded-full bg-surface px-4 text-ink"
            value={at}
            onChange={(e) => move(e.target.value)}
          >
            {book.sections.map((s) => (
              <option key={s.id} value={s.id}>{s.group ? `${s.group}, ${s.label}` : s.label}</option>
            ))}
          </select>
        </label>
      </header>

      <p className="mt-6 text-muted">
        {section?.group}, {section?.label} (section {index + 1} of {book.sections.length}).{' '}
        {visible.newHere.length > 0 && <span className="text-gilt">{visible.newHere.length} new here. </span>}
        {plural(visible.ahead.nodes, 'more figure')} ahead; {plural(visible.ahead.notes, 'note')} and {plural(visible.ahead.media, 'source')} still hidden.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-card bg-surface p-6" aria-labelledby="met-h">
          <h2 id="met-h" className="mb-4 text-base font-semibold">Met so far <span className="font-normal text-faint">{visible.nodes.length}</span></h2>
          <ul className="flex flex-col gap-2">
            {visible.nodes.map((n) => (
              <li key={n.entity} className="rounded-inner bg-inner px-4 py-3">
                <div className="flex justify-between gap-4">
                  <span className={n.firstSection === at ? 'text-gilt' : ''}>{nameOf(bundle.entities[n.entity], lang)}</span>
                  <span className="text-xs text-faint">{bundle.entities[n.entity]?.type}</span>
                </div>
                <p className="text-muted">{n.role}</p>
                {n.inBook.at(-1) && <p className="mt-1 text-xs text-faint">Latest: {n.inBook.at(-1)?.text}</p>}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-card bg-surface p-6" aria-labelledby="ctx-h">
          <h2 id="ctx-h" className="mb-4 text-base font-semibold">Context <span className="font-normal text-faint">{visible.context.length}</span></h2>
          <ul className="flex flex-col gap-2">
            {visible.context.map((c) => (
              <li key={c.entity} className="rounded-inner bg-inner px-4 py-3">
                <span>{nameOf(bundle.entities[c.entity], lang)}</span>
                <p className="text-muted">{c.why}</p>
              </li>
            ))}
          </ul>
          <h2 className="mb-4 mt-8 text-base font-semibold">Connections <span className="font-normal text-faint">{visible.edges.length}</span></h2>
          <ul className="text-muted">
            {visible.edges.map((e) => (
              <li key={`${e.source}-${e.type}-${e.target}`}>
                {nameOf(bundle.entities[e.source], lang)} <span className="text-faint">{e.label}</span> {nameOf(bundle.entities[e.target], lang)}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-10">
      <p className="mb-8 font-serif text-2xl">readgraph</p>
      {children}
    </div>
  );
}
