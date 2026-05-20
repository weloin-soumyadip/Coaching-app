# Tuition Finder — Server

Backend for the Tuition Finder platform. Coaching center owners list institutes; students discover, search, and contact them.

## Stack

- Node.js + Express 5
- MongoDB + Mongoose 9
- JWT auth (Phase 2)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env — at minimum, set MONGO_URI to a reachable MongoDB instance

# 3. Run in dev mode (auto-restart on change)
npm run dev

# 4. Smoke check
curl http://localhost:5000/api/health
# → { "status": "ok", ... }
```

If you do not have MongoDB installed locally, the quickest path is Docker:

```bash
docker run -d -p 27017:27017 --name tuition-mongo -v tuition-mongo-data:/data/db mongo:7
```

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
