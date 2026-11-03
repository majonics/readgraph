// npm run validate [-- <slug> ...]
// Checks every book (or the named ones) and the whole entity registry. Exits 1 on any issue.
import { listBooks, loadBook, loadEntities } from '../src/server/library.ts';
import type { Issue } from '../src/lib/rules.ts';

const requested = process.argv.slice(2);
const issues: Issue[] = [];
const entities = await loadEntities(undefined, issues);
const all = await listBooks();
const unknown = requested.filter((s) => !all.includes(s));
for (const s of unknown) issues.push({ file: `library/books/${s}`, path: '', message: 'no such book' });

const slugs = requested.length ? requested.filter((s) => all.includes(s)) : all;
let nodes = 0;
for (const slug of slugs) {
  const { bundle, issues: found } = await loadBook(slug, undefined, entities);
  issues.push(...found);
  if (bundle) {
    nodes += bundle.graph.nodes.length;
    const d1 = bundle.graph.nodes.filter((n) => n.depth === 1).length;
    console.log(`✓ ${slug}: ${d1} in the book, ${bundle.graph.nodes.length - d1} context, ${bundle.graph.edges.length} edges, ${bundle.book.sections.length} sections`);
  }
}

if (issues.length) {
  const byFile = Map.groupBy(issues, (i) => i.file);
  for (const [file, list] of byFile) {
    console.error(`\n✗ ${file}`);
    for (const i of list) console.error(`  ${i.path || '(file)'}: ${i.message}`);
  }
  console.error(`\n${issues.length} issue${issues.length === 1 ? '' : 's'}.`);
  process.exit(1);
}
console.log(`\nAll good: ${slugs.length} book${slugs.length === 1 ? '' : 's'}, ${entities.size} entities, ${nodes} graph nodes.`);
