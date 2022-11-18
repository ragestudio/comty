FROM node:16-bullseye

RUN apt update
RUN apt install python -y
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 3010

COPY package.json ./
COPY --chown=node:node . .

RUN chmod -R 777 /home/node/app
RUN npm install
RUN npm run build
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

CMD ["node", "/home/node/app/dist/index.js"]