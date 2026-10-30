---
sidebar_position: 1
title: Getting Started
slug: /
---

# Getting Started

Comty is a **pnpm workspace monorepo** that bundles the whole platform: the real-time backend, the web client, the desktop and mobile clients, and the optional media SFU server.

This guide covers the requirements and how to prepare the development environment. From here you can jump to the specific part you want to run.

## Repository layout

| Path                 | Description                                          |
| :------------------- | :--------------------------------------------------- |
| `packages/server`    | Backend. Linebridge microservices run by the gateway |
| `packages/app`       | Web app (React + Vite)                               |
| `packages/desktop`   | Electron desktop client                              |
| `packages/native`    | Mobile client                                        |
| `packages/sfu-node`  | Optional SFU (mediasoup) for voice/video             |
| `packages/shared`    | Shared types, classes and utils                      |
| `modules/linebridge` | Linebridge framework (git submodule)                 |
| `docs`               | Documentation sources (Docusaurus)                   |
| `docker`             | Production compose stack                             |

## Requirements

> We strongly recommend **Linux or macOS**. On Windows use [WSL2](https://learn.microsoft.com/en-us/windows/wsl/). Alpine (musl) based systems are not supported, the backend links against **glibc**.

| Requirement | Version | Notes |
| :-- | :-- | :-- |
| Node.js | >= 24 | Required by Linebridge and the SFU |
| pnpm | >= 11 | Required package manager (npm and yarn are not supported) |
| Python | >= 3.10 | Native module builds (`node-gyp`) |
| C/C++ toolchain | - | `build-essential` on Debian/Ubuntu, Xcode CLT on macOS |
| FFmpeg / FFprobe | >= 6 | Server media processing |
| Ultragateway | latest | Gateway binary, auto-installed the first time you run it |
| Docker | optional | Data infrastructure and production deployment |

## Enabling pnpm

Comty requires **pnpm**. Node ships [corepack](https://nodejs.org/api/corepack.html), so the easiest way is:

```shell
corepack enable
corepack prepare pnpm@11.3.0 --activate
```

Or install it from the [official instructions](https://pnpm.io/installation). The version is pinned through the `packageManager` field in the root `package.json`, so corepack will pick it automatically.

Verify the install:

```shell
pnpm -v
```

## Getting the files

```shell
git clone --recurse-submodules https://github.com/ragestudio/comty && cd comty
```

If you already cloned without submodules:

```shell
git submodule update --init --recursive
```

## Installing dependencies

```shell
pnpm install
```

This installs every workspace package. Do not use `npm install`.

## External binaries

The backend relies on a gateway binary and FFmpeg. On Linux you can install them system wide:

```shell
sudo bash packages/server/scripts/externalDeps.sh
```

Or individually:

```shell
sudo bash packages/server/scripts/installUltragateway.sh
sudo bash packages/server/scripts/installFfmpeg.sh
```

The gateway is also downloaded on demand the first time you start it through the Linebridge CLI.

## Next steps

- [Configuration](./configuration) — where configuration lives and secret management
- [Environment variables](./environment) — full variable reference
- [Service Core](./core) — gateway and data infrastructure
- [Backend](./backend) — services, environment and first setup
- [Web App](./web-app) — frontend
- [SFU Server](./sfu-server) — optional voice/video media server
- [Deployment](./deployment) — production
