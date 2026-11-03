// Cytoscape behind a React boundary: React owns the data, this component owns the canvas.
// The whole-book map arrives with positions (the reading spiral); the ego graph is laid out in rings here.
// At rest the lines are faint curves and only names show; hovering or selecting a figure lights its relations.
import { useEffect, useRef } from 'react';
import cytoscape, { type Core, type StylesheetJson } from 'cytoscape';
import type { ElementDef } from '../lib/graphElements.ts';

const FONT = 'Inter, system-ui, sans-serif';
const PANEL = '#111111';
const STYLE: StylesheetJson = [
  { selector: 'node', style: {
    shape: 'data(shape)' as never, width: 'data(w)', height: 'data(h)',
    'background-color': '#1c1c1c', 'border-width': 2, 'border-color': '#e6e6e6',
    label: 'data(label)', color: '#e6e6e6', 'font-family': FONT, 'font-size': 16, 'font-weight': 500,
    'text-valign': 'bottom', 'text-margin-y': 8, 'text-wrap': 'wrap', 'text-max-width': '130',
    // An outline in the panel colour keeps names readable where a line passes under them.
    'text-outline-color': PANEL, 'text-outline-width': 3, 'text-outline-opacity': 1,
    'transition-property': 'opacity, border-color, border-width', 'transition-duration': 150,
  } },
  { selector: 'node.minor', style: { 'border-color': '#8a8a8a', color: '#b4b4b4', 'font-size': 15, 'font-weight': 400 } },
  { selector: 'node.img', style: { 'background-image': 'data(image)', 'background-fit': 'cover', 'background-color': '#2a2a2a', 'border-color': '#3a3a3a' } },
  { selector: 'node.companion', style: { 'font-size': 19, 'font-weight': 600, color: '#ffffff' } },
  { selector: 'node.d2', style: {
    'background-color': PANEL, 'border-width': 1.5, 'border-color': '#6b6b6b', color: '#9a9a9a', 'font-size': 14, 'font-weight': 400, 'text-margin-y': 6,
  } },
  { selector: 'node.new', style: { 'border-width': 4, 'border-color': '#e0b04f' } },
  { selector: 'node.hit', style: { 'border-width': 4, 'border-color': '#ffffff', color: '#ffffff' } },
  { selector: 'node:selected', style: { 'border-width': 4, 'border-color': '#ffffff', color: '#ffffff', 'overlay-opacity': 0 } },
  { selector: 'node:active', style: { 'overlay-opacity': 0 } },
  { selector: 'edge', style: {
    width: 1.2, 'line-color': '#2b2b2b', 'curve-style': 'unbundled-bezier',
    'control-point-distances': [28] as never, 'control-point-weights': [0.5] as never,
    'transition-property': 'opacity, line-color', 'transition-duration': 150,
  } },
  { selector: '.faded', style: { opacity: 0.14 } },
  // Relations are lit, not labelled: their names are listed in the selected figure's card, where they never collide.
  { selector: 'edge.lit', style: { width: 2, 'line-color': '#d0d0d0', 'z-index': 10 } },
  { selector: 'node.lit', style: { 'z-index': 20 } },
];

/** Below this zoom the names stop being comfortable to read; the map opens on the reader's place instead of shrinking. */
const READABLE = 0.7;

interface Props {
  elements: ElementDef[];
  /** Where the view opens when the whole map can't be shown at a readable size. */
  anchors?: string[];
  selected?: string;
  /** Search matches: marked, and everything else dimmed. Empty or undefined: no search. */
  hits?: ReadonlySet<string>;
  onSelect?: (id: string | undefined) => void;
  label: string;
  className?: string;
  /** Width covered by a floating card on the right; a selected node is panned clear of it. */
  reserveRight?: number;
  children?: React.ReactNode;
}

export function GraphCanvas({ elements, anchors, selected, hits, onSelect, label, className = 'cy', reserveRight = 0, children }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cy = useRef<Core>(null);
  const select = useRef(onSelect);
  const anchorIds = useRef(anchors);
  useEffect(() => { select.current = onSelect; anchorIds.current = anchors; }, [onSelect, anchors]);

  useEffect(() => {
    if (!box.current) return;
    const core = cytoscape({ container: box.current, style: STYLE, wheelSensitivity: 0.25, minZoom: 0.25, maxZoom: 2.5, boxSelectionEnabled: false });
    const light = (id?: string) => {
      core.elements().removeClass('faded lit');
      if (!id) return;
      const hood = core.getElementById(id).closedNeighborhood();
      core.elements().not(hood).addClass('faded');
      hood.addClass('lit');
    };
    core.on('mouseover', 'node', (e) => light(e.target.id()));
    core.on('mouseout', 'node', () => {
      light();
      const sel = core.$('node:selected');
      sel.addClass('lit');
      sel.connectedEdges().addClass('lit');
    });
    core.on('tap', 'node', (e) => select.current?.(e.target.id()));
    core.on('tap', (e) => { if (e.target === core) select.current?.(undefined); });
    cy.current = core;
    return () => { core.destroy(); cy.current = null; };
  }, []);

  // New elements: swap, place, and choose the opening view.
  useEffect(() => {
    const core = cy.current;
    if (!core) return;
    core.batch(() => {
      core.elements().remove();
      core.add(elements.map((e) => ({ group: e.group, data: e.data, classes: e.classes, ...(e.group === 'nodes' && e.position ? { position: e.position } : {}) })));
    });
    const preset = elements.some((e) => e.group === 'nodes' && e.position);
    core.layout(preset
      ? { name: 'preset', fit: false }
      : { name: 'concentric', concentric: (n) => Number(n.data('level')), levelWidth: () => 1, minNodeSpacing: 34, padding: 24, animate: false, fit: false }).run();
    frame(core, anchorIds.current);
  }, [elements]);

  useEffect(() => {
    const core = cy.current;
    if (!core) return;
    core.batch(() => {
      core.elements().removeClass('faded lit hit').unselect();
      if (hits && hits.size) {
        core.nodes().forEach((n) => { if (hits.has(n.id())) n.addClass('hit'); else n.addClass('faded'); });
        core.edges().addClass('faded');
      }
      if (selected) {
        const n = core.getElementById(selected);
        n.select();
        n.addClass('lit');
        n.connectedEdges().addClass('lit');
      }
    });
    // Keep the selected figure clear of the floating card on the right.
    const n = selected ? core.getElementById(selected) : undefined;
    if (n?.nonempty() && reserveRight) {
      const p = n.renderedPosition();
      const free = core.width() - reserveRight - 40;
      if (p.x > free || p.x < 40 || p.y < 40 || p.y > core.height() - 40) {
        core.animate({ panBy: { x: Math.min(0, free - p.x) + Math.max(0, 80 - p.x), y: Math.max(0, 80 - p.y) - Math.max(0, p.y - (core.height() - 80)) } }, { duration: 220 });
      }
    }
  }, [elements, selected, hits, reserveRight]);

  const zoomBy = (f: number) => {
    const core = cy.current;
    if (!core) return;
    core.animate({ zoom: { level: core.zoom() * f, renderedPosition: { x: core.width() / 2, y: core.height() / 2 } } }, { duration: 180 });
  };
  const fitAll = () => {
    const core = cy.current;
    if (core) core.animate({ fit: { eles: core.elements(), padding: 32 } }, { duration: 220 });
  };

  return (
    <div className="cy-wrap">
      <div ref={box} className={className} role="img" aria-label={label} />
      <div className="cy-controls" role="group" aria-label="Map view">
        <button type="button" onClick={() => zoomBy(1.25)} aria-label="Zoom in">+</button>
        <button type="button" onClick={() => zoomBy(0.8)} aria-label="Zoom out">−</button>
        <button type="button" onClick={fitAll}>Fit</button>
      </div>
      {children}
    </div>
  );
}

/** Show everything if that stays readable; otherwise open at a readable zoom on the anchors (the companions and what is new). */
function frame(core: Core, anchors?: string[]) {
  core.fit(core.elements(), 32);
  if (core.zoom() > 1.1) core.zoom(1.1);
  if (core.zoom() >= READABLE) { core.center(); return; }
  core.zoom(READABLE);
  const target = anchors?.length ? core.nodes().filter((n) => anchors.includes(n.id())) : core.elements();
  core.center(target.nonempty() ? target : core.elements());
}
