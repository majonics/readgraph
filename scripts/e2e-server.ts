// The server for the browser tests (playwright.config.ts): the production build, served by `vite preview`, against a
// throwaway copy of library/, so the tests can move the reading position without touching the owner's.
import { spawn } from 'node:child_process';
import { cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PORT = process.env.E2E_PORT ?? '4174';
const root = join(import.meta.dirname, '..');
// One fixed folder, cleared at every start: Playwright may stop this process before its exit handlers run.
const copy = join(tmpdir(), 'readgraph-e2e-library');
await rm(copy, { recursive: true, force: true });
await cp(join(root, 'library'), copy, { recursive: true });
console.log(`library copied to ${copy}`);

const server = spawn('npx', ['vite', 'preview', '--port', PORT, '--strictPort'], {
  cwd: root, stdio: 'inherit', env: { ...process.env, READGRAPH_LIBRARY: copy },
});
const stop = async () => {
  server.kill();
  await rm(copy, { recursive: true, force: true });
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
server.on('exit', (code) => { void rm(copy, { recursive: true, force: true }).then(() => process.exit(code ?? 0)); });
