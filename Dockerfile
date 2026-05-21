# Dev image for the Tuition Finder server.
# Single-stage on purpose — Phase 1 / Phase 2 are dev-only.
FROM node:22-alpine

WORKDIR /app

# Install deps first so the layer is cached when only source changes.
COPY package*.json ./
RUN npm ci

# Copy the rest of the source. In dev, this is overlaid by a bind mount
# from docker-compose.yml, so edits on the host are picked up live.
COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]
