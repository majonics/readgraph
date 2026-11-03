// npm run commons -- "File:Gustave Doré - Paolo and Francesca da Rimini.jpg" [more files or URLs]
// Prints a MediaItem draft per file: real URLs, creator, date and license from Commons.
// `why` and `tier` are left for you to write; the schema rejects the draft until you do.
import { commonsImage } from '../src/server/wiki.ts';

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('usage: npm run commons -- "<File:… | Commons page URL | upload URL>" [...]');
  process.exit(2);
}
const today = new Date().toISOString().slice(0, 10);
for (const input of inputs) {
  try {
    const img = await commonsImage(input);
    const creator = img.creator ?? 'Unknown';
    const draft = {
      kind: 'artwork',
      title: img.title ?? img.file.replace(/\.[a-z]+$/i, ''),
      creator,
      ...(img.date ? { year: img.date } : {}),
      publisher: 'Wikimedia Commons',
      url: img.page,
      imageUrl: img.imageUrl,
      license: img.license ?? 'UNKNOWN: check the file page',
      attribution: `${creator}, ${img.license ?? 'license unknown'}, via Wikimedia Commons`,
      language: 'en',
      tier: null,
      why: '',
      verifiedAt: today,
    };
    if (!img.openlyLicensed) console.error(`! ${img.file}: license "${img.license ?? 'none'}" is not clearly open; link it, do not show it inline`);
    console.log(JSON.stringify(draft, null, 2));
  } catch (err) {
    console.error(`✗ ${input}: ${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
