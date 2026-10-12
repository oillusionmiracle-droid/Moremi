# Moremi Maker Club

A colourful React game that teaches children to build little apps through play. Includes personalized onboarding, Blob’s snack shop, Mushroom’s fruit stall, Cloud Sheep’s picnic, saved creations, remixes, music and offline play.

## Develop

Use Node 22 or newer and pnpm 11.25.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

## Deploy

Vercel builds with `pnpm build` and serves `dist/client`. The connected GitHub repository’s `main` branch is the production source. Pushes to main deploy automatically; other branches receive previews.

```sh
pnpm exec tsc --noEmit --incremental false
node --import ./tests/tsx-loader.mjs --test tests/domain.test.mjs tests/stall.test.mjs tests/weather.test.mjs tests/music.test.mjs tests/play.test.mjs tests/ui.test.mjs
pnpm build
node --import ./tests/tsx-loader.mjs --test tests/offline.test.mjs
```

Progress is stored in the child’s browser. To transfer progress between the ChatGPT Site domain and Vercel, use the grown-ups backup/export and restore controls.
