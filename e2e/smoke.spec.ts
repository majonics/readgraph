// Browser smoke tests: what the screenshots can't show. Clicks, keys, saving, and that nothing ahead of the reader leaks.
// They run against a copy of library/ (scripts/e2e-server.ts); each test starts the reader at Inferno, Canto I.
import { expect, test, type Page } from '@playwright/test';
import type { Core } from 'cytoscape';

const BOOK = '/book/divine-comedy';

/** The Cytoscape instance behind a map: Cytoscape keeps it on its container, so no test hook is needed in the app. */
function cyOf(page: Page, selector: string) {
  return {
    ids: () => page.evaluate((sel) => {
      const el = document.querySelector(sel) as unknown as { _cyreg?: { cy: Core } } | null;
      return el?._cyreg?.cy.nodes().map((n) => n.id()) ?? [];
    }, selector),
    /** Brings a node into view and returns its position on the page. */
    point: (id: string) => page.evaluate(({ sel, id }) => {
      const el = document.querySelector(sel) as unknown as ({ _cyreg?: { cy: Core } } & Element) | null;
      const cy = el?._cyreg?.cy;
      const node = cy?.getElementById(id);
      if (!el || !cy || !node?.nonempty()) return undefined;
      cy.center(node);
      const box = el.getBoundingClientRect();
      const p = node.renderedPosition();
      return { x: box.left + p.x, y: box.top + p.y };
    }, { sel: selector, id }),
  };
}

async function readingPosition(page: Page) {
  const books = await (await page.request.get('/api/books')).json() as { slug: string; currentSection: string }[];
  return books.find((b) => b.slug === 'divine-comedy')?.currentSection;
}

test.beforeEach(async ({ request }) => {
  const res = await request.put(`/api/books/divine-comedy/progress`, { data: { currentSection: 'inf-01' } });
  expect(res.ok()).toBe(true);
});

test('the strip moves on arrow keys, and the position survives a reload', async ({ page }) => {
  await page.goto(BOOK);
  const strip = page.getByRole('slider', { name: 'Reading position' });
  await expect(strip).toHaveAttribute('aria-valuetext', 'Inferno, Canto I');
  await strip.focus();
  await page.keyboard.press('ArrowRight');
  await expect(strip).toHaveAttribute('aria-valuetext', 'Inferno, Canto II');
  await expect.poll(() => readingPosition(page)).toBe('inf-02');
  await page.reload();
  await expect(page.getByRole('slider', { name: 'Reading position' })).toHaveAttribute('aria-valuetext', 'Inferno, Canto II');
});

test('a figure ahead of the reader is never in the DOM or on the map', async ({ page }) => {
  await page.goto(BOOK);
  const map = cyOf(page, '.map .cy');
  await expect.poll(() => map.ids()).toContain('virgil');
  expect(await map.ids()).not.toContain('francesca-da-rimini');
  expect(await page.content()).not.toMatch(/Francesca/);
  // The strip's tooltip is rendered one canto at a time, so read it on every hover: ahead, it gives counts, never names.
  const tip = page.locator('.strip-tip');
  const tips: string[] = [];
  for (const cell of await page.locator('.strip .cell').all()) {
    await cell.hover({ force: true });
    tips.push(await tip.innerText());
  }
  expect(tips).toContain('Inferno, Canto V · 5 new, ahead');
  expect(tips.join('\n')).not.toMatch(/Francesca/);
});

test('"Show everything" reveals what is ahead without moving the reading position', async ({ page }) => {
  await page.goto(BOOK);
  const map = cyOf(page, '.map .cy');
  await expect.poll(() => map.ids()).toContain('virgil');
  await page.getByLabel('Show everything').check();
  await expect.poll(() => map.ids()).toContain('francesca-da-rimini');
  expect(await readingPosition(page)).toBe('inf-01');
  await page.getByLabel('Show everything').uncheck();
  await expect.poll(() => map.ids()).not.toContain('francesca-da-rimini');
});

test('search marks matches, and Enter selects the first', async ({ page }) => {
  await page.goto(BOOK);
  const search = page.getByRole('searchbox', { name: 'Search this book' });
  await search.fill('virg');
  await expect(page.locator('.search-hits')).toHaveText('1 match');
  await search.press('Enter');
  await expect(page).toHaveURL(/[?&]e=virgil\b/);
  await expect(page.getByRole('complementary', { name: 'Chosen on the map' }).getByRole('heading', { name: 'Virgil' })).toBeVisible();
});

test('the legend filter hides a kind', async ({ page }) => {
  await page.goto(BOOK);
  const map = cyOf(page, '.map .cy');
  await expect.poll(() => map.ids()).toContain('mantua');
  const places = page.getByRole('button', { name: 'Places' });
  await places.click();
  await expect(places).toHaveAttribute('aria-pressed', 'false');
  await expect.poll(() => map.ids()).not.toContain('mantua');
  expect(await map.ids()).toContain('virgil');
});

test('a node click fills the rail, and a double-click opens the page', async ({ page }) => {
  await page.goto(BOOK);
  const map = cyOf(page, '.map .cy');
  await expect.poll(() => map.ids()).toContain('virgil');
  const p = await map.point('virgil');
  if (!p) throw new Error('virgil is not on the map');
  await page.mouse.click(p.x, p.y);
  const card = page.getByRole('complementary', { name: 'Chosen on the map' });
  await expect(card.getByRole('heading', { name: 'Virgil' })).toBeVisible();
  await expect(page).toHaveURL(/[?&]e=virgil\b/);
  await card.getByRole('link', { name: 'Open Virgil' }).click();
  await expect(page).toHaveURL(`${BOOK}/e/virgil`);
  await expect(page.getByRole('heading', { level: 1, name: 'Virgil' })).toBeVisible();

  await page.goto(BOOK);
  await expect.poll(() => map.ids()).toContain('dante-alighieri');
  const d = await map.point('dante-alighieri');
  if (!d) throw new Error('Dante is not on the map');
  await page.mouse.dblclick(d.x, d.y);
  await expect(page).toHaveURL(`${BOOK}/e/dante-alighieri`);
});

test('an entity page for a figure not met yet does not name it', async ({ page }) => {
  await page.goto(`${BOOK}/e/francesca-da-rimini`);
  await expect(page.getByRole('heading', { level: 1, name: 'Not met yet' })).toBeVisible();
  expect(await page.content()).not.toMatch(/Francesca/);
});

test('the lightbox works from the keyboard', async ({ page }) => {
  await page.goto(`${BOOK}/e/three-beasts`);
  const frames = page.locator('.look .frame');
  await expect(frames.first()).toBeVisible();
  const count = await frames.count();
  expect(count).toBeGreaterThan(1);
  await frames.first().focus();
  await page.keyboard.press('Enter');
  const dialog = page.locator('dialog.lightbox');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Close' })).toBeFocused();
  await expect(dialog).toContainText(`1 of ${count}`);
  await page.keyboard.press('ArrowRight');
  await expect(dialog).toContainText(`2 of ${count}`);
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(dialog).toContainText(`${count} of ${count}`);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(frames.first()).toBeFocused();
});

test('videos load nothing from YouTube until the reader presses play', async ({ page }) => {
  const youtube: string[] = [];
  page.on('request', (r) => { if (/youtube|ytimg|googlevideo/.test(new URL(r.url()).host)) youtube.push(r.url()); });
  await page.goto(`${BOOK}/e/dante-alighieri`);
  const play = page.getByRole('button', { name: /^Play / }).first();
  await expect(play).toBeVisible();
  await page.waitForLoadState('networkidle');
  expect(youtube).toEqual([]);
  await play.click();
  await expect(page.locator('.screen iframe').first()).toHaveAttribute('src', /^https:\/\/www\.youtube-nocookie\.com\/embed\//);
});
