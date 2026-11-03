// / — the bookshelf. Minimal until Phase 5 (continue reading, shared entities).
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { fetchBooks, type BookSummary } from '../client/api.ts';
import { thumb } from '../lib/media.ts';
import { Shell } from '../components/Shell.tsx';

export function LibraryPage() {
  const [books, setBooks] = useState<BookSummary[]>();
  const [error, setError] = useState<string>();
  useEffect(() => { fetchBooks().then(setBooks).catch((err: unknown) => setError(String(err))); }, []);

  return (
    <Shell end={<BuildButton />}>
      <div className="lib">
        <h1>Your library</h1>
        <p className="sub" style={{ marginTop: 12, fontSize: 16 }}>
          {books ? `${books.length} ${books.length === 1 ? 'book' : 'books'} mapped.` : error ? `Couldn’t load the library. ${error}` : 'Loading…'}
        </p>
        <div className="grid">
          {books?.map((b) => (
            <Link key={b.slug} to={`/book/${b.slug}`} className="panel book-card">
              {b.cover ? <img src={thumb(b.cover, 960)} alt="" /> : <span />}
              <span className="stack" style={{ gap: 4 }}>
                <span style={{ fontSize: 24, lineHeight: '32px', fontWeight: 600 }}>{b.title}</span>
                <span className="sub">{b.author}</span>
                <span style={{ marginTop: 16 }}>{b.about}</span>
                <span className="meta num" style={{ marginTop: 16 }}>
                  {b.figures} figures · {b.contextEntries} context entries · {b.sources} sources
                </span>
                <span className="meta" style={{ marginTop: 'auto', paddingTop: 16 }}>You are in {b.sectionLabel}</span>
                <span className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: 12 }}>Open the graph</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </Shell>
  );
}

/** New graphs are built in Claude Code (D-001); the button copies the command to run there. */
function BuildButton() {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText('/build-graph "Title of the book"').catch(() => undefined);
    setCopied(true);
    setTimeout(() => setCopied(false), 2400);
  };
  return <button className="btn" onClick={copy}>{copied ? 'Copied: run it in Claude Code' : 'Build a graph'}</button>;
}
