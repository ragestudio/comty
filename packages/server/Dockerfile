FROM ragestudio/ultragateway:latest AS build

# Install dependencies
RUN apt update -y
RUN apt install -y curl git build-essential
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME/bin:$PATH"
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0

RUN corepack enable

# Copy Files
COPY packages/server /packages/server
COPY packages/shared /packages/shared
COPY modules/linebridge /modules/linebridge

WORKDIR /modules/linebridge/server
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install
RUN pnpm run build
RUN pnpm clean
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

WORKDIR /packages/shared
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

RUN node-prune

WORKDIR /packages/server
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

RUN node-prune

RUN node-prune /packages/server/node_modules && \
    node-prune /packages/shared/node_modules && \
    node-prune /modules/linebridge/server/node_modules && \
    find /packages /modules -type f \( -name "*.map" -o -name "*.tsbuildinfo" -o -name "*.md" -o -name "*.test.*" -o -name "*.spec.*" \) -delete

#### RUNTIME
FROM ragestudio/ultragateway:latest AS runtime

# clean apt cache
RUN apt autoclean -y
RUN apt clean -y
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

USER node
WORKDIR /packages/server

# copy server dir
COPY --from=build --chown=node:node /packages/server /packages/server
COPY --from=build --chown=node:node /packages/shared /packages/shared
COPY --from=build --chown=node:node /modules/linebridge /modules/linebridge

COPY --from=build --chown=node:node /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=build --chown=node:node /usr/local/bin/ffprobe /usr/local/bin/ffprobe

RUN rm -rf /packages/shared/node_modules
RUN rm -rf /packages/shared/assets

RUN ln -s /packages/server/node_modules /packages/shared/node_modules

# Start server
ENV NODE_ENV=production
CMD ["ultragateway"]
