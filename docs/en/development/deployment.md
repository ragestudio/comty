---
sidebar_position: 8
---

# Deployment

Production runs on Docker images and a blue-green stack. The backend image is built from the gateway base image so it ships Node.js, the gateway and FFmpeg in a single artifact.

## Images

| Image | Dockerfile | Notes |
| :-- | :-- | :-- |
| `ragestudio/comty-server` | `packages/server/Dockerfile` | Backend on `ragestudio/ultragateway` (Node + gateway) |
| `ragestudio/comty-sfu-node` | `packages/sfu-node/Dockerfile` | SFU on `node:24-trixie-slim` |

Both use pnpm (through corepack) to install dependencies, prune dev packages and run as the non-root `node` user. Always use glibc based images, never Alpine.

## Compose stack

`docker/compose.yml` brings up the whole stack: Dragonfly (Redis), ScyllaDB, MongoDB, NATS, HAProxy, the SFU and the two backend slots (`server-blue` / `server-green`, both behind compose profiles).

Create `docker/.env` with the backend environment (same variables as `packages/server/.env-example`) and, optionally, a `docker/compose.override.yml` for local tweaks.

```shell
docker compose -f docker/compose.yml up -d
```

## Blue-green deploy

`scripts/deploy.sh` automates zero-downtime deploys:

```shell
./scripts/deploy.sh deploy     # build + start the inactive slot, healthcheck, switch HAProxy, drain the old one
./scripts/deploy.sh rollback   # switch back to the previous slot
./scripts/deploy.sh status     # show which slot is active and its health
./scripts/deploy.sh infra      # only ensure the infrastructure is up
./scripts/deploy.sh stop       # stop the active slot
./scripts/deploy.sh stop-all   # stop everything
```

The active slot is tracked in `docker/.bluegreen_state`. The script waits on `http://localhost:9000/health` before switching traffic, and drains the old slot with a `SIGTERM`.

## Web app

The release workflow builds `packages/app` and publishes `dist.zip` as a release asset. Serve the static `dist/` behind your web server or CDN and point it at the gateway API.

## Releases

Pushing a `rel-*` tag triggers `.github/workflows/release.yml`, which:

1. Compares the current `packages/app` and `packages/server` versions with the latest release.
2. Builds the web app and/or the backend image only when their version changed.
3. Creates a GitHub Release with `versions.json` and the app bundle.
