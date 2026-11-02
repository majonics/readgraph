# Sources: what counts as top-tier

The tool's promise is that every node links to *material worth the reader's evening*. This list guides
curation. It is not a whitelist, but anything outside it must be clearly as good.

## Tiers

- **Tier 1, definitive:** major universities, museums, national broadcasters, peer-reviewed reference works,
  leading scholars speaking about their field.
- **Tier 2, very good:** reputable popular education (well-researched channels, quality magazines),
  well-made documentaries, recognised critics.
- **No tier 3.** Content farms, SEO listicles, AI-generated summaries, unsourced fan wikis, clickbait
  thumbnails and reaction videos are never included.

## Preferred sources by kind

| Kind | Go-to sources |
|---|---|
| Reference articles | Stanford Encyclopedia of Philosophy, Internet Encyclopedia of Philosophy, Britannica, Treccani (Italian), Oxford/Cambridge companions (as `book`), Wikipedia only as a `links` entry, not as media |
| Lectures | Yale Open Courses (e.g. Mazzotta's *Dante in Translation*), MIT OCW, Gresham College, Oxford & Cambridge podcasts, Collège de France |
| Podcasts | BBC *In Our Time*, *History of Philosophy without any gaps*, *The Rest Is History*, LRB podcasts, *Entitled Opinions* (Stanford) |
| Video | Gresham College, university channels, museum channels (The National Gallery, The Met), well-researched channels such as *Crash Course Literature* (tier 2) |
| Artworks and images | Wikimedia Commons (public domain and CC), The Met Open Access, Art Institute of Chicago API, Rijksmuseum, Europeana, the British Library, the Morgan Library |
| Maps | Wikimedia Commons historical maps, David Rumsey Map Collection |
| Texts and audio | Project Gutenberg, Internet Archive, LibriVox (public-domain audiobooks), Princeton Dante Project-style scholarly editions |
| Book metadata and covers | Open Library, Wikidata |

## Rules

1. **Verify everything.** Fetch every URL during generation. If you can't verify it, drop it.
2. **Variety beats volume.** Mix kinds per entity: an image, something to watch or listen to, something to read.
3. **Say why.** Each item's `why` is one specific sentence about what the reader will get from it.
4. **Respect licenses.** Images are displayed inline only if they are public domain or openly licensed. Store
   `license` and `attribution` and show the attribution in the UI. Copyrighted images are linked, not embedded.
   Nothing copyrighted is downloaded into the repo.
5. **Embed where the platform allows it** (YouTube via `youtube-nocookie.com`, Spotify, Apple Podcasts, Vimeo).
   Otherwise show a rich card with the title, publisher, duration and `why`.
6. **Language:** prefer sources in the book's content language, but a tier-1 English source beats a
   tier-2 source in the reader's language. Mark `language` on every item.
7. **Spoilers:** book-specific media that covers later parts of the story must carry a `section` tag.
