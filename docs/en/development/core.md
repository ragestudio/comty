---
sidebar_position: 4
---

# Service Core

The **core** of Comty is the gateway process (`ultragateway`) plus the shared data infrastructure. The gateway serves HTTP/WebSocket traffic and orchestrates every backend microservice: it spawns, watches and restarts them.

## How it works

- `packages/server/gateway.config.json` defines the gateway: `mode`, HTTP port (`9000`), IPC socket, Redis connection, custom routes and plugins/scripts.
- At boot, the gateway scans `packages/server/services/**/*.service.{js,ts}` and starts each service with the Linebridge bootloader.
- Services register their HTTP routes and WebSocket events with the gateway over a unix socket (IPC) and use NATS for cross-service and real-time messaging.
- In `mode: "dev"` the gateway watches service files and hot-reloads them on change.

## Data infrastructure

The backend needs the following services:

| Service | Default port | Used for |
| :-- | :-- | :-- |
| MongoDB | 27017 | Main documents (users, posts, files, ...) |
| ScyllaDB | 9042 | Chats/spaces messages (`scylla-odm`) |
| Redis / Dragonfly | 6379 | Cache, queues and gateway state |
| NATS (JetStream) | 4222 | Inter-service messaging and the SFU registry |
| S3 (SeaweedFS) | 8333 | File/object storage |

NATS is embedded by the gateway (data stored in `packages/server/nats-data`) unless an external server is configured. Redis is configured through `gateway.config.json`.

### Running the infrastructure with Docker

A ready-to-use development stack lives in `docker-dev/compose.yml`. It starts MongoDB, ScyllaDB, Redis (Dragonfly), NATS and SeaweedFS (S3-compatible storage) with their ports published on localhost:

```shell
docker compose -f docker-dev/compose.yml up -d
```

To also run the optional SFU node (Spaces voice/video):

```shell
docker compose -f docker-dev/compose.yml --profile sfu up -d
```

Stop it with `docker compose -f docker-dev/compose.yml down` (add `-v` to also remove the data volumes).

> ScyllaDB is memory hungry. The dev stack runs ScyllaDB with reduced resources (`--smp 1 --memory 1G`); tune the `scylla` command in the compose file if you want to give it more.

If you want the gateway and services (and the SFU) to share the stack's NATS instead of the embedded one, set `NATS_URL=nats://localhost:4222`.

## Gateway binary

The gateway binary (`ultragateway`) is required to run the backend. The `linebridge gateway` command will offer to install it automatically if it is missing. To install it system wide ahead of time:

```shell
sudo bash packages/server/scripts/installUltragateway.sh
```

Next, continue with the [Backend](./backend) guide to configure the environment, run the first setup and start the gateway together with the services.
