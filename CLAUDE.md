# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

hblake — a minimal static blog platform. Posts are markdown files in the `posts/` directory. React + TypeScript frontend built with Vite, deployed as a static site.

## Commands

```bash
npm run dev              # Start dev server (Vite)
npm run build            # TypeScript check + Vite production build
npm run lint             # ESLint (flat config)
npm run preview          # Preview production build
npm run test:e2e         # Playwright e2e tests (Chromium)
npm run test:e2e:ui      # Playwright with interactive UI
npm run test:e2e:headed  # Playwright with visible browser
npx playwright test e2e/feed.spec.ts            # Run a single e2e test file
npx playwright test --grep "test name"          # Run tests matching a pattern
```

## Architecture

**Stack**: React 19, Vite 7, TypeScript (strict), Tailwind CSS 4 (OKLch theme), Playwright

**Path alias**: `@/` maps to `./src/` — always use this instead of relative imports.

**Blog data flow**:
- Markdown posts live in `posts/` with YAML frontmatter (title, date, description, optional image)
- `src/lib/posts.ts` loads all posts at build time via `import.meta.glob`, parses frontmatter, and exports `getAllPosts()` and `getPostBySlug(slug)`
- Posts are sorted by date descending
- Markdown is rendered to HTML using `marked`

**Routing**: Two routes defined in `src/App.tsx`:
- `/` → FeedPage (list of all posts)
- `/posts/:slug` → PostPage (single post)

**Component structure**:
- `src/components/ui/` — reusable primitives (Button with CVA variants, Card)
- `src/components/blog/` — Feed and BlogPost components
- `src/components/layout/` — Layout wrapper and Header
- `src/pages/` — route-level page components (FeedPage, PostPage)

**Adding a post**: Create a new `.md` file in `posts/` with frontmatter. The filename becomes the URL slug.

**Deployment**: Pushes to `main` trigger a GitHub Action that runs `git pull` on the `space-needle` server at `/opt/hblake`.

**E2E tests**: Playwright tests in `e2e/` with custom fixtures in `e2e/fixtures.ts`.

## TypeScript

- Strict mode enabled, no unused locals/parameters allowed
- Blog types in `src/types/index.ts`: `Post`
- Separate tsconfig files: `tsconfig.app.json` (app code), `tsconfig.node.json` (build tools), `tsconfig.e2e.json` (tests)

## Conventions

- File naming: kebab-case for files, PascalCase for component exports
- ESLint enforces react-hooks rules and react-refresh compatibility
- e2e/ directory is excluded from ESLint
