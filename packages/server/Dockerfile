FROM ragestudio/ultragateway:latest AS build

# Install dependencies
RUN apt update -y
RUN apt install -y curl nscd git ssh build-essential
RUN curl -sf https://gobinaries.com/tj/node-prune | sh

# Create workdir
RUN mkdir -p /server
WORKDIR /server

# Copy Files
COPY . .

# Fix permissions
RUN chmod -R 777 /server
RUN chown -R node:node /server

RUN /server/scripts/installFfmpeg.sh

# Set user to node
USER node

# Install modules & rebuild for host
RUN npm dedupe
RUN IS_ACTION_RUNNER=true npm install --omit=dev
RUN npm cache clean --force
RUN rm package-lock.json

RUN node-prune

#### RUNTIME
FROM ragestudio/ultragateway:latest AS runtime
EXPOSE 9000

# clean apt cache
RUN apt autoclean -y
RUN apt clean -y

# Create server workdir
RUN mkdir -p /server
WORKDIR /server

# copy server dir
COPY --from=build /server /server
COPY --from=build /usr/local/bin/ffmpeg /usr/local/bin/ffmpeg
COPY --from=build /usr/local/bin/ffprobe /usr/local/bin/ffprobe

# Fix permissions
RUN chmod -R 777 /server
RUN chown -R node:node /server

# Set user to node
USER node

# Start server
ENV NODE_ENV=production
CMD ["npm", "run", "start:prod"]
