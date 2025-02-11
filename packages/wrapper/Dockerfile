FROM node:20-bookworm-slim
EXPOSE 5000

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
WORKDIR /home/node/app

# Copy Files
COPY package.json ./
COPY . .

# Fix permissions
RUN chmod -R 777 /home/node/app
RUN chown -R node:node /home/node/app

# Set user to node
USER node

# Install modules & rebuild for host
RUN npm install

# Start server
RUN export NODE_ENV=production
CMD ["npm", "run", "start"]
