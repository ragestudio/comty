FROM node:16-bullseye-slim

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt update
RUN apt install --no-install-recommends curl ffmpeg python yarn build-essential -y

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app
USER node

EXPOSE 3010

COPY package.json ./
COPY --chown=node:node . .

RUN chmod -R 777 /home/node/app

RUN export NODE_ENV=production

RUN yarn global add cross-env
RUN yarn install --production
RUN yarn build
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

CMD ["yarn", "run", "run:prod"]