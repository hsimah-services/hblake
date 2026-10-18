import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { REPO_ROOT } from '../../lib/env.ts';

// Client structure (architecture.md § Frontend, AGENTS.md). The route catalogue groups
// routes by entity; each entrypoint owns the query for its routes, and links are built
// from the generated URI builders rather than hand-written paths.

const SKIP = new Set(['node_modules', '__generated__', 'dist']);

function sourceFiles(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) sourceFiles(file, found);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      found.push(file);
    }
  }
  return found;
}

function generatedArtifacts(dir: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') generatedArtifacts(file, found);
    } else if (path.basename(dir) === '__generated__' && entry.name.endsWith('.graphql.ts')) {
      found.push(file);
    }
  }
  return found;
}

function catalogue(): { file: string; entryPoints: string[] } {
  const file = path.join(REPO_ROOT, 'client/routes.json');
  const routes = JSON.parse(fs.readFileSync(file, 'utf8')).routes as { entryPoint: string }[];
  return { file, entryPoints: [...new Set(routes.map(route => route.entryPoint))] };
}

const CLIENT_SRC = path.join(REPO_ROOT, 'client/src');
const relative = (file: string): string => path.relative(REPO_ROOT, file);

test('each entrypoint preloads a query of its own, defined in its own directory', () => {
  const { file, entryPoints } = catalogue();
  const owners = new Map<string, string>();
  const problems: string[] = [];
  for (const entry of entryPoints) {
    const module = path.join(path.dirname(file), entry);
    const name = path.basename(module).replace(/\.entrypoint\.tsx?$/, '');
    const source = fs.readFileSync(module, 'utf8');
    const queries = [...source.matchAll(/from\s+['"]([^'"]*__generated__\/(\w+)\.graphql)['"]/g)];
    for (const [, specifier, operation] of queries) {
      const artifact = path.resolve(path.dirname(module), specifier);
      if (path.dirname(path.dirname(artifact)) !== path.dirname(module)) {
        problems.push(`${relative(module)} preloads ${operation}, which lives outside its directory`);
      }
      if (!operation.startsWith(name)) {
        problems.push(`${relative(module)} preloads ${operation}; its query should be named ${name}…Query`);
      }
      const owner = owners.get(operation);
      if (owner && owner !== module) problems.push(`${relative(module)} and ${relative(owner)} both preload ${operation}`);
      owners.set(operation, module);
    }
  }
  expect(problems, 'one query per entrypoint, fetching only what its routes need').toEqual([]);
});

test('links and redirects use the generated URI builders, not hand-written route paths', () => {
  const literal = /(['"`])\/(admin|pages|posts|news|products)\b[^'"`]*\1?/g;
  const found = sourceFiles(CLIENT_SRC).flatMap(file =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, index) => [...line.matchAll(literal)].map(match => `${relative(file)}:${index + 1} ${match[0]}`)),
  );
  expect(found, 'route paths outside src/routes/__generated__').toEqual([]);
});

test('every Relay artifact belongs to an operation or fragment defined beside it', () => {
  const sources = new Map<string, string>();
  const definedIn = (dir: string): string => {
    if (!sources.has(dir)) {
      const text = fs
        .readdirSync(dir)
        .filter(name => /\.(ts|tsx)$/.test(name))
        .map(name => fs.readFileSync(path.join(dir, name), 'utf8'))
        .join('\n');
      sources.set(dir, text);
    }
    return sources.get(dir)!;
  };
  const stale = generatedArtifacts(CLIENT_SRC).filter(artifact => {
    const name = path.basename(artifact, '.graphql.ts');
    const owner = path.dirname(path.dirname(artifact));
    return !new RegExp(`\\b(query|mutation|subscription|fragment)\\s+${name}\\b`).test(definedIn(owner));
  });
  expect(stale.map(relative), 'stale relay-compiler output').toEqual([]);
});

test('the client contains no business copy the owner has not supplied', () => {
  // website.md and AGENTS.md: business name, positioning and claims come from the owner.
  const files = [...sourceFiles(CLIENT_SRC), path.join(REPO_ROOT, 'client/index.html')];
  const found = files.flatMap(file =>
    fs
      .readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, index) => (/consult/i.test(line) ? [`${relative(file)}:${index + 1} ${line.trim().slice(0, 120)}`] : [])),
  );
  expect(found, 'invented business descriptions').toEqual([]);
});
