FROM node:24-trixie-slim AS builder

RUN apt update && apt install -y git build-essential

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

COPY packages/sfu-node /packages/sfu-node
COPY packages/shared /packages/shared

WORKDIR /packages/shared
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

WORKDIR /packages/sfu-node
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

RUN pnpm run build
RUN pnpm clean
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

FROM node:24-trixie-slim AS runner

USER node

COPY --from=builder --chown=node:node /packages/sfu-node /packages/sfu-node
COPY --from=builder --chown=node:node /packages/shared /packages/shared

WORKDIR /packages/sfu-node
CMD ["node", "build/run.js"]
