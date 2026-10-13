---
sidebar_position: 5
---

# Backend

The backend lives in `packages/server`. It is a set of Linebridge microservices orchestrated by the gateway (see [Service Core](./core)).

## Configuration

Copy the example environment file and fill in your values:

```shell
cp packages/server/.env-example packages/server/.env
```

`JWT_SECRET` and `MFA_ENCRYPTION_KEY` are the minimum required to boot. See [Configuration](./configuration) for where configuration lives and how to manage secrets with Infisical, and [Environment variables](./environment) for the full reference.

## Services

Each service in `packages/server/services` binds its own port and is proxied by the gateway:

| Port | Service       |
| :--- | :------------ |
| 3000 | main          |
| 3001 | posts         |
| 3002 | files         |
| 3003 | music         |
| 3004 | chats         |
| 3005 | marketplace   |
| 3007 | ems (mail)    |
| 3008 | users         |
| 3009 | notifications |
| 3010 | search        |
| 3011 | rtc           |
| 3012 | groups        |
| 3020 | auth          |

## First setup

Make sure the [infrastructure](./core#data-infrastructure) is running, then initialize the databases (creates the root user and default limits):

```shell
pnpm run setup:server
```

To force the tasks to run again:

```shell
pnpm run setup:server -- --force
```

## Running

Start the gateway together with every service (hot-reload):

```shell
pnpm run dev:server
```

The API is exposed on `http://localhost:9000`. To run the backend and the web app at the same time, use `pnpm run dev` from the repository root.

## Tests and checks

```shell
pnpm --filter @comty/server test
pnpm --filter @comty/server typecheck
```
