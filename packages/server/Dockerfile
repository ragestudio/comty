FROM node:24-trixie-slim
EXPOSE 9000

# Install dependencies
RUN apt-get update
RUN apt-get install -y --no-install-recommends bash
RUN apt-get install -y --no-install-recommends curl
RUN apt-get install -y --no-install-recommends build-essential
RUN apt-get install -y --no-install-recommends ca-certificates
RUN apt-get install -y --no-install-recommends git
#RUN apt-get install -y --no-install-recommends ssh
#RUN apt-get install -y --no-install-recommends which
#RUN apt-get install -y --no-install-recommends nscd

# Create workdir
RUN mkdir -p /server
WORKDIR /server

# Copy Files
COPY . .

# Fix permissions
RUN chmod -R 777 /server
RUN chown -R node:node /server

# Install modules & rebuild for host
RUN npm install --omit=dev

# Set user to node
USER node

# Start server
ENV NODE_ENV=production
CMD ["npm", "run", "start:prod"]
