// The signature element (docs/DESIGN.md): every section as a bar, read / current (gilt) / ahead, with a dot per
// first appearance above it. Ahead of the reader it shows how many, never who. It is the progress control.
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent } from 'react';
import type { Section } from '../schema/index.ts';

interface Props {
  sections: Section[];
  at: string;
  /** Names of the entities first met in each section, by section id (only used for sections already reached). */
  debuts: ReadonlyMap<string, string[]>;
  onChange: (id: string) => void;
  compact?: boolean;
  labels?: boolean;
}

export function CantoStrip({ sections, at, debuts, onChange, compact = false, labels = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ text: string; left: number }>();
  const now = sections.findIndex((s) => s.id === at);
  const maxDots = compact ? 4 : 8;

  const groups = useMemo(() => {
    const out: { name: string; items: { s: Section; i: number }[] }[] = [];
    sections.forEach((s, i) => {
      const name = s.group ?? '';
      const last = out[out.length - 1];
      if (last && last.name === name) last.items.push({ s, i });
      else out.push({ name, items: [{ s, i }] });
    });
    return out;
  }, [sections]);
  const here = sections[now]?.group ?? '';
  const columns = groups.map((g) => `${g.items.length}fr`).join(' ');
  const describe = (s: Section, i: number) => {
    const names = debuts.get(s.id) ?? [];
    const place = [s.group, s.label].filter(Boolean).join(', ');
    if (!names.length) return `${place} · no one new`;
    return `${place} · ${i <= now ? names.join(', ') : `${names.length} new, ahead`}`;
  };

  const move = (i: number) => {
    const s = sections[Math.max(0, Math.min(sections.length - 1, i))];
    if (s && s.id !== at) onChange(s.id);
  };
  const onKey = (e: KeyboardEvent) => {
    const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
    if (step) { e.preventDefault(); move(now + step); }
    if (e.key === 'Home') { e.preventDefault(); move(0); }
    if (e.key === 'End') { e.preventDefault(); move(sections.length - 1); }
  };
  const onHover = (e: MouseEvent, s: Section, i: number) => {
    const box = ref.current?.getBoundingClientRect();
    const cell = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!box) return;
    setTip({ text: describe(s, i), left: Math.min(Math.max(cell.left + cell.width / 2 - box.left, 90), box.width - 90) });
  };

  return (
    <div
      ref={ref}
      className={`strip${compact ? ' compact' : ''}`}
      role="slider"
      tabIndex={0}
      aria-label="Reading position"
      aria-valuemin={1}
      aria-valuemax={sections.length}
      aria-valuenow={now + 1}
      aria-valuetext={[sections[now]?.group, sections[now]?.label].filter(Boolean).join(', ')}
      onKeyDown={onKey}
      onMouseLeave={() => setTip(undefined)}
    >
      <div className="strip-cells" style={{ '--cols': columns } as CSSProperties}>
        {groups.map((g) => (
          <div key={g.name} className={`strip-group${g.name === here ? ' current' : ''}`}>
            {g.items.map(({ s, i }) => (
              <div
                key={s.id}
                className={`cell${i < now ? ' read' : i === now ? ' now' : ''}`}
                onClick={() => move(i)}
                onMouseEnter={(e) => onHover(e, s, i)}
              >
                <span className="bar" />
                {Array.from({ length: Math.min(debuts.get(s.id)?.length ?? 0, maxDots) }, (_, k) => <span key={k} className="dot" />)}
              </div>
            ))}
          </div>
        ))}
      </div>
      {labels && (
        <div className="strip-labels" style={{ '--cols': columns } as CSSProperties}>
          {groups.map((g) => (
            <span key={g.name} className={g.name === here ? 'current' : ''}>
              <span>{g.name}</span><span className="count num">{g.items.length} cantos</span>
            </span>
          ))}
        </div>
      )}
      <div className={`strip-tip${tip ? ' on' : ''}`} style={{ left: tip?.left }} aria-hidden="true">{tip?.text}</div>
    </div>
  );
}
