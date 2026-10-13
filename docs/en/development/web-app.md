---
sidebar_position: 6
---

# Web App

The web app lives in `packages/app` and is built with React and Vite. It talks to the backend through the gateway.

## Requirements

- Node.js >= 24 and pnpm (see [Getting Started](./getting-started)).
- A running backend so the app has an API to talk to (see [Backend](./backend)).

## Configuration

Optional, Vite only exposes variables prefixed with `VITE_`. Create `packages/app/.env` if you need them:

| Variable                 | Description                    |
| :----------------------- | :----------------------------- |
| `VITE_SENTRY_DSN`        | Sentry DSN for error reporting |
| `VITE_TURNSTILE_SITEKEY` | Cloudflare Turnstile site key  |

## Running

```shell
pnpm --filter @comty/app dev
```

The dev server listens on `http://localhost:8000` and proxies `/api/*` to the gateway at `http://localhost:9000` (see `packages/app/vite/server.config.ts`).

To start the backend and the web app together:

```shell
pnpm run dev
```

## Build

```shell
pnpm --filter @comty/app build   # outputs to packages/app/dist
pnpm --filter @comty/app preview
```

The production `dist/` directory is a static bundle that can be served by any web server or CDN.
