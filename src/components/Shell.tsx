// The ruled T-frame from design/prototype: sidebar (wordmark, books), a 64px top bar, the canvas.
import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { fetchBooks, type BookSummary } from '../client/api.ts';
import { thumb } from '../lib/media.ts';

const Mark = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <path d="M13 13 L5 6 M13 13 L22 8 M13 13 L9 22 M13 13 L21 20" stroke="#6b6b6b" strokeWidth="1.5" />
    <circle cx="5" cy="6" r="2.5" fill="#e6e6e6" /><circle cx="22" cy="8" r="2" fill="#e6e6e6" />
    <circle cx="9" cy="22" r="2" fill="#e6e6e6" /><circle cx="21" cy="20" r="2.5" fill="none" stroke="#e6e6e6" strokeWidth="1.5" />
    <circle cx="13" cy="13" r="4.5" fill="var(--accent)" />
  </svg>
);
const LibraryIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2.5 2.5v11M6 2.5v11M9.5 3l3.5 10.2" /></svg>
);
const Chevron = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="m4.5 2.5 3.5 3.5-3.5 3.5" /></svg>
);
export const SearchIcon = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><circle cx="7" cy="7" r="4.5" /><path d="M10.5 10.5 14 14" /></svg>
);

interface Props {
  crumbs?: [label: string, to?: string][];
  search?: ReactNode;
  end?: ReactNode;
  children: ReactNode;
}

export function Shell({ crumbs, search, end, children }: Props) {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [open, setOpen] = useState(false);
  useEffect(() => { fetchBooks().then(setBooks).catch(() => setBooks([])); }, []);

  return (
    <div className="shell">
      <aside className={`side${open ? ' open' : ''}`} id="side">
        <Link className="brand" to="/" aria-label="readgraph, library"><Mark /><span>readgraph</span></Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end><LibraryIcon />Library</NavLink>
          {books.length > 0 && <div className="nav-group">Reading</div>}
          {books.map((b) => (
            <NavLink key={b.slug} to={`/book/${b.slug}`}>
              {b.cover ? <img className="thumb" src={thumb(b.cover, 120)} alt="" /> : null}{b.title}
            </NavLink>
          ))}
        </nav>
        <p className="side-foot">Build new graphs in Claude Code with <b>/build-graph</b></p>
      </aside>
      <header className="top">
        <button className="menu-btn" aria-label="Open menu" aria-expanded={open} aria-controls="side" onClick={() => setOpen((o) => !o)}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14" /></svg>
        </button>
        {crumbs && (
          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.map(([label, to], i) =>
              i === crumbs.length - 1 || !to
                ? <span key={label} aria-current="page">{label}</span>
                : <span key={label} className="contents"><Link to={to}>{label}</Link><Chevron /></span>)}
          </nav>
        )}
        {search}
        <div className="top-end">{end}</div>
      </header>
      <main className="canvas">{children}</main>
    </div>
  );
}
