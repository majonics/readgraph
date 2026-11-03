import type { EntityType, MediaItem } from '../schema/index.ts';

export const TYPE_LABEL: Record<EntityType, string> = {
  person: 'Person', figure: 'Figure of myth or legend', place: 'Place', work: 'Work',
  concept: 'Idea', group: 'Group', event: 'Event', era: 'Period',
};

export const KIND_NAME: Record<MediaItem['kind'], string> = {
  artwork: 'Artwork', image: 'Picture', video: 'Video', lecture: 'Lecture', podcast: 'Podcast',
  article: 'Article', book: 'Book', map: 'Map', audio: 'Recording', website: 'Website',
};

/** Tiers in words (SOURCES.md), shown inside a card's meta line rather than as a badge. */
export const TIER_NAME: Record<MediaItem['tier'], string> = { 1: 'Definitive', 2: 'Very good' };
