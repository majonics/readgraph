import { describe, expect, it } from 'vitest';
import { commonsFileName, formatTime, parseCommonsImageInfo, parseWikidataEntity, stripHtml } from '../src/server/wiki.ts';
import { classify, collectLinks } from '../src/lib/links.ts';

describe('Wikidata parsing', () => {
  it('formats times by precision, BC included', () => {
    expect(formatTime({ time: '-0070-10-15T00:00:00Z', precision: 11 })).toBe('-0070-10-15');
    expect(formatTime({ time: '+1265-00-00T00:00:00Z', precision: 9 })).toBe('1265');
    expect(formatTime({ time: '+1308-00-00T00:00:00Z', precision: 8 })).toBe('1300s');
  });

  it('summarises an item', () => {
    const t = (time: string) => [{ mainsnak: { datavalue: { value: { time, precision: 11 } } } }];
    const s = parseWikidataEntity({
      id: 'Q1398',
      labels: { en: { value: 'Virgil' } },
      claims: {
        P569: t('-0070-10-15T00:00:00Z'), P570: t('-0019-09-21T00:00:00Z'),
        P18: [{ mainsnak: { datavalue: { value: 'Virgil.jpg' } } }],
        P31: [{ mainsnak: { datavalue: { value: { id: 'Q5' } } } }],
      },
      sitelinks: { enwiki: { title: 'Virgil (poet)' } },
    });
    expect(s).toMatchObject({ label: 'Virgil', instanceOf: ['Q5'], image: 'Virgil.jpg', dates: { label: '70–19 BC' },
      wikipedia: 'https://en.wikipedia.org/wiki/Virgil_(poet)' });
  });

  it('labels AD lifespans plainly', () => {
    const y = (time: string) => [{ mainsnak: { datavalue: { value: { time, precision: 9 } } } }];
    expect(parseWikidataEntity({ id: 'Q1', claims: { P569: y('+1265-00-00T00:00:00Z'), P570: y('+1321-00-00T00:00:00Z') } }).dates?.label).toBe('1265–1321');
  });
});

describe('Commons parsing', () => {
  it('accepts every way of naming a file', () => {
    const want = 'Gustave Doré - Paolo and Francesca da Rimini.jpg';
    expect(commonsFileName('File:Gustave_Doré_-_Paolo_and_Francesca_da_Rimini.jpg')).toBe(want);
    expect(commonsFileName('https://commons.wikimedia.org/wiki/File:Gustave_Dor%C3%A9_-_Paolo_and_Francesca_da_Rimini.jpg')).toBe(want);
    expect(commonsFileName('https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Gustave_Dor%C3%A9_-_Paolo_and_Francesca_da_Rimini.jpg/1280px-x.jpg')).toBe(want);
  });

  it('strips HTML and tracking parameters, and judges the license', () => {
    const info = parseCommonsImageInfo({
      title: 'File:A.jpg',
      imageinfo: [{ url: 'https://upload.wikimedia.org/a.jpg?utm_source=x', width: 10, height: 10, descriptionurl: 'https://commons.wikimedia.org/wiki/File:A.jpg',
        extmetadata: { Artist: { value: '<bdi><a href="#">Sandro&nbsp;Botticelli</a></bdi>' }, LicenseShortName: { value: 'Public domain' } } }],
    });
    expect(info).toMatchObject({ imageUrl: 'https://upload.wikimedia.org/a.jpg', creator: 'Sandro Botticelli', openlyLicensed: true });
    expect(stripHtml('<p>a &amp; b</p>')).toBe('a & b');
  });

  it('flags non-open licenses and missing files', () => {
    const page = (license: string) => ({ title: 'File:B.jpg', imageinfo: [{ url: 'https://u/b.jpg', width: 1, height: 1, descriptionurl: 'https://c/B', extmetadata: { LicenseShortName: { value: license } } }] });
    expect(parseCommonsImageInfo(page('CC BY-SA 4.0')).openlyLicensed).toBe(true);
    expect(parseCommonsImageInfo(page('Fair use')).openlyLicensed).toBe(false);
    expect(() => parseCommonsImageInfo({ title: 'File:C.jpg', missing: true })).toThrow(/no file/);
  });
});

describe('links', () => {
  it('collects URLs with their paths', () => {
    expect(collectLinks({ a: 'https://x.org', b: [{ url: 'https://y.org' }, 'plain'] })).toEqual([
      { url: 'https://x.org', path: 'a' }, { url: 'https://y.org', path: 'b[0].url' },
    ]);
  });
  it('separates bot walls from dead links', () => {
    expect([200, 301, 403, 429, 404, 500, 'error' as const].map(classify)).toEqual(['ok', 'ok', 'blocked', 'blocked', 'dead', 'dead', 'dead']);
  });
});
