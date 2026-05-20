# Tuition Finder — Phase 1 Design Spec

> **Project:** Tuition Finder backend
> **Phase:** 1 of N — server scaffolding + Mongoose schemas only
> **Date:** 2026-05-20

---

## Context

We are building **Tuition Finder**, a platform where coaching center owners list their institutes and students discover, compare, and contact the best centers near them. The product splits across three user roles:

- **Owners** create and manage CoachingCenter profiles.
- **Students** search by subject, area, rating, fees, and contact centers.
- **Admins** verify centers and curate the master Subject list.

**Phase 1 (this spec) is intentionally narrow.** It produces no business APIs. It establishes:

1. A clean, scalable Express.js project skeleton (MVC layout).
2. A reliable MongoDB connection through Mongoose.
3. Centralized environment config via `dotenv`.
4. The complete data model — five Mongoose schemas — so every subsequent phase has a stable foundation.

Phase 2 (next, separate spec) will add auth APIs, CoachingCenter CRUD, and search/filter endpoints on top of these schemas.

The intended outcome of Phase 1: `npm run dev` boots the server, connects to Mongo, and `GET /api/health` returns `200 OK`. Nothing more, nothing less — but every schema is production-ready so Phase 2 doesn't need to refactor data shapes.

---

## Locked-in Design Decisions

Captured in `decisions/` as ADRs once we create the files. Decisions:

| # | Decision | Why |
|---|---|---|
| 0001 | Store location as **GeoJSON Point with a `2dsphere` index** | Enables native `$near` / `$geoWithin` radius queries ("centers within 5 km of me") — required for the student search UX. |
| 0002 | **Subject is its own collection**; `CoachingCenter.subjectsOffered` is an array of `ObjectId` references | Admin-curated canonical list prevents free-text duplicates (`Math` / `Maths` / `Mathematics`) and makes filter-by-subject a clean indexed lookup. |
| 0003 | **One owner → many centers** (no uniqueness constraint on `owner`) | Common real-world pattern (franchise / chain owners). Trivially restrict later if business rules tighten. |
| 0004 | Store **denormalized `averageRating` and `totalReviews`** on `CoachingCenter`, updated by post-save / post-update / post-delete hooks on `Review` | Phase 2 needs "sort by rating" in the search API — denormalization keeps that O(log n) instead of an aggregation per request. |

---

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── index.js               # Central env config object (single source of truth)
│   │   └── db.js                  # Mongoose connection + event listeners + fail-fast
│   ├── models/
│   │   ├── User.js
│   │   ├── Subject.js
│   │   ├── CoachingCenter.js
│   │   ├── Review.js
│   │   └── Enquiry.js
│   ├── controllers/               # Empty in Phase 1 — Phase 2 fills it
│   ├── routes/
│   │   └── health.routes.js       # GET /api/health (boot sanity check)
│   ├── middleware/
│   │   ├── errorHandler.js        # Centralized async-aware error handler
│   │   └── notFound.js            # 404 fallback
│   ├── utils/
│   │   └── ApiError.js            # Custom error class with statusCode
│   ├── app.js                     # Express app: middleware + routes wiring
│   └── server.js                  # Entry: load env → connect DB → app.listen
├── decisions/
│   ├── 0001-geolocation-geojson.md
│   ├── 0002-subject-as-reference.md
│   ├── 0003-owner-center-cardinality.md
│   └── 0004-rating-denormalization.md
├── docs/
│   └── superpowers/specs/
│       └── 2026-05-20-tuition-finder-phase1-design.md   # This file
├── .env.example                   # Committed template
├── .env                           # Gitignored — real secrets
├── .gitignore
├── package.json
├── Task.md                        # Phase 1 + Phase 2 task tracker
└── README.md
```

**Why `src/`?** Isolates Node entry points from config and docs, gives tests a clean home later (`src/**/*.test.js`).

---

## Dependencies

Each install will be done with explicit user approval. Nothing is installed pre-emptively.

### Phase 1 production

| Package | Purpose |
|---|---|
| `express` | HTTP framework |
| `mongoose` | MongoDB ODM, schemas, indexes, hooks |
| `dotenv` | Load `.env` |
| `cors` | Allow client origins (lightweight to set up now) |

### Phase 1 dev

| Package | Purpose |
|---|---|
| `nodemon` | Auto-restart in dev |

### Deferred to Phase 2 (called out so they don't surprise us later)

- `bcryptjs` — password hashing pre-save hook
- `jsonwebtoken` — JWT issue/verify
- `express-validator` (or `zod`) — request validation
- `helmet`, `morgan`, `express-rate-limit` — security/logging hardening
- `multer` / cloud SDK — file uploads (schemas only hold image URLs in Phase 1)

---

## Environment Config

### `.env.example` (committed template)

```bash
# Server
NODE_ENV=development
PORT=5000

# Database
MONGO_URI=mongodb://127.0.0.1:27017/tuition_finder

# Auth (placeholders — wired in Phase 2)
JWT_SECRET=replace_me_with_a_long_random_string
JWT_EXPIRES_IN=7d

# CORS — comma-separated allowed origins
CORS_ORIGIN=http://localhost:3000
```

### `.env`

Gitignored copy of `.env.example`, with real values.

### `.gitignore`

```
node_modules/
.env
.env.local
*.log
.DS_Store
coverage/
dist/
```

### `src/config/index.js`

Single source of truth — no `process.env.X` reads scattered through the codebase:

```js
module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
  },
};
```

### `src/server.js` (boot order matters)

```js
require('dotenv').config();           // Load env FIRST
const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

(async () => {
  await connectDB();                  // Fail fast on DB issues
  app.listen(config.port, () => {
    console.log(`[server] listening on :${config.port} (${config.env})`);
  });
})();
```

### `src/config/db.js`

- Asserts `config.mongoUri` exists (throws clear error if missing).
- `await mongoose.connect(config.mongoUri)` — modern driver, no deprecated options.
- Listens for `connected`, `error`, `disconnected` events; logs each.
- Throws on initial failure so supervisors restart cleanly.

---

## Mongoose Schemas

All schemas use `{ timestamps: true }` (auto `createdAt` / `updatedAt`).

### 1. `User` — `src/models/User.js`

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `name` | String | required, trim | |
| `email` | String | required, unique, lowercase, regex-validated | |
| `password` | String | required, minlength 6, `select: false` | **Pre-save bcrypt hash hook deferred to Phase 2** |
| `phone` | String | trim | Future OTP / contact |
| `role` | String | enum `['student','owner','admin']`, default `'student'` | |
| `profileImage` | String | default `''` | URL/path |
| `isActive` | Boolean | default `true` | Soft-delete switch |
| `isEmailVerified` | Boolean | default `false` | Wired in Phase 2 |

**Indexes:** `email` (unique), `role`.

---

### 2. `Subject` — `src/models/Subject.js`

| Field | Type | Constraints |
|---|---|---|
| `name` | String | required, unique, trim |
| `slug` | String | required, unique, lowercase — auto-generated from `name` via pre-validate hook |
| `category` | String | optional (`Science`, `Commerce`, `Languages`, ...) |
| `description` | String | optional |
| `isActive` | Boolean | default `true` |

**Indexes:** `name` (unique), `slug` (unique), `category`.

---

### 3. `CoachingCenter` — `src/models/CoachingCenter.js`

| Field | Type | Constraints |
|---|---|---|
| `name` | String | required, trim |
| `slug` | String | unique, auto-generated from name + city (SEO-friendly URLs) |
| `description` | String | trim |
| `owner` | ObjectId (ref `User`) | required |
| `address` | String | required — full address line |
| `location` | GeoJSON Point | `{ type: 'Point', coordinates: [lng, lat] }`, **2dsphere indexed** |
| `area` | String | neighborhood/locality |
| `city` | String | required |
| `state` | String | required |
| `pincode` | String | required |
| `country` | String | default `'India'` |
| `phone` | String | required |
| `alternatePhone` | String | optional |
| `email` | String | optional, regex-validated |
| `website` | String | optional |
| `subjectsOffered` | [ObjectId (ref `Subject`)] | |
| `boards` | [String] | enum `['CBSE','ICSE','State','IB','IGCSE','Other']` |
| `classRange` | `{ from: Number, to: Number }` | e.g., `{ from: 6, to: 12 }` |
| `fees` | `{ min: Number, max: Number, currency: String }` | currency default `'INR'` |
| `timings` | `[{ day, openTime, closeTime, closed }]` | `day` enum Mon–Sun; times as `'HH:MM'` 24h strings; structured so a future "open now" filter works |
| `profileImage` | String | URL/path |
| `bannerImage` | String | URL/path |
| `gallery` | [String] | extra photos |
| `isVerified` | Boolean | default `false` (admin-verified) |
| `isActive` | Boolean | default `true` |
| `averageRating` | Number | default `0`, min 0, max 5 — **denormalized, updated by Review hooks** |
| `totalReviews` | Number | default `0` — denormalized |

**Indexes:**
- `location` — `2dsphere` (radius search)
- `{ name: 'text', description: 'text', area: 'text' }` — full-text search
- `owner`
- `subjectsOffered` (multikey)
- `{ city: 1, isActive: 1, isVerified: 1 }` — compound for search/filter
- `averageRating: -1` — "sort by rating" support
- `slug` (unique)

---

### 4. `Review` — `src/models/Review.js`

| Field | Type | Constraints |
|---|---|---|
| `coachingCenter` | ObjectId (ref `CoachingCenter`) | required |
| `student` | ObjectId (ref `User`) | required |
| `rating` | Number | required, min 1, max 5 |
| `comment` | String | trim |
| `isEdited` | Boolean | default `false` |

**Indexes:** `coachingCenter`; **compound unique `{ coachingCenter, student }`** (one review per student per center).

**Denormalization hooks (the heart of ADR-0004):**

- `Review.recalcStats(centerId)` — static method. Runs:
  ```js
  Review.aggregate([
    { $match: { coachingCenter: centerId } },
    { $group: { _id: '$coachingCenter', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
  ])
  ```
  and `$set`s `averageRating` + `totalReviews` on the parent `CoachingCenter` (or zeros if no reviews left).
- `post('save')` → `recalcStats(this.coachingCenter)`.
- `post('findOneAndUpdate')` → recalc using the doc returned in the hook.
- `post('findOneAndDelete')` → recalc.

---

### 5. `Enquiry` — `src/models/Enquiry.js`

| Field | Type | Constraints |
|---|---|---|
| `coachingCenter` | ObjectId (ref `CoachingCenter`) | required |
| `student` | ObjectId (ref `User`) | required (Phase 1 = login required) |
| `subject` | ObjectId (ref `Subject`) | optional |
| `message` | String | required, trim |
| `status` | String | enum `['new','contacted','closed']`, default `'new'` |
| `ownerNotes` | String | private notes for center owner |

**Indexes:** `student`; `{ coachingCenter: 1, status: 1 }` (compound, for owner dashboards).

---

## Files Created in Phase 1

The execution order will be approved file-by-file (per user rule). Expected order:

| # | File | Purpose |
|---|---|---|
| 1 | `package.json` | Project manifest |
| 2 | `.gitignore`, `.env.example` | Hygiene + env template |
| 3 | `.env` | Local secrets (gitignored) |
| 4 | `src/config/index.js` | Central config |
| 5 | `src/config/db.js` | Mongo connection |
| 6 | `src/utils/ApiError.js` | Custom error class |
| 7 | `src/middleware/errorHandler.js` | Centralized error middleware |
| 8 | `src/middleware/notFound.js` | 404 fallback |
| 9 | `src/routes/health.routes.js` | `GET /api/health` |
| 10 | `src/app.js` | Express app wiring |
| 11 | `src/server.js` | Boot script |
| 12 | `src/models/User.js` | User schema |
| 13 | `src/models/Subject.js` | Subject schema |
| 14 | `src/models/CoachingCenter.js` | CoachingCenter schema |
| 15 | `src/models/Review.js` | Review schema + denormalization hooks |
| 16 | `src/models/Enquiry.js` | Enquiry schema |
| 17 | `Task.md` | Phase 1 done + Phase 2 outline |
| 18 | `decisions/0001..0004-*.md` | Four ADRs |
| 19 | `README.md` | Project overview + run instructions |

Empty-but-tracked directories (`src/controllers/`) get a `.gitkeep`.

After each file is created I will summarize what was done and ask whether to proceed to the next step — per the user's stated rule.

---

## Verification

End-to-end checks once Phase 1 is complete:

1. **Install:** `npm install` succeeds with zero high+ severity vulnerabilities reported.
2. **Structure check:** every file in the "Files Created" table exists; `src/controllers/` exists (with `.gitkeep`).
3. **Boot:** `npm run dev` starts the server. Console shows:
   - `[mongo] connected to <db>`
   - `[server] listening on :5000 (development)`
4. **Health route:** `curl http://localhost:5000/api/health` returns HTTP 200 and JSON like `{ "status": "ok", "uptime": <seconds>, "env": "development" }`.
5. **DB sanity (Mongo shell or Compass):** collections (`users`, `subjects`, `coachingcenters`, `reviews`, `enquiries`) are created lazily on first document insert; until then only the database `tuition_finder` exists. Index creation can be confirmed by inserting one sample doc per collection through a Mongoose script (optional smoke test) and running `db.coachingcenters.getIndexes()` — expect to see `2dsphere`, text, compound, multikey, and unique-slug indexes.
6. **Graceful shutdown:** `Ctrl+C` triggers a Mongoose `disconnected` log line before the process exits.
7. **Misconfig fail-fast:** removing `MONGO_URI` from `.env` causes the server to throw a clear error on boot, not hang.

If all 7 checks pass, Phase 1 is done and we transition to Phase 2 planning.

---

## Out of Scope for Phase 1 (Explicitly)

So nobody expects them in this phase:

- Any controller logic, business APIs, or route besides `/api/health`.
- Password hashing (bcrypt pre-save hook) — added in Phase 2 alongside `/auth/register` and `/auth/login`.
- JWT issuing / verifying middleware.
- Request validation library.
- Rate limiting, helmet, morgan.
- File upload handling — schemas store image URLs; the upload pipeline is later.
- Anonymous enquiries (Phase 1 forces login for `Enquiry`).
- Seed data scripts.
- Unit/integration tests — added with controllers in Phase 2.
