// Every URL in a library JSON document, with where it sits, for scripts/check-links.ts.
export interface FoundLink {
  url: string;
  path: string;
}

export function collectLinks(doc: unknown, path = ''): FoundLink[] {
  if (typeof doc === 'string') return /^https?:\/\//.test(doc) ? [{ url: doc, path }] : [];
  if (Array.isArray(doc)) return doc.flatMap((v, i) => collectLinks(v, `${path}[${i}]`));
  if (doc && typeof doc === 'object') {
    return Object.entries(doc).flatMap(([k, v]) => collectLinks(v, path ? `${path}.${k}` : k));
  }
  return [];
}

export type LinkStatus = 'ok' | 'blocked' | 'dead';

/** 401/403/429 usually mean a bot wall, not a dead page: report them apart so a person can check by hand. */
export function classify(status: number | 'error'): LinkStatus {
  if (status === 'error') return 'dead';
  if (status >= 200 && status < 400) return 'ok';
  if (status === 401 || status === 403 || status === 429) return 'blocked';
  return 'dead';
}
