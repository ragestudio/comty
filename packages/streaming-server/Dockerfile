FROM node:16-alpine

RUN apk add git
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 3010

COPY package.json ./
COPY --chown=node:node . .

RUN chmod -R 777 /home/node/app && npm install

CMD ["/home/node/app/node_modules/corenode/bin/corenode-node", "/home/node/app/src/index.js"]