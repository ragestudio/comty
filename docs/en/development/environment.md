---
sidebar_position: 3
---

# Environment variables

Complete reference of the variables recognized by each component. Only a subset is required to boot, the rest enable specific features. See [Configuration](./configuration) for where these variables are loaded from.

## Gateway

| Variable | Description |
| :-- | :-- |
| `NODE_ENV` | `production` or `development` |
| `DEBUG` | Enables gateway debug logging |
| `NATS_URL` | External NATS address (e.g. `nats://localhost:4222`); if unset the gateway starts an embedded NATS |
| `JWT_SECRET` | Token signing secret used by the gateway |
| `LINEBRIDGE_PLUGINS` | Comma-separated list of Linebridge plugins to load |
| `LINEBRIDGE_PLUGINS_PATH` | Custom plugins directory |
| `LB_GATEWAY_SOCKET` | Gateway IPC socket path (set by the gateway for each service) |
| `LB_SOCKET_MODE` | Services listen on unix sockets instead of TCP (set by the gateway) |
| `GRACEFUL_SHUTDOWN_TIMEOUT` | Seconds to wait before a hard shutdown |
| `AUTO_SHUTDOWN_WHEN_IDLE` | Shut the instance down when no clients are connected |

### Infisical

| Variable                  | Description                  |
| :------------------------ | :--------------------------- |
| `INFISICAL_CLIENT_ID`     | Universal auth client id     |
| `INFISICAL_CLIENT_SECRET` | Universal auth client secret |
| `INFISICAL_PROJECT_ID`    | Target project               |
| `INFISICAL_PATH`          | Secrets path (default `/`)   |

## Backend services

### Auth

| Variable | Description |
| :-- | :-- |
| `JWT_SECRET` | Signing secret |
| `JWT_ALGORITHM` | JWT algorithm (default `ES256`) |
| `JWT_KID` | Key id advertised in the token header and JWKS |
| `JWT_EXPIRES_IN` | Access token lifetime (default `1h`) |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime (default `30d`) |
| `ECDSA_PRIVATE_KEY` / `ECDSA_PUBLIC_KEY` | PEM keys for signing (or `ECDSA_PRIVATE_KEY_B64` / `ECDSA_PUBLIC_KEY_B64` base64) |
| `MFA_ENCRYPTION_KEY` | MFA encryption key, at least 32 characters |
| `BCRYPT_ROUNDS` | bcrypt cost factor for passwords |
| `OIDC_ISSUER_URL` | Issuer URL used by the OIDC endpoints |
| `TURNSTILE_SECRET` / `TURNSTILE_SITEKEY` | Cloudflare Turnstile keys |

### Databases

MongoDB:

| Variable             | Description                |
| :------------------- | :------------------------- |
| `DB_HOSTNAME`        | Hostname                   |
| `DB_PORT`            | Port (default `27017`)     |
| `DB_NAME`            | Database name              |
| `DB_USER` / `DB_PWD` | Credentials                |
| `DB_DRIVER`          | Driver (default `mongodb`) |
| `DB_AUTH_SOURCE`     | Auth source database       |

ScyllaDB:

| Variable | Description |
| :-- | :-- |
| `SCYLLA_CONTACT_POINTS` | Comma-separated contact points (default `127.0.0.1`) |
| `SCYLLA_LOCAL_DATA_CENTER` | Local data center (default `datacenter1`) |
| `SCYLLA_KEYSPACE` | Keyspace (default `default_keyspace`) |

Redis:

| Variable                            | Description                    |
| :---------------------------------- | :----------------------------- |
| `REDIS_HOST`                        | Hostname (default `localhost`) |
| `REDIS_PORT`                        | Port (default `6379`)          |
| `REDIS_AUTH`                        | `user:password` string         |
| `REDIS_USERNAME` / `REDIS_PASSWORD` | Credentials                    |
| `REDIS_NO_AUTH`                     | Disable auth                   |
| `REDIS_DB`                          | Database index                 |

### Storage

Standard S3 (`S3_*`) and, optionally, Backblaze B2 (`B2_*`) or OVH (`OVH_S3_*`). The files service registers the additional providers when their credentials are present.

The `docker-dev` stack ships an S3-compatible endpoint (SeaweedFS) for local development. Point `S3_ENDPOINT=127.0.0.1`, `S3_PORT=8333`, `S3_USE_SSL=false`, `S3_REGION=us-east-1`, `S3_BUCKET=comty` and dummy credentials (`S3_ACCESS_KEY` / `S3_SECRET_KEY`) at it.

| Variable                                           | Description      |
| :------------------------------------------------- | :--------------- |
| `S3_ENDPOINT` / `S3_PORT` / `S3_USE_SSL`           | Connection       |
| `S3_REGION`                                        | Region           |
| `S3_BUCKET`                                        | Default bucket   |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY`                  | Credentials      |
| `B2_ENDPOINT` / `B2_CDN_ENDPOINT`                  | Endpoint and CDN |
| `B2_KEY_ID` / `B2_APP_KEY`                         | Credentials      |
| `B2_BUCKET` / `B2_BUCKET_ID` / `B2_KEY_NAME`       | Bucket info      |
| `OVH_S3_ENDPOINT` / `OVH_S3_CDN` / `OVH_S3_BUCKET` | Connection       |
| `OVH_S3_KEY_ID` / `OVH_S3_SECRET_KEY`              | Credentials      |

### Mail (EMS)

| Variable        | Description                     |
| :-------------- | :------------------------------ |
| `SMTP_HOSTNAME` | SMTP host                       |
| `SMTP_PORT`     | Port (default `587`)            |
| `SMTP_USERNAME` | User and default `from` address |
| `SMTP_PASSWORD` | Password                        |
| `SMTP_SECURE`   | Use TLS                         |

### RTC

| Variable | Description |
| :-- | :-- |
| `MEDIASOUP_ANNOUNCED_IP` | Public IP announced by mediasoup |
| `TURN_SERVER_URL` / `TURN_SERVER_TCP_URL` | TURN URLs (UDP / TCP) |
| `TURN_SERVER_USERNAME` / `TURN_SERVER_PASSWORD` | TURN credentials |

## SFU server

| Variable       | Description                                 |
| :------------- | :------------------------------------------ |
| `NATS_ADDRESS` | NATS address the SFU connects to (required) |

## Integrations

| Variable           | Description                                          |
| :----------------- | :--------------------------------------------------- |
| `APP_URL`          | Public URL of the web app, used to build share links |
| `GITHUB_REPO`      | `owner/repo` used by the repo endpoints              |
| `NFC_TAG_ENDPOINT` | Base endpoint for NFC tags                           |
| `KLIPY_TOKEN`      | Klipy API token                                      |

## Web app

| Variable                 | Description                   |
| :----------------------- | :---------------------------- |
| `VITE_SENTRY_DSN`        | Sentry DSN (production)       |
| `VITE_TURNSTILE_SITEKEY` | Cloudflare Turnstile site key |
