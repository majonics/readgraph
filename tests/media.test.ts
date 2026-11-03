import { describe, expect, it } from 'vitest';
import { embedSrc } from '../src/lib/media.ts';

describe('embedSrc', () => {
  it('plays YouTube from the privacy-enhanced domain', () => {
    expect(embedSrc({ embed: { type: 'youtube', id: '5z2umV9UvIw' } })).toBe('https://www.youtube-nocookie.com/embed/5z2umV9UvIw?autoplay=1&rel=0');
  });

  it('plays Vimeo with do-not-track', () => {
    expect(embedSrc({ embed: { type: 'vimeo', id: '123' } })).toBe('https://player.vimeo.com/video/123?autoplay=1&dnt=1');
  });

  it('escapes the id, so it cannot change the path', () => {
    expect(embedSrc({ embed: { type: 'youtube', id: '../x?y' } })).toBe('https://www.youtube-nocookie.com/embed/..%2Fx%3Fy?autoplay=1&rel=0');
  });

  it('leaves everything else to a link card', () => {
    expect(embedSrc({})).toBeUndefined();
    expect(embedSrc({ embed: { type: 'spotify', id: 'episode/1' } })).toBeUndefined();
    expect(embedSrc({ embed: { type: 'iframe', id: 'https://example.org/' } })).toBeUndefined();
  });
});
