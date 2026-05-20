# Task Tracker — Tuition Finder Backend

> Living document. Update as work progresses.
> Spec: `docs/superpowers/specs/2026-05-20-tuition-finder-phase1-design.md`
> Plan: `docs/superpowers/plans/2026-05-20-tuition-finder-phase1.md`

## Phase 1 — Scaffolding & Schemas

- [x] Phase 1 design spec written and committed
- [x] Phase 1 implementation plan written
- [x] `package.json` + scripts
- [x] Phase 1 dependencies installed (express, mongoose, dotenv, cors, nodemon)
- [x] `.gitignore`, `.env.example`, `.env`
- [x] `src/config/index.js` (central env config)
- [x] `src/config/db.js` (Mongo connection)
- [x] `src/utils/ApiError.js`
- [x] `src/middleware/errorHandler.js`
- [x] `src/middleware/notFound.js`
- [x] `src/routes/health.routes.js`
- [x] `src/app.js`
- [x] `src/server.js`
- [x] `src/models/User.js`
- [x] `src/models/Subject.js`
- [x] `src/models/CoachingCenter.js`
- [x] `src/models/Review.js` (with denormalization hooks)
- [x] `src/models/Enquiry.js`
- [x] ADRs 0001–0004
- [x] `README.md`
- [x] End-to-end verification (boot + health + DB + graceful shutdown + misconfig fail-fast)

## Phase 2 — Auth, CRUD, Search (Planned)

### Auth
- [ ] bcrypt pre-save hash hook on User
- [ ] `POST /api/auth/register` (student / owner)
- [ ] `POST /api/auth/login`
- [ ] JWT issue helper + `protect` middleware + role-guard middleware

### CoachingCenter
- [ ] `POST /api/centers` (owner-only create)
- [ ] `GET /api/centers/:slug` (public detail)
- [ ] `PATCH /api/centers/:id` (owner-only update)
- [ ] `DELETE /api/centers/:id` (owner-only soft-delete)

### Search / Filter
- [ ] `GET /api/centers` with filters: subject, city, area, board, rating, radius (`?lat=&lng=&distance=`)
- [ ] Text search via the existing `name/description/area` text index

### Subject (admin)
- [ ] Admin CRUD endpoints + subject seeder

### Review
- [ ] `POST /api/centers/:id/reviews`
- [ ] `PATCH /api/reviews/:id` (sets `isEdited: true`)
- [ ] `DELETE /api/reviews/:id`

### Enquiry
- [ ] `POST /api/centers/:id/enquiries` (student)
- [ ] `GET /api/owner/enquiries` (center-owner dashboard)
- [ ] `PATCH /api/enquiries/:id/status`

### Cross-cutting
- [ ] File upload pipeline (multer + storage adapter)
- [ ] Request validation (express-validator or zod)
- [ ] helmet + morgan + rate limiting
- [ ] Tests: schema validation + API integration

## Decisions
See `decisions/` for ADRs locking in Phase 1 choices.
