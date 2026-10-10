import { readFileSync, writeFileSync } from 'node:fs';
import { buildSchema, lexicographicSortSchema, printSchema } from 'graphql';

// Normalize SDL formatting and type order before the gate diffs the snapshots.
for (const [source, target] of [
  ['../.cache/server-schema.graphql', '../.cache/server-schema.normalized.graphql'],
  ['schema.graphql', '../.cache/client-schema.normalized.graphql'],
]) {
  writeFileSync(target, printSchema(lexicographicSortSchema(buildSchema(readFileSync(source, 'utf8')))) + '\n');
}
