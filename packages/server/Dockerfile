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

# Support for nginx gateway
ENV NGINX_VERSION=1.26.3
ENV NGINX_BINARIES_URL=https://jirutka.github.io/nginx-binaries
RUN ARCH="$(dpkg --print-architecture)" && \
    if [ "$ARCH" = "arm64" ]; then \
        NGINX_ARCH="aarch64"; \
    elif [ "$ARCH" = "amd64" ]; then \
        NGINX_ARCH="x86_64"; \
    else \
        echo "Unsupported architecture: $ARCH" && \
        exit 1; \
    fi && \
    NGINX_BINARY_URL="${NGINX_BINARIES_URL}/nginx-${NGINX_VERSION}-${NGINX_ARCH}-linux" && \
    curl -L "${NGINX_BINARY_URL}" -o /comty-server/nginx-bin && \
    chmod +x /comty-server/nginx-bin

# Check nginx version
RUN /comty-server/nginx-bin -v

# Fix permissions
RUN chmod -R 777 /comty-server
RUN chown -R node:node /comty-server

# Set user to node
USER node

# Install modules & rebuild for host
RUN npm install --omit=dev
#RUN npm rebuild @tensorflow/tfjs-node --build-from-source

# Start server
ENV NODE_ENV=production
CMD ["npm", "run", "start:prod"]
