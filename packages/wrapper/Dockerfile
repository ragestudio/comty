FROM node:20-bookworm-slim
EXPOSE 5000

# Install dependencies
RUN apt update
RUN apt install -y --no-install-recommends build-essential
RUN apt install -y --no-install-recommends curl
RUN apt install -y --no-install-recommends git
RUN apt install -y --no-install-recommends ssh
RUN apt install -y --no-install-recommends ca-certificates

# Create workdir
WORKDIR /home/node/app

# Copy Files
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
RUN export UWS_HTTP_MAX_HEADERS_SIZE=8192

ENV NODE_ENV=production
ENV UWS_HTTP_MAX_HEADERS_SIZE=8192

CMD ["npm", "run", "start"]
