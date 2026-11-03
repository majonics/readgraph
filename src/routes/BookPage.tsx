// /book/:slug, the whole-book map. The map takes the full width; the chosen figure's card floats over its right side.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import type { BookBundle } from '../schema/index.ts';
import { fetchBook, putProgress } from '../client/api.ts';
import { computeVisibility } from '../lib/visibility.ts';
import { anchorsOf, graphElements, KINDS, type KindId } from '../lib/graphElements.ts';
import { pictureOf, thumb } from '../lib/media.ts';
import { Shell, SearchIcon } from '../components/Shell.tsx';
import { CantoStrip } from '../components/CantoStrip.tsx';
import { GraphCanvas } from '../components/GraphCanvas.tsx';
import { EntityPreview } from '../components/EntityPreview.tsx';

const ALL_KINDS = new Set<KindId>(KINDS.map((k) => k.id));
const LEGEND_CLASS: Record<KindId, string> = { people: 's-person', places: '', works: 's-work', ideas: 's-idea' };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** The route remounts the page per book (key = slug), so no state from one book leaks into the next. */
export function BookRoute() {
  const { slug = '' } = useParams();
  return <BookPage key={slug} slug={slug} />;
}

function BookPage({ slug }: { slug: string }) {
  const [bundle, setBundle] = useState<BookBundle>();
  const [error, setError] = useState<string>();
  const [at, setAt] = useState<string>();
  const [showAll, setShowAll] = useState(false);
  const [bookOnly, setBookOnly] = useState(false);
  const [kinds, setKinds] = useState<Set<KindId>>(ALL_KINDS);
  // The chosen figure lives in the URL (?e=virgil), so it can be bookmarked and shared.
  const [params, setParams] = useSearchParams();
  const selected = params.get('e') ?? undefined;
  const setSelected = (id: string | undefined) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('e', id); else n.delete('e'); return n; }, { replace: true });
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let live = true;
    fetchBook(slug)
      .then((b) => { if (live) { setBundle(b); setAt(b.progress.currentSection); } })
      .catch((err: unknown) => live && setError(String(err)));
    return () => { live = false; };
  }, [slug]);

  const lang = bundle?.book.language ?? 'en';
  const name = (id: string) => {
    const e = bundle?.entities[id];
    return e ? (e.name[lang] ?? Object.values(e.name)[0] ?? id) : id;
  };
  const view = bundle && at ? (showAll ? bundle.book.sections.at(-1)?.id ?? at : at) : undefined;
  const visible = useMemo(() => (bundle && view ? computeVisibility(bundle, view) : undefined), [bundle, view]);
  const elements = useMemo(
    () => (bundle && visible ? graphElements(bundle, visible, { bookOnly, kinds: kinds.size === ALL_KINDS.size ? undefined : kinds }) : []),
    [bundle, visible, bookOnly, kinds],
  );
  const debuts = useMemo(() => {
    const m = new Map<string, string[]>();
    bundle?.graph.nodes.forEach((n) => {
      if (n.depth !== 1) return;
      const e = bundle.entities[n.entity];
      const label = e ? (e.name[bundle.book.language] ?? Object.values(e.name)[0] ?? n.entity) : n.entity;
      m.set(n.firstSection, [...(m.get(n.firstSection) ?? []), label]);
    });
    return m;
  }, [bundle]);
  const hits = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return undefined;
    return new Set(elements.filter((e) => e.group === 'nodes' && e.data.label.toLowerCase().includes(q)).map((e) => e.data.id));
  }, [query, elements]);

  // The card opens only when the reader chooses someone; a choice the reading position now hides is dropped.
  const shown = new Set(elements.filter((e) => e.group === 'nodes').map((e) => e.data.id));
  const current = selected && shown.has(selected) ? selected : undefined;
  const pickNode = current ? [...(visible?.nodes ?? []), ...(visible?.context ?? [])].find((n) => n.entity === current) : undefined;

  if (error) return <Shell crumbs={[['Library', '/'], ['Book']]}><p className="sub">Couldn’t load this book. {error}</p></Shell>;
  if (!bundle || !at || !visible) return <Shell crumbs={[['Library', '/'], ['…']]}><p className="meta">Loading the book…</p></Shell>;

  const { book } = bundle;
  const sec = book.sections.find((s) => s.id === at);
  const sectionLabel = (id: string) => book.sections.find((s) => s.id === id)?.label ?? id;
  const next = book.sections[book.sections.findIndex((s) => s.id === at) + 1];
  const move = (id: string) => {
    setAt(id);
    putProgress(book.slug, id).catch((err: unknown) => setError(String(err)));
  };
  const toggleKind = (k: KindId) => setKinds((prev) => {
    const nextSet = new Set(prev);
    if (nextSet.has(k) && nextSet.size > 1) nextSet.delete(k); else nextSet.add(k);
    return nextSet;
  });
  const CARD = 380;
  const pageOf = (id: string) => `/book/${book.slug}/e/${id}${showAll ? '?all' : ''}`;

  return (
    <Shell
      crumbs={[['Library', '/'], [book.title]]}
      search={
        <label className="search">
          <SearchIcon />
          <input
            type="search" placeholder="Search this book" aria-label="Search this book" value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && hits?.size) setSelected([...hits][0]); if (e.key === 'Escape') setQuery(''); }}
          />
          {hits && <span className="search-hits num">{plural(hits.size, 'match', 'matches')}</span>}
        </label>
      }
      end={<label className="toggle"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} /> Show everything</label>}
    >
      <div className="title-row">
        <div>
          <h1>{book.title}</h1>
          <p>
            {showAll
              ? 'Showing the whole poem, spoilers included. Your place is kept.'
              : <>
                  {[sec?.group, sec?.label].filter(Boolean).join(', ')}.{' '}
                  {visible.newHere.length > 0 && <span className="gilt">{visible.newHere.length} new</span>}
                  {visible.newHere.length > 0 ? ' in this canto; ' : 'No one new in this canto; '}
                  {plural(visible.ahead.nodes, 'more figure')} still ahead.
                </>}
          </p>
        </div>
        {next && !showAll && <button className="btn" onClick={() => move(next.id)}>I’ve read {sec?.label}</button>}
      </div>

      <section className="panel strip-panel" aria-labelledby="strip-h">
        <div className="panel-head">
          <h2 id="strip-h">Where you are</h2>
          <span className="meta">Each dot is someone or something met for the first time. Ahead, only the count shows.</span>
        </div>
        <CantoStrip sections={book.sections} at={at} debuts={debuts} onChange={move} />
        {visible.newHere.length > 0 && !showAll && (
          <ul className="faces" aria-label={`New in ${sec?.label ?? 'this canto'}`}>
            {visible.newHere.map((n) => {
              const pic = pictureOf(bundle.entities[n.entity], n);
              return (
                <li key={n.entity}>
                  <button type="button" aria-pressed={current === n.entity} onClick={() => setSelected(n.entity)}>
                    {pic?.imageUrl && <img src={thumb(pic.imageUrl, 120)} alt="" />}{name(n.entity)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel map" aria-labelledby="map-h">
        <div className="panel-head">
          <h2 id="map-h">{showAll ? 'The whole poem' : 'Everything met so far'}</h2>
          <div className="legend" aria-label="Key and filter">
            {KINDS.map((k) => (
              <button key={k.id} aria-pressed={kinds.has(k.id)} onClick={() => toggleKind(k.id)} title={`Show or hide ${k.label.toLowerCase()}`}>
                <i className={LEGEND_CLASS[k.id]} />{k.label}
              </button>
            ))}
            <span><i className="s-ctx" />Context</span>
            <span><i className="s-new" />New in this canto</span>
          </div>
        </div>
        <GraphCanvas
          elements={elements}
          anchors={anchorsOf(elements)}
          selected={current}
          hits={hits}
          onSelect={setSelected}
          onOpen={(id) => navigate(pageOf(id))}
          reserveRight={pickNode ? CARD + 16 : 0}
          label={`Map of the ${plural(visible.nodes.length, 'figure')} and ${visible.context.length} context entries met so far, in reading order`}
        >
          {pickNode && (
            <aside className="panel pick map-card" aria-label="Chosen on the map" style={{ width: CARD }}>
              <button type="button" className="card-close" aria-label="Close" onClick={() => setSelected(undefined)}>×</button>
              <EntityPreview bundle={bundle} node={pickNode} sectionLabel={sectionLabel} edges={visible.edges} onPick={setSelected} pageUrl={pageOf(pickNode.entity)} />
            </aside>
          )}
        </GraphCanvas>
        <div className="map-foot">
          <div className="seg" role="group" aria-label="Show">
            <button aria-pressed={!bookOnly} onClick={() => setBookOnly(false)}>With context</button>
            <button aria-pressed={bookOnly} onClick={() => setBookOnly(true)}>Only the book</button>
          </div>
          <span className="meta num">
            {visible.nodes.length} met · {visible.context.length} context · {visible.edges.length} connections · drag to move, scroll to zoom
          </span>
        </div>
      </section>
    </Shell>
  );
}
