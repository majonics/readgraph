// The data model of the library. This file is the source of truth; docs/DATA_MODEL.md explains it.
// Change both in the same commit, then run `npm run validate`.
import { z } from 'zod';

export const Id = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'ids are kebab-case: lowercase letters, digits and single hyphens');

export const LanguageCode = z.string().regex(/^[a-z]{2,3}$/, 'an ISO 639 language code such as "en" or "uk"');

/** Text in one or more languages: { "en": "...", "uk": "..." }. */
export const LocalizedText = z
  .record(LanguageCode, z.string().min(1))
  .refine((m) => Object.keys(m).length > 0, 'needs at least one language');

const HttpsUrl = z.url({ protocol: /^https$/, error: 'must be an https URL' });
const IsoDate = z.iso.date();

export const MediaKind = z.enum(['artwork', 'image', 'video', 'lecture', 'podcast', 'article', 'book', 'map', 'audio', 'website']);

export const Embed = z.object({
  type: z.enum(['youtube', 'vimeo', 'spotify', 'apple-podcasts', 'image', 'iframe']),
  id: z.string().min(1),
});

export const MediaItem = z
  .object({
    kind: MediaKind,
    title: z.string().min(1),
    creator: z.string().min(1).optional(),
    year: z.string().min(1).optional(),
    publisher: z.string().min(1),
    url: HttpsUrl,
    embed: Embed.optional(),
    imageUrl: HttpsUrl.optional(),
    thumbUrl: HttpsUrl.optional(),
    license: z.string().min(1).optional(),
    attribution: z.string().min(1).optional(),
    durationMin: z.number().int().positive().optional(),
    language: LanguageCode,
    tier: z.union([z.literal(1), z.literal(2)]),
    why: z.string().min(1),
    /** Book-specific media only: hidden until the reader reaches this section. */
    section: Id.optional(),
    verifiedAt: IsoDate,
  })
  .strict()
  .refine((m) => !m.imageUrl || (m.license && m.attribution), {
    message: 'an image shown inline needs a license and an attribution',
    path: ['license'],
  });

export const EntityType = z.enum(['person', 'figure', 'place', 'work', 'concept', 'group', 'event', 'era']);

export const Entity = z
  .object({
    id: Id,
    type: EntityType,
    name: LocalizedText,
    wikidataId: z.string().regex(/^Q\d+$/).optional(),
    dates: z.object({ start: z.string().optional(), end: z.string().optional(), label: z.string().min(1) }).strict().optional(),
    location: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }).strict().optional(),
    image: MediaItem.optional(),
    /** Book-independent and plot-free: it is shown at every reading position. */
    summary: LocalizedText,
    facts: z.record(LanguageCode, z.array(z.string().min(1))).optional(),
    media: z.array(MediaItem).default([]),
    links: z.object({ wikipedia: z.record(LanguageCode, HttpsUrl).optional() }).strict().optional(),
  })
  .strict();

export const Section = z.object({ id: Id, label: z.string().min(1), group: z.string().min(1).optional() }).strict();

export const Book = z
  .object({
    slug: Id,
    title: z.string().min(1),
    originalTitle: z.string().min(1).optional(),
    author: Id,
    wikidataId: z.string().regex(/^Q\d+$/).optional(),
    year: z.object({ label: z.string().min(1) }).strict(),
    language: LanguageCode,
    edition: z.string().min(1).optional(),
    cover: MediaItem.optional(),
    about: z.string().min(1),
    sections: z.array(Section).min(1),
    media: z.array(MediaItem).default([]),
    generatedAt: IsoDate,
    generator: z.object({ skill: z.string().min(1), version: z.number().int().positive() }).strict(),
  })
  .strict();

export const InBookNote = z.object({ section: Id, text: z.string().min(1) }).strict();

export const BookNode = z
  .object({
    entity: Id,
    depth: z.literal(1),
    importance: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    role: z.string().min(1),
    firstSection: Id,
    inBook: z.array(InBookNote).default([]),
    media: z.array(MediaItem).default([]),
  })
  .strict();

export const ContextNode = z
  .object({
    entity: Id,
    depth: z.literal(2),
    /** The depth-1 node(s) this context belongs to. Context nodes are leaves: they never get neighbours of their own. */
    via: z.array(Id).min(1),
    why: z.string().min(1),
  })
  .strict();

export const GraphNode = z.discriminatedUnion('depth', [BookNode, ContextNode]);

export const Edge = z
  .object({
    source: Id,
    target: Id,
    type: Id,
    label: z.string().min(1),
    section: Id.optional(),
  })
  .strict();

export const Graph = z.object({ nodes: z.array(GraphNode), edges: z.array(Edge) }).strict();

export const Progress = z.object({ currentSection: Id, updatedAt: z.iso.datetime() }).strict();

export type MediaItem = z.infer<typeof MediaItem>;
export type Entity = z.infer<typeof Entity>;
export type EntityType = z.infer<typeof EntityType>;
export type Section = z.infer<typeof Section>;
export type Book = z.infer<typeof Book>;
export type BookNode = z.infer<typeof BookNode>;
export type ContextNode = z.infer<typeof ContextNode>;
export type GraphNode = z.infer<typeof GraphNode>;
export type Edge = z.infer<typeof Edge>;
export type Graph = z.infer<typeof Graph>;
export type Progress = z.infer<typeof Progress>;

/** Everything the app needs for one book, resolved from its files. */
export const BookBundle = z
  .object({
    book: Book,
    graph: Graph,
    progress: Progress,
    entities: z.record(Id, Entity),
  })
  .strict();
export type BookBundle = z.infer<typeof BookBundle>;
