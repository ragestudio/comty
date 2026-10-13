---
sidebar_position: 7
---

# SFU Server

The SFU server lives in `packages/sfu-node`. It is a [mediasoup](https://mediasoup.org/) based Selective Forwarding Unit that powers Spaces voice and video channels. It is **optional**: only needed if you want real-time audio/video.

## Requirements

- Node.js >= 24 and pnpm.
- A reachable NATS server. The service exits if `NATS_ADDRESS` is not set.
- Build tools and Python to compile the mediasoup native module.
- A public IP reachable by clients. The node resolves its own public IP via DNS (`o-o.myaddr.l.google.com`) and announces it to clients.

## Configuration

The server reads a single variable:

| Variable       | Description                                |
| :------------- | :----------------------------------------- |
| `NATS_ADDRESS` | NATS address, e.g. `nats://localhost:4222` |

## Running

```shell
cd packages/sfu-node
pnpm run build
NATS_ADDRESS=nats://localhost:4222 pnpm start
```

Once online the node registers itself in the `sfu_nodes` NATS KV bucket and listens for control messages on `sfu:control` and `sfu:ipc:<node_id>`.

## Networking

The media transports listen on **port 40001 over both TCP and UDP**. Open this port for inbound traffic in your firewall/router and make sure the announced public IP is reachable from clients.

## Docker

A ready to use image is available in `packages/sfu-node/Dockerfile` and is wired into `docker/compose.yml`, where it receives `NATS_ADDRESS=nats:4222`.
