FROM node:24-trixie-slim AS web-build

RUN mkdir -p /docs
WORKDIR /docs

COPY . .

RUN npm install --global corepack@latest
RUN corepack use pnpm@latest-12

RUN pnpm install
RUN pnpm build

FROM ragestudio/ultragateway:latest AS runtime

# Create workdir
RUN mkdir -p /app
WORKDIR /app

COPY --from=web-build /docs/build ./build
COPY --from=web-build /docs/server.ts .
COPY --from=web-build /docs/package.json .
COPY --from=web-build /docs/pnpm-lock.yaml .
COPY --from=web-build /docs/pnpm-workspace.yaml .

RUN npm install --global corepack@latest
RUN CI=true corepack use pnpm@latest-12
RUN CI=true pnpm install --frozen-lockfile

ENV NODE_ENV=production
CMD ["node", "--run", "serve"]
