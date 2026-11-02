FROM node:24-trixie-slim AS builder

RUN apt update && apt install -y \
    git \
    build-essential \
    python3 \
    make \
    g++ \
    jq \
    ca-certificates

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

WORKDIR /app

COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/sfu-node ./packages/sfu-node
COPY packages/shared ./packages/shared
COPY modules/linebridge ./modules/linebridge

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --no-frozen-lockfile --filter sfu-node...

RUN pnpm --filter sfu-node build

FROM node:24-trixie-slim AS runner

USER node

WORKDIR /app/packages/sfu-node

COPY --from=builder --chown=node:node /app /app

ENV NODE_ENV=production

CMD ["./node_modules/.bin/linebridge-boot", "./build/run.js"]
