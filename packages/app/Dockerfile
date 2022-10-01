FROM node:16-alpine

RUN apk add git
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 9000

COPY --chown=node:node ./src ./src
COPY --chown=node:node ./constants ./constants
COPY --chown=node:node ./config ./config
COPY --chown=node:node ./public ./public
COPY --chown=node:node ./index.html .
COPY --chown=node:node ./.config.js .
COPY --chown=node:node ./vite.config.js .
COPY --chown=node:node ./server.js .
COPY --chown=node:node ./package.json .

RUN chmod -R 777 /home/node/app
RUN npm install -D --force
RUN npm run build

CMD ["node", "/home/node/app/server.js"]