# Tuition Finder — Server

Backend for the Tuition Finder platform. Coaching center owners list institutes; students discover, search, and contact them.

## Stack

- Node.js + Express 5
- MongoDB + Mongoose 9
- JWT auth (Phase 2)

## Quick Start (Docker Compose — recommended)

```bash
# 1. Set up environment
cp .env.example .env

# 2. Boot the full stack (app + Mongo)
docker compose up --build

# 3. Smoke check (from another shell)
curl http://localhost:5000/api/health
# → { "status": "ok", ... }
```

That's it. The `app` container runs `npm run dev` (which uses `node --watch`),
so editing files under `src/` triggers an in-container restart. Mongo data
persists in the named volume `tuition-mongo-data`.

When you add a new dependency on the host (`npm install <pkg>`), rebuild so
the container picks it up:

```bash
docker compose up --build
# or, without restarting:  docker compose exec app npm install <pkg>
```

To stop everything: `docker compose down` (data persists). To wipe the DB:
`docker volume rm tuition-mongo-data` after `down`.

## Alternative: run on host

```bash
npm install
cp .env.example .env       # MONGO_URI points at localhost:27017
npm run dev
```

You'll need a reachable Mongo. If you don't have one, start just the Mongo
service from Compose: `docker compose up mongo`.

## Project Layout

```
src/
  config/        Central env config + Mongo connection
  models/        Mongoose schemas
  routes/        Express routers
  middleware/    Error handling, 404, future auth
  utils/         Small helpers (ApiError class)
  controllers/   (empty in Phase 1 — Phase 2 fills it)
  app.js         Express app wiring
  server.js      Boot entry — loads env, connects DB, listens
```

## Documentation

- Design spec: `docs/superpowers/specs/2026-05-20-tuition-finder-phase1-design.md`
- Implementation plan: `docs/superpowers/plans/2026-05-20-tuition-finder-phase1.md`
- Decisions: `decisions/` (ADRs)
- Task tracker: `Task.md`

## Phase Status

- **Phase 1** (scaffolding + schemas): tracked in `Task.md`.
- **Phase 2** (auth, CRUD, search): planned — see `Task.md`.
