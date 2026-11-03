---
sidebar_position: 8
---

# Despliegue

En producción se usan imágenes de Docker y un stack blue-green. La imagen del backend se construye a partir de la imagen base del gateway, de modo que incluye Node.js, el gateway y FFmpeg en un solo artefacto.

## Imágenes

| Imagen | Dockerfile | Notas |
| :-- | :-- | :-- |
| `ragestudio/comty-server` | `packages/server/Dockerfile` | Backend sobre `ragestudio/ultragateway` (Node + gateway) |
| `ragestudio/comty-sfu-node` | `packages/sfu-node/Dockerfile` | SFU sobre `node:24-trixie-slim` |

Ambas usan pnpm (a través de corepack) para instalar dependencias, podar los paquetes de desarrollo y ejecutarse como el usuario no root `node`. Usa siempre imágenes basadas en glibc, nunca Alpine.

## Stack de compose

`docker/compose.yml` levanta todo el stack: Dragonfly (Redis), ScyllaDB, MongoDB, NATS, HAProxy, el SFU y las dos ranuras del backend (`server-blue` / `server-green`, ambas tras perfiles de compose).

Crea `docker/.env` con el entorno del backend (las mismas variables que `packages/server/.env-example`) y, opcionalmente, un `docker/compose.override.yml` para ajustes locales.

```shell
docker compose -f docker/compose.yml up -d
```

## Despliegue blue-green

`scripts/deploy.sh` automatiza despliegues sin downtime:

```shell
./scripts/deploy.sh deploy     # construye y arranca la ranura inactiva, healthcheck, cambia HAProxy y drena la antigua
./scripts/deploy.sh rollback   # vuelve a la ranura anterior
./scripts/deploy.sh status     # muestra qué ranura está activa y su estado
./scripts/deploy.sh infra      # solo asegura que la infraestructura está levantada
./scripts/deploy.sh stop       # detiene la ranura activa
./scripts/deploy.sh stop-all   # detiene todo
```

La ranura activa se guarda en `docker/.bluegreen_state`. El script espera a `http://localhost:9000/health` antes de cambiar el tráfico y drena la ranura antigua con un `SIGTERM`.

## Aplicación web

El workflow de release compila `packages/app` y publica `dist.zip` como asset de la release. Sirve el `dist/` estático desde tu servidor web o CDN apuntándolo a la API del gateway.

## Aplicación nativa

`.github/workflows/native-android.yml` genera el proyecto Android con `expo prebuild`, compila el APK de release y lo publica como `spaces-android.apk`. También se ejecuta en cada push a `master` que toque la app nativa o sus dependencias del workspace.

## Releases

Hacer push de un tag `rel-*` dispara `.github/workflows/release.yml`, que:

1. Compara las versiones actuales de `packages/app`, `packages/server` y `packages/native` con la última release.
2. Llama a `app.yml`, `server.yml` y `native-android.yml` solo cuando la versión de cada componente cambió.
3. Crea una release de GitHub con `versions.json`, el bundle web y el APK de Android.
