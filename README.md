# ducndc.github.io

Personal blog of Chung Duc Nguyen Dang (Wi-Fi, EasyMesh, embedded Linux, photography, poetry), built with [Astro](https://astro.build) and deployed to GitHub Pages.

## Stack

- Astro 5 content collections (Markdown posts in `src/content/blog/`)
- KaTeX (`remark-math` + `rehype-katex`) for math
- Mermaid for diagrams, loaded lazily only on posts that contain them
- `@astrojs/sitemap` and `@astrojs/rss`

## Layout

```text
public/            static files (favicon, prplMesh Doxygen docs, diagrams)
src/assets/        images referenced by posts (optimized by astro:assets)
src/components/    Header, Footer, BaseHead, ...
src/content/blog/  posts; frontmatter schema in src/content.config.ts
src/layouts/       BlogPost.astro (TOC, scroll spy, mermaid)
src/pages/         index, about, blog list/detail, rss.xml
src/utils.ts       shared helpers (slugify)
```

## Writing a post

Add `src/content/blog/<name>.md` with:

```yaml
---
title: ''
description: ''
pubDate: 'Jan 01 2026'
category: 'Wi-Fi'            # defaults to "Others"
heroImage: '../../assets/x.jpg'  # optional
---
```

## Commands

Requires Node >= 22.12.

| Command           | Action                                  |
| :---------------- | :-------------------------------------- |
| `npm ci`          | Install dependencies                    |
| `npm run dev`     | Dev server at `localhost:4321`          |
| `npm run build`   | Build to `./dist/` (git-ignored)        |
| `npm run preview` | Preview the production build            |

Pushing to `main` triggers `.github/workflows/astro.yml`, which builds and deploys.
