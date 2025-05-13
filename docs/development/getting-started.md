---
sidebar_position: 1
---
# Getting Started
We strongly recommend using Linux or macOS for development. Other platforms, such as Windows, can cause multiple issues.

Using Docker dev containers is also a nice choice.

## Dependencies
- Node.js (v18 or higher)
> Install [manually](https://nodejs.org/en/download/) or use [nvm](https://github.com/nvm-sh/nvm) tool (or similar tools).

- Python (3.10 or higher)

- [node-gyp](https://github.com/nodejs/node-gyp#installation) Install globally `npm install -g node-gyp`

- FFmpeg & FFprobe (^6.0 or higher)
> On Linux you can use built-in script to install it in your system-wide `packages/server/scripts/installLatestFfmpeg.sh` (uses CURL)

- (Recomended) Use [npm](https://docs.npmjs.com/cli/v11/configuring-npm/install) package manager.

- (Optional) [Docker](https://docs.docker.com/get-docker/), used for develop/building/deploy.

## Getting files
- Getting the repository
```shell
git clone --recurse-submodules https://github.com/ragestudio/comty && cd comty
```

- Installing all dependencies
```shell
npm install
```

## Setup Gateway
Comty uses a custom gateway to handle all requests and manage backend services. This gateway has two available engines for serving requests:
- `nginx`: Currently recommended.
- `http_proxy`: Obsolete, used in previous versions. Probably broken.

You can select an available engine by setting the `GATEWAY_MODE="<engine>"` environment variable. This can also be declared in the `.env` file.

By default, the gateway uses NGINX (as a proxy) to handle requests, so you'll need to set up this dependency.

It can be installed system-wide or by linking a static binary to `packages/server/nginx-bin`

> On Linux you can use built-in script to statically install
`packages/server/scripts/installNginxStatic.sh` (needs CURL)

## First Setup
This will execute some tasks to initialize for first time your resources, like S3, Databases...etc.
If you already initialized previously, skip this step.

- Run server setup script (if needed)
```shell
npm run setup:server
```

Also can you use the `--force` flag to force the execution of this tasks again.

### Starting the development server
- You can use the command `npm run dev` to start all development servers.
```shell
npm run dev
```
