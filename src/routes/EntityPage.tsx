// /book/:slug/e/:id, one figure or context entry. Ported from design/prototype/entity.html.
// Everything shown comes from entityView, so the page can't show more than the reader has reached.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import type { BookBundle, MediaItem } from '../schema/index.ts';
import { fetchBook } from '../client/api.ts';
import { entityView, type ContextEntry, type EntityView } from '../lib/entityView.ts';
import { graphElements, type ElementDef } from '../lib/graphElements.ts';
import { computeVisibility } from '../lib/visibility.ts';
import { TYPE_LABEL } from '../lib/labels.ts';
import { embedSrc, thumb } from '../lib/media.ts';
import { Shell } from '../components/Shell.tsx';
import { Lightbox } from '../components/Lightbox.tsx';
import { Player, SourceCard } from '../components/Sources.tsx';
import { GraphCanvas } from '../components/GraphCanvas.tsx';

/** Remount per book and entity, so nothing from one page leaks into the next. */
export function EntityRoute() {
  const { slug = '', id = '' } = useParams();
  return <EntityPage key={`${slug}/${id}`} slug={slug} id={id} />;
}

function EntityPage({ slug, id }: { slug: string; id: string }) {
  const [bundle, setBundle] = useState<BookBundle>();
  const [error, setError] = useState<string>();
  // ?all mirrors the map's "Show everything": the whole book, without moving the reader's place.
  const [params] = useSearchParams();
  const showAll = params.has('all');

  useEffect(() => {
    let live = true;
    fetchBook(slug)
      .then((b) => { if (live) setBundle(b); })
      .catch((err: unknown) => live && setError(String(err)));
    return () => { live = false; };
  }, [slug]);

  const at = bundle ? (showAll ? bundle.book.sections.at(-1)?.id : undefined) ?? bundle.progress.currentSection : undefined;
  const visible = useMemo(() => (bundle && at ? computeVisibility(bundle, at) : undefined), [bundle, at]);
  const view = useMemo(() => (bundle && at && visible ? entityView(bundle, id, at, visible) : undefined), [bundle, id, at, visible]);
  // The ego graph: this entity and its visible neighbours. Built only for an entity the reader has met.
  const ego = useMemo(() => (bundle && visible && view ? graphElements(bundle, visible, { focus: id }) : []), [bundle, visible, view, id]);
  const navigate = useNavigate();

  if (error) return <Shell crumbs={[['Library', '/'], ['Book']]}><p className="sub">Couldn’t load this book. {error}</p></Shell>;
  if (!bundle || !at) return <Shell crumbs={[['Library', '/'], ['…']]}><p className="meta">Loading…</p></Shell>;

  const { book } = bundle;
  const mapUrl = `/book/${book.slug}${view ? `?e=${view.id}` : ''}`;
  const crumbs: [string, string?][] = [['Library', '/'], [book.title, `/book/${book.slug}`]];

  // Not met yet (or not in this book): say so without naming it. The id in the URL is all the reader typed.
  if (!view) {
    const inBook = bundle.graph.nodes.some((n) => n.entity === id);
    return (
      <Shell crumbs={[...crumbs, ['Not met yet']]}>
        <div className="title-row"><div>
          <h1>{inBook ? 'Not met yet' : 'Not in this book'}</h1>
          <p>{inBook ? 'This one turns up later in the book. Read on, and the page opens when you get there.' : `Nothing by that name in ${book.title}.`}</p>
        </div></div>
        <Link className="btn" to={`/book/${book.slug}`}>Back to the map</Link>
      </Shell>
    );
  }

  // Labels repeat across parts ("Canto XVII" is in all three canticles), so name the part when the book has several.
  const parts = new Set(book.sections.map((x) => x.group)).size > 1;
  const sectionLabel = (s: string) => {
    const x = book.sections.find((y) => y.id === s);
    return x ? (parts && x.group ? `${x.label}, ${x.group}` : x.label) : s;
  };
  const pageOf = (e: string) => `/book/${book.slug}/e/${e}${showAll ? '?all' : ''}`;
  const kind = [TYPE_LABEL[view.entity.type], view.entity.dates?.label].filter(Boolean).join(', ');
  const main = (
    <>
      <About view={view} />
      <Look items={view.media.look} sectionLabel={sectionLabel} />
      <Sources id="watch" title="Watch and listen" items={view.media.watch} sectionLabel={sectionLabel} />
      <Sources id="read" title="Read" items={view.media.read} sectionLabel={sectionLabel} />
      <KnowThemBy entries={view.context} pageOf={pageOf} />
    </>
  );
  const connections = <Connections view={view} ego={ego} pageOf={pageOf} sectionLabel={sectionLabel} onOpen={(n) => navigate(pageOf(n))} />;

  return (
    <Shell crumbs={[...crumbs, [view.name]]} end={<Link className="btn" to={mapUrl}>Show on the map</Link>}>
      <div className="title-row">
        <div>
          <h1>{view.name}</h1>
          <p>
            {kind}. {view.role}.{' '}
            {view.firstSection
              ? <>First met in {sectionLabel(view.firstSection)}.</>
              : <>Context for <Names refs={view.via} pageOf={pageOf} />.</>}
            {showAll && <> Showing the whole book, spoilers included.</>}
          </p>
        </div>
      </div>
      {view.depth === 1 ? (
        <div className="detail">
          <div className="entity">
            {main}
          </div>
          {/* One panel the height of the main column, so both columns end level; its content stays in view while scrolling. */}
          <aside className="rail panel" aria-label="In the book">
            <div className="rail-inner">
              <InThisBook view={view} at={at} sectionLabel={sectionLabel} showAll={showAll} />
              {connections}
            </div>
          </aside>
        </div>
      ) : (
        // A context entry has no notes of its own, so no rail: its connections close the page at full width.
        <div className="entity">
          {main}
          <div className="panel">{connections}</div>
        </div>
      )}
    </Shell>
  );
}

/** The ego graph, then the same connections as sentences (the canvas alone is invisible to a screen reader). */
function Connections({ view, ego, pageOf, sectionLabel, onOpen }: {
  view: EntityView; ego: ElementDef[]; pageOf: (id: string) => string; sectionLabel: (id: string) => string; onOpen: (id: string) => void;
}) {
  const SHOWN = 8; // as on the map card; the rest fold away
  const sentence = (n: EntityView['neighbours'][number]) => {
    const other = <Link className="pick-link" to={pageOf(n.id)}>{n.name}</Link>;
    return (
      <li key={`${n.direction}|${n.id}|${n.label}`}>
        {n.direction === 'out' ? <><b>{view.name}</b> {n.label} {other}</> : <>{other} {n.label} <b>{view.name}</b></>}
        {n.section && <span className="meta"> · {sectionLabel(n.section)}</span>}
      </li>
    );
  };
  return (
    <section className="ego-panel" aria-labelledby="ego-h">
      <div className="panel-head">
        <h2 id="ego-h">Connections</h2>
        <span className="meta num">{view.neighbours.length === 1 ? '1 so far' : `${view.neighbours.length} so far`}</span>
      </div>
      <GraphCanvas
        elements={ego}
        anchors={[view.id]}
        selected={view.id}
        onSelect={(n) => { if (n && n !== view.id) onOpen(n); }}
        className="cy ego"
        label={`${view.name} and the ${view.neighbours.length} people, places, works and ideas connected so far`}
      />
      {view.neighbours.length > 0 && (
        <ul className="relations" aria-label="Connections as sentences">
          {view.neighbours.slice(0, SHOWN).map(sentence)}
          {view.neighbours.length > SHOWN && (
            <li>
              <details>
                <summary className="meta">{view.neighbours.length - SHOWN} more</summary>
                <ul className="relations">{view.neighbours.slice(SHOWN).map(sentence)}</ul>
              </details>
            </li>
          )}
        </ul>
      )}
    </section>
  );
}

/** The in-book notes up to the reader's place, the current section in gilt; what is ahead is only counted. */
function InThisBook({ view, at, sectionLabel, showAll }: { view: EntityView; at: string; sectionLabel: (id: string) => string; showAll: boolean }) {
  const { notes, media } = view.hidden;
  const ahead = [notes > 0 && (notes === 1 ? '1 more note' : `${notes} more notes`), media > 0 && (media === 1 ? '1 more source' : `${media} more sources`)].filter(Boolean);
  return (
    <section aria-labelledby="book-h">
      <div className="panel-head">
        <h2 id="book-h">In this book</h2>
        <span className="meta">{showAll ? 'The whole book' : `Up to ${sectionLabel(at)}`}</span>
      </div>
      {view.notes.length > 0
        ? <ol className="notes">{view.notes.map((n) => (
            <li key={`${n.section}|${n.text}`} className={n.section === at && !showAll ? 'now' : undefined}>
              <span className="c">{sectionLabel(n.section)}</span><span>{n.text}</span>
            </li>
          ))}</ol>
        : <p className="sub">Nothing noted yet.</p>}
      {ahead.length > 0 && <p className="empty-line num">{ahead.join(' and ')} after this canto, hidden until you read on.</p>}
    </section>
  );
}

/** Context one step out from the book: why it matters here, what it is, and its own page. */
function KnowThemBy({ entries, pageOf }: { entries: ContextEntry[]; pageOf: (id: string) => string }) {
  if (entries.length === 0) return null;
  const pics = entries.flatMap((c) => (c.picture?.imageUrl ? [c.picture] : []));
  return (
    <section className="panel" aria-labelledby="ctx-h">
      <div className="panel-head">
        <h2 id="ctx-h">To know them by</h2>
        <span className="meta">One step out from the book, and no further</span>
      </div>
      <div className="ctx">
        {entries.map((c) => (
          <Link key={c.id} className="ctx-card" to={pageOf(c.id)}>
            {c.picture?.imageUrl && <img src={thumb(c.picture.imageUrl, 120)} alt="" loading="lazy" />}
            <span className="ctx-body">
              <b>{c.name}</b>
              <span className="why">{c.why}</span>
              <span className="meta">{c.summary}</span>
            </span>
          </Link>
        ))}
      </div>
      {pics.length > 0 && (
        <p className="meta credits">
          Pictures:{' '}
          {pics.map((m, i) => <span key={m.url}>{i > 0 && '; '}<a href={m.url} target="_blank" rel="noopener noreferrer">{m.attribution ?? m.publisher}</a></span>)}.
        </p>
      )}
    </section>
  );
}

function About({ view }: { view: EntityView }) {
  const pic = view.picture;
  const wiki = view.entity.links?.wikipedia;
  const wikiUrl = wiki ? Object.values(wiki)[0] : undefined;
  return (
    <section className={`panel about${pic?.imageUrl ? '' : ' no-pic'}`} aria-label={`About ${view.name}`}>
      {pic?.imageUrl && (
        <a className="portrait" href={pic.url} target="_blank" rel="noopener noreferrer" aria-label={`${pic.title}, on Wikimedia Commons`}>
          <img src={thumb(pic.imageUrl, 500)} alt={pic.title} />
        </a>
      )}
      <div>
        <p className="summary">{view.summary}</p>
        {view.facts.length > 0 && <ul className="facts">{view.facts.map((f) => <li key={f}>{f}</li>)}</ul>}
        {pic?.imageUrl && <Credit pic={pic} />}
        {wikiUrl && <p className="meta more"><a href={wikiUrl} target="_blank" rel="noopener noreferrer">Wikipedia</a></p>}
      </div>
    </section>
  );
}

function Look({ items, sectionLabel }: { items: MediaItem[]; sectionLabel: (id: string) => string }) {
  const [open, setOpen] = useState<number>();
  if (items.length === 0) return null;
  return (
    <section className="panel" aria-labelledby="look-h">
      <div className="panel-head">
        <h2 id="look-h">Look</h2>
        <span className="meta num">{items.length === 1 ? '1 picture' : `${items.length} pictures`}, in reading order</span>
      </div>
      <div className="look">
        {items.map((m, i) => m.imageUrl && (
          <figure key={`${i}-${m.url}`}>
            <button type="button" className="frame" onClick={() => setOpen(i)} aria-label={`Open ${m.title}`}>
              <img src={thumb(m.imageUrl, 500)} alt="" loading="lazy" />
            </button>
            <figcaption>
              <span>{m.title}</span>
              <span className="meta">{[m.creator, m.section && sectionLabel(m.section)].filter(Boolean).join(' · ')}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="meta credits">
        Pictures:{' '}
        {items.map((m, i) => (
          <span key={`${i}-${m.url}`}>{i > 0 && '; '}<a href={m.url} target="_blank" rel="noopener noreferrer">{m.attribution ?? m.publisher}</a></span>
        ))}.
      </p>
      {open !== undefined && <Lightbox items={items} index={open} onIndex={setOpen} onClose={() => setOpen(undefined)} sectionLabel={sectionLabel} />}
    </section>
  );
}

/** Players first (they play here), then cards that open the source elsewhere. */
function Sources({ id, title, items, sectionLabel }: { id: string; title: string; items: MediaItem[]; sectionLabel: (id: string) => string }) {
  if (items.length === 0) return null;
  const players = items.filter((m) => embedSrc(m));
  const cards = items.filter((m) => !embedSrc(m));
  return (
    <section className="panel" aria-labelledby={`${id}-h`}>
      <div className="panel-head">
        <h2 id={`${id}-h`}>{title}</h2>
        <span className="meta num">{items.length === 1 ? '1 source' : `${items.length} sources`}</span>
      </div>
      {/* With players, players and cards share one two-column grid, so a lone player doesn't leave half a row empty. */}
      <div className={players.length > 0 ? 'players' : 'cards'}>
        {players.map((m) => <Player key={m.url} m={m} sectionLabel={sectionLabel} />)}
        {cards.map((m) => <SourceCard key={m.url} m={m} sectionLabel={sectionLabel} />)}
      </div>
    </section>
  );
}

/** The caption under a picture: what it is, then who made it and on what terms, linked to its source page.
 *  No year: for a photographed artwork it is the photo's year, which reads as the artwork's. */
export function Credit({ pic }: { pic: MediaItem }) {
  return (
    <p className="meta caption">
      {pic.title}.{' '}
      <a href={pic.url} target="_blank" rel="noopener noreferrer">{pic.attribution ?? pic.creator ?? pic.publisher}</a>
    </p>
  );
}

function Names({ refs, pageOf }: { refs: { id: string; name: string }[]; pageOf: (id: string) => string }) {
  return refs.map((r, i) => (
    <span key={r.id}>{i > 0 && (i === refs.length - 1 ? ' and ' : ', ')}<Link className="pick-link" to={pageOf(r.id)}>{r.name}</Link></span>
  ));
}
