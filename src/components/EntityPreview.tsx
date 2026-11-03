// The rail card for the selected node: picture, what it is, its role as of now, the latest note, what there is to explore.
import type { BookBundle, BookNode, ContextNode, Edge, MediaItem } from '../schema/index.ts';
import { pictureOf, thumb } from '../lib/media.ts';

const TYPE_LABEL: Record<string, string> = {
  person: 'Person', figure: 'Figure of myth or legend', place: 'Place', work: 'Work',
  concept: 'Idea', group: 'Group', event: 'Event', era: 'Period',
};
const KIND_LABEL: Record<MediaItem['kind'], [string, string]> = {
  artwork: ['artwork', 'artworks'], image: ['picture', 'pictures'], video: ['video', 'videos'], lecture: ['lecture', 'lectures'],
  podcast: ['podcast', 'podcasts'], article: ['article', 'articles'], book: ['book', 'books'], map: ['map', 'maps'],
  audio: ['recording', 'recordings'], website: ['website', 'websites'],
};

interface Props {
  bundle: BookBundle;
  /** The node as visible at the reader's position (notes and media already filtered). */
  node: BookNode | ContextNode;
  sectionLabel: (id: string) => string;
  /** Visible relations; those touching this node are listed as sentences. */
  edges?: Edge[];
  /** Select another node from the relations list. */
  onPick?: (id: string) => void;
}

export function EntityPreview({ bundle, node, sectionLabel, edges = [], onPick }: Props) {
  const entity = bundle.entities[node.entity];
  if (!entity) return null;
  const lang = bundle.book.language;
  const name = entity.name[lang] ?? Object.values(entity.name)[0] ?? entity.id;
  const pic = pictureOf(entity, node.depth === 1 ? node : undefined);
  const latest = node.depth === 1 ? node.inBook.at(-1) : undefined;
  const parents = node.depth === 2 ? node.via.map((v) => bundle.entities[v]?.name[lang] ?? v) : [];
  const media = [...entity.media, ...(node.depth === 1 ? node.media : [])];
  const nameOf = (id: string) => { const e = bundle.entities[id]; return e ? (e.name[lang] ?? Object.values(e.name)[0] ?? id) : id; };
  const relations = edges.filter((e) => e.source === node.entity || e.target === node.entity);
  const RELATIONS_SHOWN = 8;
  const counts = new Map<MediaItem['kind'], number>();
  media.forEach((m) => counts.set(m.kind, (counts.get(m.kind) ?? 0) + 1));

  return (
    <>
      {pic?.imageUrl && (
        <figure className="hero" style={{ margin: 0 }}>
          <img src={thumb(pic.imageUrl, 960)} alt={pic.title} />
        </figure>
      )}
      {pic?.imageUrl && <p className="meta credit">{pic.title}{pic.creator ? `, ${pic.creator}` : ''}. {pic.license}.</p>}
      <h2 style={{ marginTop: pic ? 12 : 0 }}>{name}</h2>
      <p className="type">
        {TYPE_LABEL[entity.type]}
        {entity.dates ? ` · ${entity.dates.label}` : ''}
        {node.depth === 1 ? ` · first met in ${sectionLabel(node.firstSection)}` : ' · context'}
      </p>
      <p className="role">{node.depth === 1 ? node.role : node.why}</p>
      {latest && <div className="last"><span className="meta">Latest, {sectionLabel(latest.section)}</span>{latest.text}</div>}
      {parents.length > 0 && <div className="last"><span className="meta">Here because of</span>{parents.join(', ')}</div>}
      {relations.length > 0 && (
        <ul className="relations" aria-label="Relations so far">
          {relations.slice(0, RELATIONS_SHOWN).map((e) => {
            const other = e.source === node.entity ? e.target : e.source;
            const sentence = e.source === node.entity
              ? <><b>{name}</b> {e.label} <Pick id={other} name={nameOf(other)} onPick={onPick} /></>
              : <><Pick id={other} name={nameOf(other)} onPick={onPick} /> {e.label} <b>{name}</b></>;
            return <li key={`${e.source}|${e.type}|${e.target}`}>{sentence}{e.section && <span className="meta"> · {sectionLabel(e.section)}</span>}</li>;
          })}
          {relations.length > RELATIONS_SHOWN && <li className="meta">and {relations.length - RELATIONS_SHOWN} more on the map</li>}
        </ul>
      )}
      {node.depth === 2 && <p className="sub" style={{ marginTop: 14 }}>{entity.summary[lang] ?? Object.values(entity.summary)[0]}</p>}
      {counts.size > 0 && (
        <div className="sources" aria-label="Sources to explore">
          {[...counts].map(([kind, n]) => <span key={kind}><span className="num">{n}</span> {KIND_LABEL[kind][n === 1 ? 0 : 1]}</span>)}
        </div>
      )}
    </>
  );
}

function Pick({ id, name, onPick }: { id: string; name: string; onPick?: (id: string) => void }) {
  return onPick ? <button type="button" className="pick-link" onClick={() => onPick(id)}>{name}</button> : <>{name}</>;
}
