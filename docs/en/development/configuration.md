---
sidebar_position: 2
---

# Configuration

Comty reads its configuration from a few sources, depending on the component. This page explains where configuration lives and how to manage secrets. The full list of variables is in [Environment variables](./environment).

## Configuration sources

| Component                     | Source                                          |
| :---------------------------- | :---------------------------------------------- |
| Backend (gateway + services)  | `.env` in `packages/server`, loaded by the gateway |
| Gateway                       | `packages/server/gateway.config.json`           |
| Web app                       | Vite variables with the `VITE_` prefix (`packages/app/.env`) |
| SFU server                    | Process environment (`NATS_ADDRESS`)            |

Create the backend environment file from the example:

```shell
cp packages/server/.env-example packages/server/.env
```

## Managing secrets with Infisical

Comty officially uses [Infisical](https://infisical.com) to manage secrets and environment variables. Both the gateway (Go) and the services (Node, through the Linebridge bootloader) can fetch secrets from an Infisical project at boot and inject them into the process environment.

Set these variables (in the shell or in the deployment environment):

```shell
INFISICAL_CLIENT_ID="..."
INFISICAL_CLIENT_SECRET="..."
INFISICAL_PROJECT_ID="..."
INFISICAL_PATH="/"        # optional, defaults to "/"
```

How it works:

- The gateway loads the secrets of the environment matching its `mode` (`dev` / `prod`) and forwards them to the services it spawns.
- The Linebridge bootloader (`InfisicalLib.LoadFromEnv()`) injects each secret into `process.env` only if it is not already defined, so real environment variables always take precedence.
- The gateway removes the `INFISICAL_*` variables after loading so they are not exposed to the services.
- `JWT_SECRET`, `ECDSA_PRIVATE_KEY_B64` and `ECDSA_PUBLIC_KEY_B64` coming from Infisical override the gateway config values.

> We recommend Infisical (or a similar secrets manager) for any non-local environment, instead of committing `.env` files or sharing secrets by hand.

### Local `.env` fallback

For local development a plain `.env` file is enough. The bootloader loads it with `dotenv` before anything else, and the file is git-ignored.

## Gateway configuration

The gateway is configured through `packages/server/gateway.config.json`:

| Key                    | Description                                              |
| :--------------------- | :------------------------------------------------------- |
| `mode`                 | `dev` (file watching and hot reload) or `prod`           |
| `http.port`            | HTTP port (default `9000`)                               |
| `http.secure_port`     | HTTPS port                                               |
| `http.certificates`    | `cert` and `key` file paths for TLS                      |
| `ipc.path`             | Unix socket used by the gateway to talk to the services  |
| `services.bootloader`  | Optional path to the Linebridge bootloader               |
| `jwt`                  | Token signing keys and claims used by the gateway        |
| `redis`                | `enabled` and `url` of the Redis/Dragonfly used by the gateway |
| `scripts`              | Extra scripts loaded at boot (for example `lbuw-plugins/wsauth.js`) |
| `routes`               | Extra proxy routes                                       |
| `control_api`          | Enables the gateway control API                          |
| `otel`                 | OpenTelemetry export settings                            |
