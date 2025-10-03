# Automate The Stack — One‑Pager & Deployment

This repository hosts a static one‑pager that renders an ASCII animation from JSON frames.

- The live site is served via GitHub Pages.
- All data files needed by the page live in this repo (e.g., `public/frames-70-char.json`, fonts).

For the video‑to‑ASCII pipeline and all script documentation, see `scripts/README.md`.

## Local Preview (optional)

The site is pure static HTML. You can open `index.html` directly in a browser, or serve it locally.

```bash
# optional: tiny Bun dev server with hot reload
bun --hot scripts/server.local.js
# open http://localhost:3000
```

Note: the dev server is only for local convenience; do not deploy it.

## Deployment — GitHub Pages

This repo deploys automatically on pushes to `main` via GitHub Actions.

- Workflow file: `.github/workflows/pages.yml`
- It uploads the repository root as the Pages artifact and publishes it.
- No build step is required.

Setup steps (once per repo):
1. In GitHub repository settings → Pages, set Source to "GitHub Actions".
2. Push to `main`. The workflow publishes the site automatically.

## Files of Interest

- `index.html` — the one‑pager that loads `public/frames-70-char.json` and animates it
- `public/frames-70-char.json` — animation frames (JSON). A wider `frames-420-char.json` is also supported
- `public/departure.woff` — custom monospaced font used by the page
- `.github/workflows/pages.yml` — deployment workflow

## Generating/Updating Frames

If you need to regenerate the animation data or produce a video output, use the pipeline and scripts documented in `scripts/README.md`.

## License

Copyright 2025 Automate The Stack. All rights reserved.
