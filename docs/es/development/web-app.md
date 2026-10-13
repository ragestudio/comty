---
sidebar_position: 6
---

# Aplicación web

La aplicación web vive en `packages/app` y está construida con React y Vite. Se comunica con el backend a través del gateway.

## Requisitos

- Node.js >= 24 y pnpm (ver [Primeros pasos](./getting-started)).
- Un backend en marcha para que la app tenga una API con la que hablar (ver [Backend](./backend)).

## Configuración

Opcional, Vite solo expone las variables con el prefijo `VITE_`. Crea `packages/app/.env` si las necesitas:

| Variable                 | Descripción                              |
| :----------------------- | :--------------------------------------- |
| `VITE_SENTRY_DSN`        | DSN de Sentry para el reporte de errores |
| `VITE_TURNSTILE_SITEKEY` | Site key de Cloudflare Turnstile         |

## Ejecución

```shell
pnpm --filter @comty/app dev
```

El servidor de desarrollo escucha en `http://localhost:8000` y hace proxy de `/api/*` hacia el gateway en `http://localhost:9000` (ver `packages/app/vite/server.config.ts`).

Para arrancar el backend y la aplicación web a la vez:

```shell
pnpm run dev
```

## Compilación

```shell
pnpm --filter @comty/app build   # genera packages/app/dist
pnpm --filter @comty/app preview
```

El directorio `dist/` de producción es un bundle estático que puede servirse desde cualquier servidor web o CDN.
