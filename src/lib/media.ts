import type { BookNode, Entity, MediaItem } from '../schema/index.ts';

/** Commons serves only standard thumbnail widths; others return 400. */
export const THUMB_WIDTHS = [120, 250, 330, 500, 960, 1280, 1920] as const;
export type ThumbWidth = (typeof THUMB_WIDTHS)[number];

/**
 * A Wikimedia image URL at a standard width. Accepts originals (upload.wikimedia.org/…/a/ab/File.jpg) and
 * existing thumbnails (…/thumb/a/ab/File.jpg/1920px-File.jpg). Other hosts are returned unchanged.
 */
export function thumb(url: string, width: ThumbWidth): string {
  const t = /^(https:\/\/(?:upload|thumb)\.wikimedia\.org\/wikipedia\/commons\/thumb\/[0-9a-f]\/[0-9a-f]{2}\/[^/]+)\/\d+px-([^/?#]+)$/.exec(url);
  if (t) return `${t[1]}/${width}px-${t[2]}`;
  const o = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+)$/.exec(url);
  if (o) {
    const file = o[2] ?? '';
    // SVG and TIFF thumbnails are rendered to PNG by Commons.
    const suffix = /\.(svg|tiff?)$/i.test(file) ? '.png' : '';
    return `https://upload.wikimedia.org/wikipedia/commons/thumb/${o[1]}/${file}/${width}px-${file}${suffix}`;
  }
  return url;
}

/** The picture that stands for an entity: its own image, else the first visible picture on its node in this book. */
export function pictureOf(entity: Entity | undefined, node?: Pick<BookNode, 'media'>): MediaItem | undefined {
  if (entity?.image?.imageUrl) return entity.image;
  return node?.media.find((m) => m.imageUrl);
}

/**
 * The player URL for an embeddable item, or undefined when it should be a link card instead. YouTube plays from
 * youtube-nocookie.com and Vimeo with do-not-track (SOURCES.md). Both autoplay, because they load only on the reader's click.
 */
export function embedSrc(m: Pick<MediaItem, 'embed'>): string | undefined {
  const id = m.embed ? encodeURIComponent(m.embed.id) : '';
  switch (m.embed?.type) {
    case 'youtube': return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
    case 'vimeo': return `https://player.vimeo.com/video/${id}?autoplay=1&dnt=1`;
    default: return undefined;
  }
}

/** Where an embed plays from, for "plays from YouTube" on the poster. */
export const EMBED_HOST: Partial<Record<NonNullable<MediaItem['embed']>['type'], string>> = { youtube: 'YouTube', vimeo: 'Vimeo' };
