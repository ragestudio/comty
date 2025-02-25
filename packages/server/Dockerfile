FROM node:20-bookworm-slim
EXPOSE 9000

# Install dependencies
RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
RUN apt update
RUN apt install -y --no-install-recommends build-essential
RUN apt install -y --no-install-recommends curl
RUN apt install -y --no-install-recommends ffmpeg
RUN apt install -y --no-install-recommends yarn
RUN apt install -y --no-install-recommends git
RUN apt install -y --no-install-recommends ssh
RUN apt install -y --no-install-recommends ca-certificates

# Create workdir
RUN mkdir -p /comty-server
WORKDIR /comty-server

# Copy Files
COPY package.json ./
COPY . .

# Fix permissions
RUN chmod -R 777 /comty-server
RUN chown -R node:node /comty-server

# Set user to node
USER node

# Install modules & rebuild for host
RUN npm install
RUN npm rebuild @tensorflow/tfjs-node --build-from-source

# Start server
RUN export NODE_ENV=production
CMD ["npm", "run", "start:prod"]
