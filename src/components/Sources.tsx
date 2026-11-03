// Watch and listen, and Read: players that load only on a click, and cards that open the source in a new tab.
import { useState } from 'react';
import type { MediaItem } from '../schema/index.ts';
import { EMBED_HOST, embedSrc } from '../lib/media.ts';
import { KIND_NAME, TIER_NAME } from '../lib/labels.ts';

const minutes = (m: MediaItem) => (m.durationMin ? `${m.durationMin} min` : undefined);

/** Kind, publisher and tier: the line above a source's title. */
function metaLine(m: MediaItem) {
  return [KIND_NAME[m.kind], m.publisher, TIER_NAME[m.tier]].join(' · ');
}

/**
 * A video or lecture that plays here. Until the reader clicks, nothing is requested from the video host:
 * the poster is drawn locally (a host thumbnail would already be a request).
 */
export function Player({ m, sectionLabel }: { m: MediaItem; sectionLabel: (id: string) => string }) {
  const [on, setOn] = useState(false);
  const src = embedSrc(m);
  if (!src || !m.embed) return <SourceCard m={m} sectionLabel={sectionLabel} />;
  const host = EMBED_HOST[m.embed.type] ?? 'the web';
  return (
    <article className="player">
      <div className="screen">
        {/* The poster button disappears on the click, so focus moves into the player rather than falling to <body>. */}
        {on
          ? <iframe ref={(el) => el?.focus()} src={src} title={m.title} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
          : (
            <button type="button" className="poster" onClick={() => setOn(true)} aria-label={`Play ${m.title} (loads from ${host})`}>
              <span className="play" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 18 18"><path d="M5 3.5v11l9-5.5z" fill="currentColor" /></svg></span>
              <span className="poster-t">{m.title}</span>
              <span className="meta num">{[minutes(m), `plays from ${host} when you press play`].filter(Boolean).join(' · ')}</span>
            </button>
          )}
      </div>
      <div className="player-meta">
        <span className="kind">{metaLine(m)}{m.section ? ` · ${sectionLabel(m.section)}` : ''}</span>
        {m.creator && <span className="meta">{m.creator}</span>}
        <span className="why">{m.why}</span>
        <a className="meta out" href={m.url} target="_blank" rel="noopener noreferrer">Open the original page</a>
      </div>
    </article>
  );
}

/** A source without a player: a podcast page, a lecture page, an article or a book. Opens in a new tab. */
export function SourceCard({ m, sectionLabel }: { m: MediaItem; sectionLabel: (id: string) => string }) {
  return (
    <a className="source" href={m.url} target="_blank" rel="noopener noreferrer">
      <span className="kind">{metaLine(m)}{m.section ? ` · ${sectionLabel(m.section)}` : ''}</span>
      <span className="dur num">{minutes(m)}</span>
      <span className="t">{m.title}</span>
      {m.creator && <span className="meta by">{m.creator}</span>}
      <span className="why">{m.why}</span>
    </a>
  );
}
