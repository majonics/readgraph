// Wikidata and Wikimedia Commons, for the generation helper scripts (docs/GENERATION.md > Helper scripts).
// The parsers are pure and tested; `getJson` is the only part that touches the network.

export const USER_AGENT = 'readgraph/0.1 (https://github.com/majonics/readgraph)';

/** GET JSON with the project User-Agent, backing off on 429/5xx (Wikidata rate-limits bursts). */
export async function getJson(url: string, tries = 5): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (res.ok) return res.json();
    if (attempt + 1 >= tries || (res.status !== 429 && res.status < 500)) throw new Error(`${res.status} ${res.statusText} for ${url}`);
    const wait = Number(res.headers.get('retry-after')) * 1000 || 1500 * 2 ** attempt;
    await new Promise((r) => setTimeout(r, wait));
  }
}

// ---------- Wikidata ----------

interface TimeValue { time: string; precision: number }
type Snak = { mainsnak?: { datavalue?: { value?: unknown } } };
type Claims = Record<string, Snak[] | undefined>;

export interface WikidataSummary {
  id: string;
  label?: string;
  description?: string;
  instanceOf: string[];
  dates?: { start?: string; end?: string; label: string };
  location?: { lat: number; lon: number };
  /** Commons file name of the item's image (P18), without the "File:" prefix. */
  image?: string;
  wikipedia?: string;
}

/** Wikidata time → the most precise ISO-ish string its precision allows ("-0070-10-15", "1265", "1300s"). */
export function formatTime({ time, precision }: TimeValue): string {
  const m = /^([+-])(\d+)-(\d\d)-(\d\d)/.exec(time);
  if (!m) return time;
  const [, sign, y = '', mo, d] = m;
  const year = `${sign === '-' ? '-' : ''}${y.replace(/^0+(?=\d{4})/, '').padStart(4, '0')}`;
  if (precision >= 11) return `${year}-${mo}-${d}`;
  if (precision === 10) return `${year}-${mo}`;
  if (precision === 9) return year;
  if (precision === 8) return `${year.replace(/\d$/, '0')}s`;
  return year;
}

/** "70 BC", "1265" — a human label for one end of a lifespan. */
export function yearLabel(iso: string): string {
  const bc = iso.startsWith('-');
  const year = String(Number(/^-?(\d+)/.exec(iso)?.[1] ?? NaN));
  if (year === 'NaN') return iso;
  return bc ? `${year} BC` : iso.endsWith('s') ? iso : year;
}

function first<T>(claims: Claims, prop: string): T | undefined {
  return claims[prop]?.[0]?.mainsnak?.datavalue?.value as T | undefined;
}

export function parseWikidataEntity(entity: {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  claims?: Claims;
  sitelinks?: Record<string, { title: string }>;
}, lang = 'en'): WikidataSummary {
  const claims = entity.claims ?? {};
  const born = first<TimeValue>(claims, 'P569') ?? first<TimeValue>(claims, 'P571') ?? first<TimeValue>(claims, 'P577');
  const died = first<TimeValue>(claims, 'P570') ?? first<TimeValue>(claims, 'P576');
  const start = born && formatTime(born);
  const end = died && formatTime(died);
  const bothBC = start?.startsWith('-') && end?.startsWith('-');
  const label = start && end
    ? `${bothBC ? yearLabel(start).replace(' BC', '') : yearLabel(start)}–${yearLabel(end)}`
    : start ? `from ${yearLabel(start)}` : end ? `died ${yearLabel(end)}` : undefined;
  const coord = first<{ latitude: number; longitude: number }>(claims, 'P625');
  const title = entity.sitelinks?.[`${lang}wiki`]?.title;
  return {
    id: entity.id,
    label: entity.labels?.[lang]?.value,
    description: entity.descriptions?.[lang]?.value,
    instanceOf: (claims.P31 ?? []).flatMap((s) => {
      const v = s.mainsnak?.datavalue?.value as { id?: string } | undefined;
      return v?.id ? [v.id] : [];
    }),
    ...(label ? { dates: { ...(start ? { start } : {}), ...(end ? { end } : {}), label } } : {}),
    ...(coord ? { location: { lat: round(coord.latitude), lon: round(coord.longitude) } } : {}),
    ...(first<string>(claims, 'P18') ? { image: first<string>(claims, 'P18') } : {}),
    ...(title ? { wikipedia: `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}` } : {}),
  };
}

const round = (n: number) => Math.round(n * 1e4) / 1e4;

export async function wikidataSearch(query: string, lang = 'en') {
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({ action: 'wbsearchentities', search: query, language: lang, limit: '7', format: 'json' })}`;
  const data = (await getJson(url)) as { search?: { id: string; label?: string; description?: string }[] };
  return (data.search ?? []).map(({ id, label, description }) => ({ id, label, description }));
}

export async function wikidataGet(ids: string[], lang = 'en'): Promise<WikidataSummary[]> {
  const url = `https://www.wikidata.org/w/api.php?${new URLSearchParams({
    action: 'wbgetentities', ids: ids.join('|'), props: 'labels|descriptions|claims|sitelinks',
    languages: lang, sitefilter: `${lang}wiki`, format: 'json',
  })}`;
  const data = (await getJson(url)) as { entities?: Record<string, Parameters<typeof parseWikidataEntity>[0] & { missing?: string }> };
  return ids.map((id) => {
    const e = data.entities?.[id];
    if (!e || 'missing' in e) throw new Error(`Wikidata has no item ${id}`);
    return parseWikidataEntity(e, lang);
  });
}

// ---------- Commons ----------

export interface CommonsImage {
  file: string;
  page: string;
  imageUrl: string;
  width: number;
  height: number;
  creator?: string;
  date?: string;
  title?: string;
  license?: string;
  openlyLicensed: boolean;
}

/** Commons metadata comes as HTML fragments; keep the text. */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Accepts "File:X.jpg", "X.jpg", a commons.wikimedia.org/wiki/File:… page URL or an upload.wikimedia.org URL. */
export function commonsFileName(input: string): string {
  let s = input.trim();
  const page = /commons\.wikimedia\.org\/wiki\/(?:File|Image):([^?#]+)/i.exec(s);
  if (page?.[1]) s = decodeURIComponent(page[1]);
  const upload = /upload\.wikimedia\.org\/wikipedia\/commons\/(?:thumb\/)?[0-9a-f]\/[0-9a-f]{2}\/([^/?#]+)/i.exec(s);
  if (upload?.[1]) s = decodeURIComponent(upload[1]);
  return s.replace(/^(File|Image):/i, '').replaceAll('_', ' ');
}

const OPEN = /^(public domain|pd\b|cc0|cc[ -]by(?:-sa)?\b|cc by|attribution|no restrictions)/i;

export function parseCommonsImageInfo(page: {
  title: string;
  missing?: boolean;
  imageinfo?: { url: string; thumburl?: string; width: number; height: number; descriptionurl: string; extmetadata?: Record<string, { value: string } | undefined> }[];
}): CommonsImage {
  const ii = page.imageinfo?.[0];
  if (page.missing || !ii) throw new Error(`Commons has no file "${page.title}"`);
  const meta = (k: string) => (ii.extmetadata?.[k]?.value ? stripHtml(ii.extmetadata[k].value) : undefined);
  const license = meta('LicenseShortName') ?? meta('UsageTerms');
  const clean = (u: string) => u.split('?')[0] ?? u;
  return {
    file: page.title.replace(/^File:/, ''),
    page: ii.descriptionurl,
    imageUrl: clean(ii.thumburl ?? ii.url),
    width: ii.width,
    height: ii.height,
    creator: meta('Artist'),
    date: meta('DateTimeOriginal'),
    title: meta('ObjectName'),
    license,
    openlyLicensed: !!license && OPEN.test(license),
  };
}

export async function commonsImage(input: string, width = 1280): Promise<CommonsImage> {
  const url = `https://commons.wikimedia.org/w/api.php?${new URLSearchParams({
    action: 'query', titles: `File:${commonsFileName(input)}`, prop: 'imageinfo',
    iiprop: 'url|size|extmetadata', iiurlwidth: String(width), format: 'json', formatversion: '2',
  })}`;
  const data = (await getJson(url)) as { query?: { pages?: Parameters<typeof parseCommonsImageInfo>[0][] } };
  const page = data.query?.pages?.[0];
  if (!page) throw new Error(`no answer from Commons for ${input}`);
  return parseCommonsImageInfo(page);
}
