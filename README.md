# hblake

A minimal static blog built on [markr](https://github.com/hsimah-services/markr). Posts are markdown files in the `posts/` directory — the filename becomes the URL slug.

## Getting Started

```bash
npm install
npm run build
```

## Adding a Post

Create a `.md` file in `posts/` with YAML frontmatter:

```markdown
---
title: My Post Title
date: 2026-03-16
description: A short summary
---

Your markdown content here.
```

## Scripts

| Command | Description |
|---|---|
| `npm run build` | Generate static HTML into `dist/` |
| `npm run preview` | Preview the static output locally |

## Stack

- [markr](https://github.com/hsimah-services/markr) — static site generator (prerender + serve)

## License

[MIT](LICENSE)
