# Coaching App — Progress Log

> Step-by-step record of everything completed in this project so far.
> Backend-only Node.js + Express + MongoDB service. No frontend in scope.

---

## 1. Project setup

- Node 22 + Express 5 + Mongoose 9 backend.
- Originally JavaScript (CommonJS) → migrated to **TypeScript strict mode + ESM** (commit `af7d7ae`).
- Git repository on branch `dev`; `main` is the integration branch.
- Phase 1 (scaffolding) is shipped; Phase 2 is in progress (sub-phase 2.1 complete).

---

## 2. Folder structure

```
Coaching-app/
├── src/
│   ├── app.ts                         # Express app (middleware, route mounts)
│   ├── server.ts                      # boot + graceful shutdown
│   ├── config/
│   │   ├── index.ts                   # env config (fail-fast on JWT_SECRET)
│   │   └── db.ts                      # Mongoose connection
│   ├── controllers/
│   │   └── auth.controller.ts         # register / login / me
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── passwordHook.ts        # bcrypt pre-save + comparePassword
│   │   │   ├── jwt.ts                 # issue() / verify() / UserType
│   │   │   └── emailUniqueness.ts     # cross-collection email check
│   │   └── authz/                     # (empty — Phase 2.3)
│   ├── middleware/
│   │   ├── asyncHandler.ts
│   │   ├── errorHandler.ts
│   │   ├── notFound.ts
│   │   ├── protect.ts                 # Bearer → req.auth
│   │   └── requireRole.ts             # role gate
│   ├── models/
│   │   ├── Admin.ts
│   │   ├── CoachingCenter.ts          # owner ref → 'Owner'
│   │   ├── Enquiry.ts                 # student ref → 'Student'
│   │   ├── Owner.ts
│   │   ├── Review.ts                  # student ref → 'Student'
│   │   ├── Student.ts
│   │   ├── Subject.ts
│   │   └── Teacher.ts
│   ├── routes/
│   │   ├── auth.routes.ts             # /api/auth/{register,login,me}
│   │   └── health.routes.ts           # /api/health
│   ├── scripts/
│   │   └── seedAdmin.ts               # bootstrap first admin
│   ├── types/
│   │   └── express.d.ts               # Request.auth augmentation
│   └── utils/
│       └── ApiError.ts
├── decisions/                          # ADR-0001 … ADR-0004
├── docs/superpowers/{specs,plans}/    # Phase 1 design + plan
├── Dockerfile                          # multi-stage (builder + runtime)
├── docker-compose.yml                  # app + mongo
├── .dockerignore
├── .env / .env.example
├── package.json
├── tsconfig.json
├── Task.md                             # Phase checkbox tracker
├── task.md                             # this progress log
└── README.md
```

---

## 3. Packages installed

### Runtime dependencies
- `express` ^5.2.1
- `mongoose` ^9.6.2
- `cors` ^2.8.6
- `dotenv` ^17.4.2
- `bcryptjs` ^3.0.3       *(Phase 2)*
- `jsonwebtoken` ^9.0.3   *(Phase 2)*

### Dev dependencies
- `typescript` ^6.0.3
- `tsx` ^4.22.3
- `@types/node` ^25.9.1
- `@types/express` ^5.0.6
- `@types/cors` ^2.8.19
- `@types/bcryptjs` ^2.4.6    *(Phase 2)*
- `@types/jsonwebtoken` ^9.0.10 *(Phase 2)*

`nodemon` was removed during the TS migration (replaced by `tsx watch`).

---

## 4. Configuration changes

### `tsconfig.json`
- `strict: true` + every strict sub-flag
- `target: ES2023`, `module: NodeNext`, `moduleResolution: NodeNext`
- `rootDir: src`, `outDir: dist`
- `noUnusedLocals` / `noUnusedParameters` on
- `allowJs: false`, `declaration: false` (this is an app, not a library)
- `noUncheckedIndexedAccess: false` (flip later when request validation lands)

### `package.json` scripts
- `dev`        — `tsx watch src/server.ts`
- `build`      — `tsc`
- `start`      — `node dist/server.js`
- `typecheck`  — `tsc --noEmit`
- `clean`      — `rm -rf dist`
- `seed:admin` — `tsx src/scripts/seedAdmin.ts`

### `src/config/index.ts`
- Reads `NODE_ENV`, `PORT`, `MONGO_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN` from env.
- **Fail-fast** at boot if `JWT_SECRET` is missing (Phase 2).

### `.env.example`
- Server: `NODE_ENV`, `PORT`
- DB: `MONGO_URI`
- Auth: `JWT_SECRET`, `JWT_EXPIRES_IN`
- CORS: `CORS_ORIGIN`
- Admin seeder: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_ADMIN_NAME` *(Phase 2)*

### Module system
- `"type": "module"` (ESM throughout)
- Relative imports must use `.js` extension even when source is `.ts`

---

## 5. Features implemented

### Phase 1 — Scaffolding & schemas (shipped)
- Central env config + Mongo connection helper
- `ApiError` class (HTTP-aware operational errors)
- Express app + 404 handler + central error handler
- `/api/health` route — uptime + env + timestamp
- Graceful shutdown on `SIGINT` / `SIGTERM`
- Five schemas: `User` (later replaced), `Subject`, `CoachingCenter`, `Review`, `Enquiry`
- Geo (2dsphere) + text + compound indexes on `CoachingCenter`
- Slug auto-generation on `CoachingCenter` and `Subject`
- Denormalised `averageRating` + `totalReviews` on `CoachingCenter` via `Review` post-hooks
- ADRs 0001 (GeoJSON), 0002 (Subject as separate collection), 0003 (one owner → many centers), 0004 (denormalised rating)

### TypeScript migration (shipped, commit `af7d7ae`)
- All 13 `.js` files renamed via `git mv` → `.ts`
- CommonJS → ESM (`import`/`export`, `import 'dotenv/config'`)
- Mongoose typing pattern: `InferSchemaType<typeof schema>` + `HydratedDocument<T>` + `Model<T>`
- Express middleware typed via `RequestHandler` / `ErrorRequestHandler`
- Dockerfile rewritten as multi-stage (builder → runtime)
- `tsx watch` for dev, `tsc` build + `node dist/server.js` for prod

### Phase 2.1 — Four-role auth foundations (complete)
- Single `User` collection dropped; replaced by four role collections: `Owner`, `Teacher`, `Student`, `Admin`
- Shared bcrypt pre-save hook + `comparePassword` instance method via `attachPasswordHooks<T>(schema)` factory
- JWT helper (`issue` / `verify`) with `{sub, userType}` payload
- Cross-collection email uniqueness check (`findEmailOwner`)
- `protect` middleware decodes Bearer token and loads the user from the correct collection
- `requireRole(...allowed)` middleware
- `asyncHandler` wrapper for promise-rejecting route handlers
- Express `Request.auth` type augmentation (tagged union)
- Admin bootstrap via `npm run seed:admin` (env-driven)
- All existing model refs updated:
  - `CoachingCenter.owner` → `Owner` (was `User`)
  - `Review.student`       → `Student` (was `User`)
  - `Enquiry.student`      → `Student` (was `User`)

---

## 6. Docker setup

### `Dockerfile` (multi-stage)
- **Builder stage** (`node:22-alpine`) — installs all deps, runs `tsc`, produces `dist/`
- **Runtime stage** (`node:22-alpine`) — `NODE_ENV=production`, prod deps only, `USER node`, runs `node dist/server.js`
- Dev container targets the **builder** stage (has `tsx` + sources)
- Production image is lean — `tsx` and `typescript` are excluded

### `docker-compose.yml`
- `app` service — built from `./` with `target: builder` for dev; binds `./` into `/app`; anonymous volume preserves `node_modules`; runs `npm run dev`
- `mongo` service — `mongo:7`, external volume `tuition-mongo-data`, healthcheck via `mongosh ping`
- Ports: app on `127.0.0.1:5000`, mongo on `127.0.0.1:27017`
- App `MONGO_URI` overridden inside compose to `mongodb://mongo:27017/tuition_finder`

### `.dockerignore`
Excludes `node_modules`, `.git`, `.env`, `dist`, `coverage`, IDE folders.

---

## 7. Database setup

- **Engine**: MongoDB 7 via the compose `mongo` service.
- **Database**: `tuition_finder`.
- **Connection**: `src/config/db.ts` (`mongoose.connect`, logs `[mongo] connected to tuition_finder`).
- **Volume**: external named volume `tuition-mongo-data` (host-managed; survives container removals).

### Collections currently present
| Collection | Purpose |
|---|---|
| `owners` | Owner auth + profile (new) |
| `teachers` | Teacher auth + profile (new) |
| `students` | Student auth + profile (new) |
| `admins` | Admin auth + permissions list (new) |
| `coachingcenters` | Centers owned by an Owner (Phase 1, ref flipped to Owner) |
| `subjects` | Subjects catalogue (Phase 1) |
| `reviews` | Center reviews by students (Phase 1, ref flipped to Student) |
| `enquiries` | Student enquiries to centers (Phase 1, ref flipped to Student) |

### Key indexes
- `coachingcenters`: `2dsphere` on `location`; text on `name/description/area`; compound on `(city, isActive, isVerified)`; descending on `averageRating`; unique `slug`.
- `subjects`: unique `name`, unique `slug`.
- `reviews`: compound unique `(coachingCenter, student)`.
- `teachers`: text on `name/bio/description`; `subjects`; `(feesRange.min, feesRange.max)`; descending `averageRating`; sparse `2dsphere` on `location`; compound on `(city, isActive, isVerified)`.
- `students`: sparse `2dsphere` on `location`; `city`.
- All four role collections: `email` unique-per-collection.

---

## 8. Authentication work

### Architecture (locked)
- **Four separate auth collections** — no shared User table, no discriminators.
- One register endpoint + one login endpoint; `userType` is part of the request body.
- JWT payload `{sub, userType}` — middleware uses `userType` to load from the correct collection.
- bcrypt (12 rounds) via `bcryptjs` (pure-JS, no native build in Alpine).
- Cross-collection email uniqueness enforced in the controller (app-level check). **Known race window** — accepted for Phase 2; documented as ADR-0005 (pending write).

### Files
- `src/lib/auth/passwordHook.ts`
- `src/lib/auth/jwt.ts`
- `src/lib/auth/emailUniqueness.ts`
- `src/middleware/protect.ts`
- `src/middleware/requireRole.ts`
- `src/middleware/asyncHandler.ts`
- `src/controllers/auth.controller.ts`
- `src/routes/auth.routes.ts`
- `src/types/express.d.ts`
- `src/scripts/seedAdmin.ts`

### Behaviour verified
- Register owner / teacher / student → 201 with JWT + sanitised user
- Login all four roles → 200 with JWT
- `GET /api/auth/me` with Bearer → 200 with `{userType, user}`
- Cross-collection email collision → **409** "Email already registered as <role>"
- Wrong password → **401** "Invalid credentials"
- `npm run seed:admin` creates the root admin idempotently
- Admin login bumps `lastLoginAt`

### Out of scope for now (deferred to Phase 3+)
- Email verification, password reset, refresh tokens, 2FA
- Granular admin permission enforcement (the `permissions[]` field is stored but not yet checked)

---

## 9. APIs created

| Method | Path | Auth | Notes |
|---|---|---|---|
| GET | `/` | public | Hello banner |
| GET | `/api/health` | public | uptime + env + timestamp |
| POST | `/api/auth/register` | public | body `{userType, name, email, password, phone?}`; userType ∈ `owner|teacher|student` |
| POST | `/api/auth/login` | public | body `{userType, email, password}`; userType ∈ all four; returns `{token, user}` |
| GET | `/api/auth/me` | Bearer | returns `{userType, user}` |

Everything else from the Phase 2 plan (centers, courses, teachers, students, reviews, search, admin) is **not yet wired** — see section 11.

---

## 10. UI / components completed

**None.** This is a backend-only project. No frontend / admin UI is in scope; the admin panel will be REST endpoints only.

---

## 11. Pending tasks

### Phase 2.2 — CoachingCenter CRUD + Subjects (next up)
- Controllers + routes for centers (`POST/GET/PATCH/DELETE /api/centers`, soft delete)
- Public subject list + admin subject CRUD
- `seedSubjects.ts` for canonical subject fixture

### Phase 2.3 — Course + TeacherCenterAssignment
- New models: `Course`, `TeacherCenterAssignment`
- `Course` nested under `CoachingCenter` (Owner → Center → Course → Teachers)
- Owner invites teacher by email (auto-resolves on teacher signup via post-save hook)
- Teacher accept/reject; reverse flow (teacher request join, owner approve)
- Add `courses` virtual to `CoachingCenter`

### Phase 2.4 — Reviews (teachers)
- New model: `TeacherReview` with denormalised rating hooks on `Teacher`
- Routes: `POST /api/teachers/:id/reviews`, edit/delete on `/api/teacher-reviews/:id`
- Wire student-authored center reviews via the existing `Review` model
- ADR-0005 (cross-collection email race) + ADR-0006 (teacher rating denormalisation)

### Phase 2.5 — Search
- Center search filters (`q`, `subject`, `city`, `area`, `board`, `minRating`, `minFees/maxFees`, `lat/lng/distanceKm`)
- Teacher search (own location, subjects, fees range, rating, board)
- Course search (subject, center, fees)

### Phase 2.6 — Admin panel
- `/api/admin/*` REST surface gated `protect` + `requireRole('admin')`
- Listings, activate/deactivate, verify-toggle for centers/teachers
- Admin self-bootstrap successors (`POST /api/admin/admins`)
- Subject CRUD + bulk seed endpoint
- Hard-delete on reviews/courses/subjects

### Phase 2.7 — Profile updates per role
- `GET/PATCH /api/owners/me`
- `GET/PATCH /api/teachers/me` — full profile (education, batches, fees, etc.)
- `GET/PATCH /api/students/me`
- Public `GET /api/teachers/:id`

### Cross-cutting (deferred)
- File upload pipeline (multer + storage adapter) for profile/banner images
- Request validation (Zod or express-validator)
- helmet + morgan + rate limiting
- Tests — schema validation, JWT round-trip, `recalcStats` correctness, owner-of-center guard, assignment state machine
- ESLint + Prettier
- CI / GitHub Actions
- Email verification / password reset / refresh tokens / 2FA
- Mongo replica set + transactional registration (closes the cross-collection email race)
- Frontend / admin UI (out of scope for this backend repo)

### Known issues / risks
- **Cross-collection email race** — two concurrent registrations of the same email into different collections can both succeed. Tolerable for Phase 2; will need transactions in Phase 3.
- **Orphaned invites** — if an owner invites a teacher by email and that email later registers as Student/Owner/Admin, the invite never auto-resolves (only Teacher signup triggers the hook).
- **`Admin.permissions` not enforced** — stored but every admin currently has full access.
- **Git push to `main` blocked** — local commit `af7d7ae` exists, but the remote rejects pushes from `weloin-subhadip` (repo is owned by `weloin-soumyadip`). Either get added as collaborator or push from the owner's credentials.

---

## 12. Quick start (current state)

```bash
# Boot dev stack
docker compose up -d --build
docker compose logs -f app

# Verify
curl -s localhost:5000/api/health

# Register / login
curl -s -X POST localhost:5000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"userType":"owner","name":"Alice","email":"alice@x.com","password":"secret123"}'

curl -s -X POST localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"userType":"owner","email":"alice@x.com","password":"secret123"}'

# Bootstrap admin (run once in dev)
SEED_ADMIN_EMAIL=root@x.com SEED_ADMIN_PASSWORD=secret123 npm run seed:admin
```
