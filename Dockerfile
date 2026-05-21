# syntax=docker/dockerfile:1.7
# Multi-stage image for the Tuition Finder server.
# Builder stage installs all deps and compiles TS -> dist/.
# Runtime stage installs only prod deps and runs node dist/server.js.
# Dev workflow targets the `builder` stage from docker-compose (see compose file).

# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm ci

COPY src ./src
RUN npm run build

# ---------- Runtime ----------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 5000
USER node
CMD ["node", "dist/server.js"]
