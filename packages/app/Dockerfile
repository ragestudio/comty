FROM node:16-alpine

RUN apk add git
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 9000

COPY --chown=node:node package.json ./
COPY --chown=node:node . .

RUN chmod -R 777 /home/node/app
RUN npm install -D --force

CMD ["node", "/home/node/app/server.js"]