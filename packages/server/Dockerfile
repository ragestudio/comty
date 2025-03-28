FROM node:22-bookworm-slim
EXPOSE 9000

# Install dependencies
RUN apt update
RUN apt install -y --no-install-recommends build-essential
RUN apt install -y --no-install-recommends git
RUN apt install -y --no-install-recommends ssh
RUN apt install -y --no-install-recommends curl
RUN apt install -y --no-install-recommends ca-certificates
RUN apt install -y --no-install-recommends ffmpeg

# Create workdir
RUN mkdir -p /comty-server
WORKDIR /comty-server

# Copy Files
COPY . .

# Fix permissions
RUN chmod -R 777 /comty-server
RUN chown -R node:node /comty-server

# Set user to node
USER node

# Install modules & rebuild for host
RUN npm install --omit=dev
#RUN npm rebuild @tensorflow/tfjs-node --build-from-source

# Start server
RUN export NODE_ENV=production
CMD ["npm", "run", "start:prod"]
