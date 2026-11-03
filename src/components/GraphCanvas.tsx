// Cytoscape behind a React boundary: React owns the data, this component owns the canvas.
// Hovering a node lights its neighbourhood; selection marks a node without dimming the map (the map never opens dimmed).
import { useEffect, useRef } from 'react';
import cytoscape, { type Core, type StylesheetJson } from 'cytoscape';
import type { ElementDef } from '../lib/graphElements.ts';
import { BOOK_ID } from '../lib/graphElements.ts';

const FONT = 'Inter, system-ui, sans-serif';
const STYLE: StylesheetJson = [
  { selector: 'node', style: {
    shape: 'data(shape)' as never, width: 'data(w)', height: 'data(h)', 'background-color': '#e6e6e6',
    label: 'data(label)', color: '#b4b4b4', 'font-family': FONT, 'font-size': 15,
    'text-valign': 'bottom', 'text-margin-y': 6, 'text-wrap': 'wrap', 'text-max-width': '110',
    'transition-property': 'opacity, border-color', 'transition-duration': 150,
  } },
  { selector: 'node.minor', style: { 'background-color': '#8a8a8a' } },
  { selector: 'node.img', style: { 'background-image': 'data(image)', 'background-fit': 'cover', 'background-color': '#2a2a2a' } },
  { selector: 'node.book', style: { 'background-image': 'data(image)', 'background-fit': 'cover', 'border-width': 2, 'border-color': '#ffffff' } },
  { selector: 'node.d2', style: { 'background-color': '#000000', 'border-width': 1.5, 'border-color': '#6b6b6b', color: '#949494' } },
  { selector: 'node.new', style: { 'border-width': 3, 'border-color': '#e0b04f', color: '#ffffff' } },
  { selector: 'node.hit', style: { 'border-width': 3, 'border-color': '#ffffff', color: '#ffffff' } },
  { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#ffffff', color: '#ffffff', 'overlay-opacity': 0 } },
  { selector: 'node:active', style: { 'overlay-opacity': 0 } },
  { selector: 'edge', style: { width: 1, 'line-color': '#333333', 'curve-style': 'straight', 'transition-property': 'opacity, line-color', 'transition-duration': 150 } },
  { selector: 'edge.to-book', style: { 'line-color': '#1c1c1c' } },
  { selector: '.faded', style: { opacity: 0.28 } },
  { selector: 'edge.lit', style: {
    'line-color': '#b4b4b4', label: 'data(label)', 'font-size': 12, color: '#b4b4b4', 'font-family': FONT,
    'text-background-color': '#000000', 'text-background-opacity': 1, 'text-background-padding': '3', 'text-rotation': 'autorotate',
  } },
  { selector: 'edge.to-book.lit', style: { label: '' } },
];

interface Props {
  elements: ElementDef[];
  selected?: string;
  /** Search matches: marked, and everything else dimmed. Empty or undefined: no search. */
  hits?: ReadonlySet<string>;
  onSelect?: (id: string | undefined) => void;
  label: string;
  className?: string;
}

export function GraphCanvas({ elements, selected, hits, onSelect, label, className = 'cy' }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const cy = useRef<Core>(null);
  const select = useRef(onSelect);
  useEffect(() => { select.current = onSelect; }, [onSelect]);

  // Create once; tear down on unmount.
  useEffect(() => {
    if (!box.current) return;
    const core = cytoscape({ container: box.current, style: STYLE, wheelSensitivity: 0.25, minZoom: 0.4, maxZoom: 2.5, boxSelectionEnabled: false });
    const light = (id?: string) => {
      core.elements().removeClass('faded lit');
      if (!id || id === BOOK_ID) return;
      const hood = core.getElementById(id).closedNeighborhood();
      core.elements().not(hood).addClass('faded');
      hood.edges().addClass('lit');
    };
    core.on('mouseover', 'node', (e) => light(e.target.id()));
    core.on('mouseout', 'node', () => {
      light();
      core.$('node:selected').connectedEdges().addClass('lit');
    });
    core.on('tap', 'node', (e) => select.current?.(e.target.id() === BOOK_ID ? undefined : e.target.id()));
    core.on('tap', (e) => { if (e.target === core) select.current?.(undefined); });
    cy.current = core;
    return () => { core.destroy(); cy.current = null; };
  }, []);

  // New elements: swap and lay out again.
  useEffect(() => {
    const core = cy.current;
    if (!core) return;
    core.batch(() => {
      core.elements().remove();
      core.add(elements.map((e) => ({ group: e.group, data: e.data, classes: e.classes })));
    });
    core.layout({
      name: 'concentric', concentric: (n) => Number(n.data('level')), levelWidth: () => 1,
      minNodeSpacing: elements.length < 30 ? 36 : 12, padding: 24, animate: false,
    }).run();
    // A small map fits by zooming in; past 1.1 the labels outgrow the page, so cap it and centre instead.
    if (core.zoom() > 1.1) { core.zoom(1.1); core.center(); }
  }, [elements]);

  // Selection and search marks.
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
        n.connectedEdges().addClass('lit');
      }
    });
  }, [elements, selected, hits]);

  return <div ref={box} className={className} role="img" aria-label={label} />;
}
