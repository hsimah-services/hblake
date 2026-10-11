import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// routes.manifest.json (and the server's inlined route queries) resolve operation text
// from persisted_queries.json, so it must hold exactly the operations Relay generated.
const artifacts = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(entry =>
  entry.isDirectory() ? artifacts(join(dir, entry.name))
    : dir.endsWith('__generated__') && entry.name.endsWith('.graphql.ts') ? [join(dir, entry.name)] : []);
const generated = new Set(artifacts('src').flatMap(file => [...readFileSync(file, 'utf8').matchAll(/"id": "([0-9a-f]{32})"/g)].map(match => match[1])));
const persisted = new Set(Object.keys(JSON.parse(readFileSync('persisted_queries.json', 'utf8'))));
const missing = [...generated].filter(id => !persisted.has(id));
const stale = [...persisted].filter(id => !generated.has(id));
if (missing.length || stale.length) {
  console.error(`persisted_queries.json is out of date (missing ${missing.length}, stale ${stale.length}); run pnpm relay.`);
  process.exit(1);
}
console.log(`persisted_queries.json matches ${generated.size} Relay operations.`);
