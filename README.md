# S3mTV

A personal live sports streaming app built with **Nuxt 4**, **Nuxt UI**, and **Tailwind CSS**. It lists live matches from the [Streamed](https://streamed.pk/docs) API and lets you stream them in a player.

## Features

- Live match grid with sport tabs and team search, plus a **Today** tab with scheduled matches
- Auto-refresh every 60s (3 min on Today), LIVE / Popular badges, viewer counts
- **Favorites**: star teams (from any match page) and individual matches; filter the live grid to just your teams
- **Multi-view**: pin up to 4 matches into a single 1-col or 2×2 grid with a stream picker
- **Go-live notifications**: tap the bell to get a push notification when a favorite team or starred match starts; favorite-team picks sync to the server automatically (iOS requires installing the PWA — see below)
- Match player with two engines (per-session toggle, persisted in localStorage):
  - **Embed** (default) — renders the provider's `embedUrl` in an iframe
  - **HLS (experimental)** — attempts to resolve a direct `.m3u8` and plays it with `hls.js`; falls back to the embed if unavailable
- Dark / light mode toggle
- All upstream API traffic is proxied through Nitro (`/api/**`), so the `streamed.pk` origin is never exposed to the client

## Setup

```bash
pnpm install
cp .env.example .env        # add VAPID keys (see below)
pnpm dev
```

Generate VAPID keys and put them in `.env`:

```bash
npx web-push generate-vapid-keys
```

The public key goes into both `NUXT_PUBLIC_PUSH_PUBLIC_KEY` and `NUXT_PUSH_VAPID_PUBLIC`.

## How the proxy works

`nuxt.config.ts` proxies every `/api/**` request to `https://streamed.pk/api/**`:

```ts
routeRules: {
  '/api/**': { proxy: 'https://streamed.pk/api/**' }
}
```

Match listings, stream endpoints, and team badge/posters all go through it. The experimental HLS resolver lives at `/hls/{source}/{id}/{streamNo}` (server route, kept outside `/api` to avoid conflicting with the proxy rule). The notification endpoints live at `/push/*` for the same reason.

## Notifications & deployment (Netlify)

The push system is designed for a static-Netlify deploy with a serverless Nitro function:

1. **Deploy to Netlify** with `NITRO_PRESET=netlify` (set in `netlify.toml`). The build outputs the server to `.netlify/functions-internal` and static assets to `dist/`; the function's config routes all non-static paths to the Nitro server (`/push/*` included).
2. **Set site env vars** (same as `.env.example`, plus `NUXT_PUSH_TICK_SECRET`).
3. **Trigger the go-live check** with both:
   - a Netlify scheduled function (`netlify/functions/notify-cron.mjs`, `*/5 * * * *`) that self-calls `/push/tick`, and
   - an external cron (e.g. cron-job.org) POSTing to `https://YOURSITE.netlify.app/push/tick` every 5 minutes with header `x-tick-secret: <NUXT_PUSH_TICK_SECRET>`. Scheduled functions have no public URL and free plans may throttle their cadence, so the external cron is the reliable trigger.

The check compares each subscriber's favorites against the current live list and pushes a `"{match} is LIVE"` notification for matches that newly went live. Push only works while the browser is running and, on iOS/Safari, only after adding the app to your Home Screen (Share → *Add to Home Screen*) — then open the installed app. If push is unsupported, the bell falls back to in-app polling notifications.

Storage for subscriptions is kept in a private Netlify Blob store (`sv-notifications`); locally it falls back to `.data/notifications`.

## Notes

- Stream sources are read from `match.sources` at runtime — never hardcoded. Real-world sources are `admin`, `delta`, `echo`, and `golf` (the docs list others that don't appear in live data).
- Some sources return an empty stream list (`echo` often does). The player page handles this with an empty state and a refresh action.
- The embed player is a third-party service and injects ads. This is a free-stream tradeoff; the experimental HLS engine is the path toward an ad-free player.
