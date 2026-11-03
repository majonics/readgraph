// Shared UI for the prototype: shell, canto strip, graph. Plain DOM, no build step.
window.RGUI = (() => {
  const D = window.RG;
  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const fmt = (n) => new Intl.NumberFormat('en').format(n);
  const listNames = (arr) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);

  // Reading position: a per-viewer convenience, so browser storage is fine here; the app will use progress.json.
  const progress = {
    get() { try { const v = localStorage.getItem('rg.at'); if (v && v in D.index) return v; } catch {} return D.defaultAt; },
    set(id) { try { localStorage.setItem('rg.at', id); } catch {} },
  };
  const sectionName = (id) => { const s = D.sectionOf(id); return `${s.group}, ${s.label}`; };

  const mark = `<svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
    <path d="M13 13 L5 6 M13 13 L22 8 M13 13 L9 22 M13 13 L21 20" stroke="#6b6b6b" stroke-width="1.5"/>
    <circle cx="5" cy="6" r="2.5" fill="#e6e6e6"/><circle cx="22" cy="8" r="2" fill="#e6e6e6"/>
    <circle cx="9" cy="22" r="2" fill="#e6e6e6"/><circle cx="21" cy="20" r="2.5" fill="none" stroke="#e6e6e6" stroke-width="1.5"/>
    <circle cx="13" cy="13" r="4.5" fill="var(--accent)"/></svg>`;
  const icon = {
    library: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2.5 2.5v11M6 2.5v11M9.5 3l3.5 10.2"/></svg>',
    search: '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>',
    menu: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M2 5h14M2 9h14M2 13h14"/></svg>',
    chevron: '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m4.5 2.5 3.5 3.5-3.5 3.5"/></svg>',
  };

  function shell({ active, crumbs, search = 'Search people, places and works', end = '' }) {
    const books = D.books;
    const bookLink = (b) => `<a href="${b.slug === 'divine-comedy' ? 'book.html' : '#'}" ${active === b.slug ? 'aria-current="page"' : ''}>
      <img class="thumb" src="${b.cover}" alt="">${esc(b.title)}</a>`;
    const crumbHtml = crumbs
      ? `<nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => (i === crumbs.length - 1
        ? `<span aria-current="page">${esc(c[0])}</span>` : `<a href="${c[1]}">${esc(c[0])}</a>${icon.chevron}`)).join('')}</nav>`
      : '';
    document.body.insertAdjacentHTML('afterbegin', `
      <div class="shell">
        <aside class="side" id="side">
          <a class="brand" href="index.html" aria-label="readgraph, library">${mark}<span>readgraph</span></a>
          <nav class="nav" aria-label="Main">
            <a href="index.html" ${active === 'library' ? 'aria-current="page"' : ''}>${icon.library}Library</a>
            <div class="nav-group">Reading</div>
            ${books.filter((b) => b.status === 'reading').map(bookLink).join('')}
            <div class="nav-group">Finished</div>
            ${books.filter((b) => b.status === 'finished').map(bookLink).join('')}
          </nav>
          <p class="side-foot">Build new graphs in Claude Code with <b>/build-graph</b></p>
        </aside>
        <header class="top">
          <button class="menu-btn" aria-label="Open menu" aria-expanded="false" aria-controls="side">${icon.menu}</button>
          ${crumbHtml}
          ${search ? `<label class="search">${icon.search}<input type="search" placeholder="${esc(search)}" aria-label="${esc(search)}"></label>` : ''}
          <div class="top-end">${end}</div>
        </header>
        <main class="canvas" id="main"></main>
      </div>`);
    const btn = document.querySelector('.menu-btn');
    const side = document.getElementById('side');
    btn.addEventListener('click', () => { const open = side.classList.toggle('open'); btn.setAttribute('aria-expanded', open); });
    return document.getElementById('main');
  }

  // The canto strip: 100 cantos, read / now / ahead, with a dot for each first appearance.
  // Ahead, it shows how many, never who. Works as a slider from the keyboard.
  function strip(el, { at, onChange, compact = false, labels = true }) {
    const groups = D.canticles.map((c) => D.sections.filter((s) => s.group === c.name));
    const maxDots = compact ? 4 : 8;
    el.classList.add('strip');
    if (compact) el.classList.add('compact');
    el.setAttribute('role', 'slider');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', 'Reading position');
    el.setAttribute('aria-valuemin', '1');
    el.setAttribute('aria-valuemax', String(D.sections.length));
    const render = () => {
      const now = D.index[at];
      el.setAttribute('aria-valuenow', String(now + 1));
      el.setAttribute('aria-valuetext', sectionName(at));
      const here = D.sectionOf(at).group;
      el.innerHTML = `<div class="strip-cells">${groups.map((g) => `<div class="strip-group ${g[0].group === here ? 'current' : ''}">${g.map((s) => {
        const i = D.index[s.id];
        const n = D.debutsPerSection[i];
        const cls = i < now ? 'read' : i === now ? 'now' : '';
        return `<div class="cell ${cls}" data-id="${s.id}"><span class="bar"></span>${'<span class="dot"></span>'.repeat(Math.min(n, maxDots))}</div>`;
      }).join('')}</div>`).join('')}</div>
      ${labels ? `<div class="strip-labels">${D.canticles.map((c) => `<span class="${c.name === here ? 'current' : ''}"><span>${c.name}</span><span class="count num">${c.count} cantos</span></span>`).join('')}</div>` : ''}
      <div class="strip-tip" aria-hidden="true"></div>`;
    };
    render();
    const tip = () => el.querySelector('.strip-tip');
    const describe = (id) => {
      const i = D.index[id], n = D.debutsPerSection[i];
      const who = i <= D.index[at] ? D.met.filter((e) => e.first === id).map((e) => e.name) : null;
      return `${sectionName(id)} · ${n ? (who ? who.join(', ') : `${n} new, ahead`) : 'no one new'}`;
    };
    el.addEventListener('mousemove', (e) => {
      const cell = e.target.closest('.cell'); const t = tip();
      if (!cell) { t.classList.remove('on'); return; }
      const r = el.getBoundingClientRect(), c = cell.getBoundingClientRect();
      t.textContent = describe(cell.dataset.id);
      t.style.left = `${Math.min(Math.max(c.left + c.width / 2 - r.left, 80), r.width - 80)}px`;
      t.classList.add('on');
    });
    el.addEventListener('mouseleave', () => tip().classList.remove('on'));
    const go = (id) => { if (id === at) return; at = id; render(); onChange && onChange(id); };
    el.addEventListener('click', (e) => { const cell = e.target.closest('.cell'); if (cell) go(cell.dataset.id); });
    el.addEventListener('keydown', (e) => {
      const i = D.index[at];
      const step = { ArrowRight: 1, ArrowUp: 1, ArrowLeft: -1, ArrowDown: -1 }[e.key];
      if (step) { e.preventDefault(); go(D.sections[Math.max(0, Math.min(D.sections.length - 1, i + step))].id); }
      if (e.key === 'Home') { e.preventDefault(); go(D.sections[0].id); }
      if (e.key === 'End') { e.preventDefault(); go(D.sections[D.sections.length - 1].id); }
    });
    return { set(id) { at = id; render(); } };
  }

  // ---------- graph (Cytoscape) ----------
  const shapeOf = { person: 'ellipse', figure: 'ellipse', place: 'rectangle', work: 'round-rectangle', concept: 'diamond', group: 'diamond', era: 'diamond' };
  const sizeOf = { 3: 72, 2: 52, 1: 38 };

  function elements(at, { focus = null, filter = 'all' } = {}) {
    const v = D.visibleAt(at);
    let nodes = v.nodes.map((n) => ({ ...n, depth: 1 }));
    let ctx = v.context.map((c) => ({ ...c, depth: 2 }));
    let edges = v.edges;
    if (focus) {
      const keep = new Set([focus]);
      edges.forEach((e) => { if (e.source === focus) keep.add(e.target); if (e.target === focus) keep.add(e.source); });
      nodes = nodes.filter((n) => keep.has(n.id));
      ctx = ctx.filter((c) => keep.has(c.id));
      edges = edges.filter((e) => keep.has(e.source) && keep.has(e.target));
    }
    if (filter === 'book') { ctx = []; edges = edges.filter((e) => !D.byId[e.target].via && !D.byId[e.source].via); }
    const els = [];
    if (!focus) {
      els.push({ data: { id: 'book', label: '', level: 4, size: 84, image: D.books[0].cover }, classes: 'book' });
    }
    nodes.forEach((n) => {
      const isNew = n.first === at;
      els.push({ data: { id: n.id, label: n.name, level: focus === n.id ? 4 : n.imp === 3 ? 3 : 2, size: focus === n.id ? 84 : sizeOf[n.imp] * (n.type === 'work' ? 1 : 1), shape: shapeOf[n.type], image: n.image || null, w: (focus === n.id ? 84 : sizeOf[n.imp]) * (n.type === 'work' ? 1.5 : 1) },
        classes: ['d1', isNew ? 'new' : '', n.image ? 'img' : '', n.imp === 1 ? 'minor' : ''].join(' ') });
      if (!focus) els.push({ data: { id: `book-${n.id}`, source: 'book', target: n.id }, classes: 'to-book' });
    });
    ctx.forEach((c) => {
      els.push({ data: { id: c.id, label: c.name, level: 1, size: 26, w: c.type === 'work' ? 39 : 26, shape: shapeOf[c.type] }, classes: 'd2' });
    });
    edges.forEach((e, i) => els.push({ data: { id: `e${i}`, source: e.source, target: e.target, label: e.label } }));
    return els;
  }

  const style = [
    { selector: 'node', style: {
      'shape': 'data(shape)', 'width': 'data(w)', 'height': 'data(size)', 'background-color': '#e6e6e6',
      'label': 'data(label)', 'color': '#b4b4b4', 'font-family': 'Inter, system-ui, sans-serif', 'font-size': 15,
      'text-valign': 'bottom', 'text-margin-y': 6, 'text-wrap': 'wrap', 'text-max-width': 110,
      'transition-property': 'opacity, border-color', 'transition-duration': '150ms' } },
    { selector: 'node.img', style: { 'background-image': 'data(image)', 'background-fit': 'cover', 'background-color': '#2a2a2a' } },
    { selector: 'node.minor', style: { 'background-color': '#8a8a8a' } },
    { selector: 'node.book', style: { 'shape': 'ellipse', 'width': 84, 'height': 84, 'background-image': 'data(image)', 'background-fit': 'cover',
      'border-width': 2, 'border-color': '#ffffff', 'color': '#ffffff', 'font-size': 16, 'font-weight': 600 } },
    { selector: 'node.d2', style: { 'background-color': '#000000', 'border-width': 1.5, 'border-color': '#6b6b6b', 'color': '#949494' } },
    { selector: 'node.new', style: { 'border-width': 3, 'border-color': '#e0b04f', 'color': '#ffffff' } },
    { selector: 'node:selected', style: { 'border-width': 3, 'border-color': '#ffffff', 'color': '#ffffff', 'overlay-opacity': 0 } },
    { selector: 'node:active', style: { 'overlay-opacity': 0 } },
    { selector: 'edge', style: { 'width': 1, 'line-color': '#333333', 'curve-style': 'straight', 'transition-property': 'opacity, line-color', 'transition-duration': '150ms' } },
    { selector: 'edge.to-book', style: { 'line-color': '#1c1c1c' } },
    { selector: '.faded', style: { 'opacity': 0.28 } },
    { selector: 'edge.lit', style: { 'line-color': '#b4b4b4', 'label': 'data(label)', 'font-size': 11, 'color': '#b4b4b4',
      'font-family': 'Inter, system-ui, sans-serif', 'text-background-color': '#000', 'text-background-opacity': 1, 'text-background-padding': 3, 'text-rotation': 'autorotate' } },
    { selector: 'edge.to-book.lit', style: { 'label': '' } },
  ];

  function graph(el, { at, focus = null, filter = 'all', selected = null, onSelect } = {}) {
    const cy = cytoscape({
      container: el, elements: elements(at, { focus, filter }), style,
      layout: { name: 'concentric', concentric: (n) => n.data('level'), levelWidth: () => 1, minNodeSpacing: focus ? 30 : 12, padding: 20, animate: false },
      wheelSensitivity: 0.25, minZoom: 0.4, maxZoom: 2.5, autoungrabify: false, boxSelectionEnabled: false,
    });
    const light = (node) => {
      cy.elements().removeClass('faded lit');
      if (!node || node.id() === 'book') return;
      const hood = node.closedNeighborhood();
      cy.elements().not(hood).addClass('faded');
      hood.edges().addClass('lit');
    };
    cy.on('tap', 'node', (e) => { light(e.target); onSelect && onSelect(e.target.id()); });
    cy.on('tap', (e) => { if (e.target === cy) { cy.$(':selected').unselect(); light(null); onSelect && onSelect(null); } });
    // A selection carried in from elsewhere is marked, but the map opens undimmed; dimming follows the reader's own tap.
    if (selected && cy.getElementById(selected).length) { cy.getElementById(selected).select(); cy.getElementById(selected).connectedEdges().addClass('lit'); }
    return cy;
  }

  return { D, esc, fmt, listNames, progress, sectionName, shell, strip, graph, icon };
})();
