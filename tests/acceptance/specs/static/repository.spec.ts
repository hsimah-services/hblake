import fs from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';
import YAML from 'yaml';

import { REPO_ROOT } from '../../lib/env.ts';

// Repository-level checks that need no running server. The build gates themselves
// (eleph fmt/validate/generate --check/check, PHPStan, tsquid routes:check, lint,
// typecheck, build) run through scripts/acceptance/gates; see tests/README.md.

const SKIP = new Set(['node_modules', '.git', 'vendor', 'test-results', 'playwright-report', 'dist', 'spec', 'tests']);

function findFiles(dir: string, name: string, found: string[] = []): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIP.has(entry.name)) findFiles(path.join(dir, entry.name), name, found);
    } else if (entry.name === name) {
      found.push(path.join(dir, entry.name));
    }
  }
  return found;
}

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function appRouteCatalogues(): string[] {
  return findFiles(REPO_ROOT, 'routes.json').filter(file => readJson(file)?.runtime === '@tsquid/routes');
}

test('the client routes.json is the specified route catalogue', () => {
  const catalogues = appRouteCatalogues();
  expect(catalogues, 'exactly one Tsquid routes.json outside spec/').toHaveLength(1);
  expect(readJson(catalogues[0])).toEqual(readJson(path.join(REPO_ROOT, 'spec/ui/routes.json')));
});

test('every route entrypoint exists beside the client routes.json', () => {
  const [catalogue] = appRouteCatalogues();
  expect(catalogue, 'a Tsquid routes.json exists').toBeTruthy();
  const missing = (readJson(catalogue).routes as { entryPoint: string }[])
    .map(route => route.entryPoint)
    .filter((entry, index, all) => all.indexOf(entry) === index)
    .filter(entry => !fs.existsSync(path.join(path.dirname(catalogue), entry)));
  expect(missing, 'entrypoint modules named in routes.json').toEqual([]);
});

test('eleph.json declares the PHP, SQLite and GraphQL targets over spec/', () => {
  const file = path.join(REPO_ROOT, 'eleph.json');
  expect(fs.existsSync(file), 'eleph.json at the repository root').toBe(true);
  const config = readJson(file);
  expect(config.spec).toBe('spec');
  for (const target of ['php', 'sqlite', 'graphql-php']) {
    expect(config.targets?.[target]?.builder, `targets.${target}.builder`).toBeTruthy();
    expect(config.targets?.[target]?.output, `targets.${target}.output`).toBeTruthy();
  }
});

test('the generated tree is committed for every entity and target', () => {
  const config = readJson(path.join(REPO_ROOT, 'eleph.json'));
  const php = path.join(REPO_ROOT, config.targets.php.output);
  const expected = [
    ...['Page', 'Post', 'Product', 'User'].map(entity => path.join(php, entity, `${entity}.php`)),
    path.join(php, 'Catalogue.php'),
    path.join(REPO_ROOT, config.targets.sqlite.output, 'install.php'),
    path.join(REPO_ROOT, config.targets.sqlite.output, 'storage-manifest.php'),
    path.join(REPO_ROOT, config.targets['graphql-php'].output, 'graphql-manifest.php'),
  ];
  expect(expected.filter(file => !fs.existsSync(file)).map(file => path.relative(REPO_ROOT, file))).toEqual([]);
});

test('User is not exposed through the generated GraphQL manifest', () => {
  const user = YAML.parse(fs.readFileSync(path.join(REPO_ROOT, 'spec/entities/User.yml'), 'utf8'));
  expect(user.integrations, 'spec/entities/User.yml declares no integrations').toBeUndefined();

  const config = readJson(path.join(REPO_ROOT, 'eleph.json'));
  const manifest = fs.readFileSync(path.join(REPO_ROOT, config.targets['graphql-php'].output, 'graphql-manifest.php'), 'utf8');
  expect(manifest).not.toMatch(/new RootFieldEntry\([^)]*'User'\s*\)/);
  expect(manifest).not.toMatch(/'(create|update|delete)User'/);
});

test('the temporary provides snapshot is removed once real builders exist', () => {
  for (const file of ['spec/provides.json', 'spec/provides.md']) {
    expect(fs.existsSync(path.join(REPO_ROOT, file)), `${file} removed (AGENTS.md)`).toBe(false);
  }
});

test('README documents how to build, run and test the site', () => {
  const readme = fs.readFileSync(path.join(REPO_ROOT, 'README.md'), 'utf8');
  expect(readme.trim().length, 'README.md has build/run instructions').toBeGreaterThan(200);
  expect(readme).toContain('tests/run.sh');
});

test('the acceptance harness scripts exist and are executable', () => {
  const missing = ['gates', 'up', 'down', 'bootstrap', 'install', 'backup', 'restore', 'expire-sessions', 'set-active'].filter(name => {
    const file = path.join(REPO_ROOT, 'scripts/acceptance', name);
    try {
      fs.accessSync(file, fs.constants.X_OK);
      return false;
    } catch {
      return true;
    }
  });
  expect(missing, 'scripts/acceptance/* (tests/README.md)').toEqual([]);
});
