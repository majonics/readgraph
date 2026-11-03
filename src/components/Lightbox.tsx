// A picture viewer on the native <dialog>: Esc, focus trapping and the backdrop come from the browser.
// Arrow keys and a horizontal swipe step through the pictures. Mount it only while open.
import { useEffect, useRef } from 'react';
import type { MediaItem } from '../schema/index.ts';
import { thumb } from '../lib/media.ts';

interface Props {
  items: MediaItem[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
  sectionLabel: (id: string) => string;
}

const SWIPE = 50; // px of horizontal travel that counts as a swipe

export function Lightbox({ items, index, onIndex, onClose, sectionLabel }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const startX = useRef<number>(undefined);
  // showModal focuses the first focusable element (a credit link), so move focus to Close afterwards.
  useEffect(() => { const d = dialog.current; if (d && !d.open) { d.showModal(); closeBtn.current?.focus(); } }, []);

  const m = items[index];
  if (!m?.imageUrl) return null;
  const many = items.length > 1;
  const go = (step: number) => onIndex((index + step + items.length) % items.length);

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label={m.title}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialog.current) dialog.current.close(); }}
      onKeyDown={(e) => {
        if (!many) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      }}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => {
        const dx = startX.current === undefined ? 0 : e.clientX - startX.current;
        startX.current = undefined;
        if (many && Math.abs(dx) > SWIPE) go(dx < 0 ? 1 : -1);
      }}
    >
      <figure>
        <img key={m.imageUrl} src={thumb(m.imageUrl, 1280)} alt={m.title} draggable={false} />
        <figcaption>
          <div>
            <p className="t">{m.title}</p>
            <p className="meta">
              {[m.creator, m.section && sectionLabel(m.section), many && `${index + 1} of ${items.length}`].filter(Boolean).join(' · ')}
            </p>
            <p className="why">{m.why}</p>
            <p className="meta credit"><a href={m.url} target="_blank" rel="noopener noreferrer">{m.attribution ?? m.publisher}</a></p>
          </div>
          <div className="lb-controls">
            {many && <button type="button" className="btn" onClick={() => go(-1)} aria-label="Previous picture">←</button>}
            {many && <button type="button" className="btn" onClick={() => go(1)} aria-label="Next picture">→</button>}
            <button ref={closeBtn} type="button" className="btn" onClick={() => dialog.current?.close()}>Close</button>
          </div>
        </figcaption>
      </figure>
    </dialog>
  );
}
