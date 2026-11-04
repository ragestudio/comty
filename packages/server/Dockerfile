FROM node:26-trixie-slim AS build

ARG TARGETARCH
ARG ULTRAGATEWAY_VERSION=

# Install dependencies
RUN apt update -y
RUN apt install -y curl git build-essential python3 xz-utils
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

RUN npm install --global pnpm@12
RUN pnpm config set store-dir /pnpm/store --global

# Copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml /

# Copy projects
COPY packages/server /packages/server
COPY packages/shared /packages/shared

# Copy only the linebridge packages required at runtime
COPY modules/linebridge/package.json /modules/linebridge/package.json
COPY modules/linebridge/server /modules/linebridge/server
COPY modules/linebridge/cli /modules/linebridge/cli
COPY modules/linebridge/engines/neo/package.json modules/linebridge/engines/neo/install.mjs /modules/linebridge/engines/neo/
COPY modules/linebridge/engines/neo/src /modules/linebridge/engines/neo/src

# Install production dependencies and build native addons
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# linebridge resolves the neo engine from the workspace root, where it is only
# a devDependency and is skipped by the production install. the engine also
# needs its workspace peer, which pnpm does not link for workspace protocols
RUN mkdir -p /modules/linebridge/node_modules/@linebridge && \
    ln -sfn ../../engines/neo /modules/linebridge/node_modules/@linebridge/engine-neo && \
    ln -sfn ../../../server /modules/linebridge/engines/neo/node_modules/linebridge

# Install ffmpeg binaries
RUN /packages/server/scripts/installFfmpeg.sh

# Install the gateway binary for the target architecture
RUN TARGETARCH="$TARGETARCH" ULTRAGATEWAY_VERSION="$ULTRAGATEWAY_VERSION" /packages/server/scripts/installUltragateway.sh

RUN node-prune /node_modules && \
    node-prune /packages/server/node_modules && \
    node-prune /packages/shared/node_modules && \
    node-prune /modules/linebridge/server/node_modules && \
    find /packages /modules /node_modules -type f \( -name "*.map" -o -name "*.tsbuildinfo" -o -name "*.md" -o -name "*.test.*" -o -name "*.spec.*" \) -delete

# mediasoup is only imported as types
RUN rm -rf /node_modules/.pnpm/mediasoup@* \
    /node_modules/.pnpm/mediasoup-client@* \
    /packages/shared/node_modules/mediasoup \
    /packages/shared/node_modules/mediasoup-client

# 7zip only needs the linux binary
RUN rm -rf /node_modules/.pnpm/7zip-bin@*/node_modules/7zip-bin/mac \
    /node_modules/.pnpm/7zip-bin@*/node_modules/7zip-bin/win

#### RUNTIME
FROM node:26-trixie-slim AS runtime

# certificate authorities for outbound https requests
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# copy the gateway binary
COPY --from=build --chown=node:node /usr/local/bin/ultragateway /usr/local/bin/ultragateway

# remove tooling only needed for building
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/include/node

USER node
WORKDIR /packages/server

# copy server dir
COPY --from=build --chown=node:node /node_modules /node_modules
COPY --from=build --chown=node:node /packages/server /packages/server
COPY --from=build --chown=node:node /packages/shared /packages/shared
COPY --from=build --chown=node:node /modules/linebridge /modules/linebridge

COPY --from=build --chown=node:node /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=build --chown=node:node /usr/local/bin/ffprobe /usr/local/bin/ffprobe
COPY --from=build --chown=node:node /usr/local/lib/ffmpeg /usr/local/lib/ffmpeg

RUN rm -rf /packages/shared/assets

# Start server
ENV NODE_ENV=production
ENV LD_LIBRARY_PATH=/usr/local/lib/ffmpeg
CMD ["ultragateway"]
