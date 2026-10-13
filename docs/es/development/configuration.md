---
sidebar_position: 2
---

# Configuración

Comty lee su configuración de varias fuentes según el componente. Esta página explica dónde vive la configuración y cómo gestionar los secretos. La lista completa de variables está en [Variables de entorno](./environment).

## Fuentes de configuración

| Componente                    | Fuente                                          |
| :---------------------------- | :---------------------------------------------- |
| Backend (gateway + servicios) | `.env` en `packages/server`, cargado por el gateway |
| Gateway                       | `packages/server/gateway.config.json`           |
| Aplicación web                | Variables de Vite con el prefijo `VITE_` (`packages/app/.env`) |
| Servidor SFU                  | Entorno del proceso (`NATS_ADDRESS`)            |

Crea el archivo de entorno del backend a partir del ejemplo:

```shell
cp packages/server/.env-example packages/server/.env
```

## Gestionar secretos con Infisical

Comty usa oficialmente [Infisical](https://infisical.com) para gestionar secretos y variables de entorno. Tanto el gateway (Go) como los servicios (Node, a través del bootloader de Linebridge) pueden obtener los secretos de un proyecto de Infisical al arrancar e inyectarlos en el entorno del proceso.

Define estas variables (en la shell o en el entorno de despliegue):

```shell
INFISICAL_CLIENT_ID="..."
INFISICAL_CLIENT_SECRET="..."
INFISICAL_PROJECT_ID="..."
INFISICAL_PATH="/"        # opcional, por defecto "/"
```

Cómo funciona:

- El gateway carga los secretos del entorno que coincide con su `mode` (`dev` / `prod`) y los pasa a los servicios que arranca.
- El bootloader de Linebridge (`InfisicalLib.LoadFromEnv()`) inyecta cada secreto en `process.env` solo si no está ya definido, por lo que las variables reales del entorno siempre tienen prioridad.
- El gateway elimina las variables `INFISICAL_*` tras la carga para no exponerlas a los servicios.
- `JWT_SECRET`, `ECDSA_PRIVATE_KEY_B64` y `ECDSA_PUBLIC_KEY_B64` provenientes de Infisical sobrescriben los valores del config del gateway.

> Recomendamos Infisical (o un gestor de secretos similar) para cualquier entorno que no sea local, en lugar de commitear archivos `.env` o compartir secretos a mano.

### Alternativa local: `.env`

Para desarrollo local basta con un archivo `.env`. El bootloader lo carga con `dotenv` antes que nada y el archivo está ignorado por git.

## Configuración del gateway

El gateway se configura mediante `packages/server/gateway.config.json`:

| Clave                 | Descripción                                              |
| :-------------------- | :------------------------------------------------------- |
| `mode`                | `dev` (vigilancia de archivos y recarga en caliente) o `prod` |
| `http.port`           | Puerto HTTP (por defecto `9000`)                         |
| `http.secure_port`    | Puerto HTTPS                                             |
| `http.certificates`   | Rutas `cert` y `key` para TLS                            |
| `ipc.path`            | Socket unix que usa el gateway para hablar con los servicios |
| `services.bootloader` | Ruta opcional al bootloader de Linebridge                |
| `jwt`                 | Claves y claims de firma de tokens usados por el gateway |
| `redis`               | `enabled` y `url` del Redis/Dragonfly usado por el gateway |
| `scripts`             | Scripts extra cargados al arrancar (por ejemplo `lbuw-plugins/wsauth.js`) |
| `routes`              | Rutas de proxy extra                                     |
| `control_api`         | Habilita la API de control del gateway                   |
| `otel`                | Ajustes de exportación de OpenTelemetry                  |
