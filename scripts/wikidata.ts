// npm run wikidata -- search "Virgil"          candidates with ids and descriptions
// npm run wikidata -- get Q1398 [Q1067 ...]     dates, coordinates, P18 image, Wikipedia link, as JSON
// Add --lang it for another language.
import { wikidataGet, wikidataSearch } from '../src/server/wiki.ts';

const args = process.argv.slice(2);
const langAt = args.indexOf('--lang');
const lang = langAt >= 0 ? (args.splice(langAt, 2)[1] ?? 'en') : 'en';
const [cmd, ...rest] = args;

if (cmd === 'search' && rest.length) {
  for (const r of await wikidataSearch(rest.join(' '), lang)) console.log(`${r.id}\t${r.label ?? ''} — ${r.description ?? ''}`);
} else if (cmd === 'get' && rest.length) {
  console.log(JSON.stringify(await wikidataGet(rest, lang), null, 2));
} else {
  console.error('usage: npm run wikidata -- search "<name>" | get <Q-id> [<Q-id> ...] [--lang xx]');
  process.exit(2);
}
