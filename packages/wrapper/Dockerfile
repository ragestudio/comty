FROM node:26-trixie-slim AS build

# install build dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates curl git build-essential python3 xz-utils && \
    rm -rf /var/lib/apt/lists/*

RUN curl -sf https://gobinaries.com/tj/node-prune | sh

RUN npm install --global pnpm@12
RUN pnpm config set store-dir /pnpm/store --global

# copy workspace files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml /

# copy wrapper project
COPY packages/wrapper /packages/wrapper

# copy only the linebridge packages required at runtime
COPY modules/linebridge/package.json /modules/linebridge/package.json
COPY modules/linebridge/server /modules/linebridge/server
COPY modules/linebridge/cli /modules/linebridge/cli
COPY modules/linebridge/engines/neo/package.json modules/linebridge/engines/neo/install.mjs /modules/linebridge/engines/neo/
COPY modules/linebridge/engines/neo/src /modules/linebridge/engines/neo/src

# install production dependencies and the neo engine binary
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# linebridge resolves the neo engine and its workspace peer from the workspace root
RUN mkdir -p /modules/linebridge/node_modules/@linebridge /modules/linebridge/engines/neo/node_modules && \
    rm -rf /modules/linebridge/node_modules/@linebridge/engine-neo /modules/linebridge/engines/neo/node_modules/linebridge && \
    ln -sfn ../../engines/neo /modules/linebridge/node_modules/@linebridge/engine-neo && \
    ln -sfn ../../../server /modules/linebridge/engines/neo/node_modules/linebridge

# remove development files
RUN node-prune /node_modules && \
    node-prune /packages/wrapper/node_modules && \
    node-prune /modules/linebridge/server/node_modules && \
    node-prune /modules/linebridge/engines/neo/node_modules && \
    find /packages /modules /node_modules -type f \( -name "*.map" -o -name "*.tsbuildinfo" -o -name "*.md" -o -name "*.test.*" -o -name "*.spec.*" \) -delete

# 7zip only needs the linux binary
RUN rm -rf /node_modules/.pnpm/7zip-bin@*/node_modules/7zip-bin/mac \
    /node_modules/.pnpm/7zip-bin@*/node_modules/7zip-bin/win

#### RUNTIME
FROM node:26-trixie-slim AS runtime

# fonts used by sharp when rendering svg text
RUN apt-get update && \
    apt-get install -y --no-install-recommends ca-certificates fontconfig fonts-dejavu-core && \
    rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
    fc-cache -f

# remove tooling only needed for building
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /usr/local/include/node

USER node
WORKDIR /packages/wrapper

COPY --from=build --chown=node:node /node_modules /node_modules
COPY --from=build --chown=node:node /packages/wrapper /packages/wrapper
COPY --from=build --chown=node:node /modules/linebridge /modules/linebridge

EXPOSE 5000

ENV NODE_ENV=production
CMD ["node_modules/.bin/linebridge", "boot", "./src/main.ts"]
