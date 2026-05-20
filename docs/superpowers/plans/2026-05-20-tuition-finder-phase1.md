# Tuition Finder Phase 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the Tuition Finder Node.js/Express backend with a clean MVC structure, MongoDB connection, central env config, and the five Mongoose schemas (User, Subject, CoachingCenter, Review, Enquiry). End state: `npm run dev` boots, Mongo connects, `GET /api/health` returns 200. No business APIs yet.

**Architecture:** Express app in `src/` with config/, models/, routes/, middleware/, utils/, controllers/ (empty placeholder). Central config object replaces scattered `process.env` reads. DB connection fails fast on misconfig. Schemas implement the four locked-in design decisions: GeoJSON location with 2dsphere index, Subject as a referenced collection, 1:N owner→center, denormalized rating fields synced by Review hooks.

**Tech Stack:** Node.js, Express, Mongoose 8+, dotenv, cors, nodemon (dev).

**Spec:** `docs/superpowers/specs/2026-05-20-tuition-finder-phase1-design.md`

**User rules baked into this plan:**
1. Each task ends with a "Pause for approval" step before moving on.
2. Dependency installation has its own dedicated approval point.
3. Every file creation is followed by a smoke verification (`node -e "require('./path')"`) before commit.
4. Tests are deferred to Phase 2 (per spec's Out-of-Scope section).

---

## Task 1: Initialize package.json

**Files:**
- Create: `package.json`

- [ ] **Step 1: Pause — confirm with user before touching anything**

Tell the user: "About to run `npm init -y` in `server/` and then customize `package.json`. Proceed?"
Wait for explicit go-ahead.

- [ ] **Step 2: Initialize npm project**

Run from `server/`:
```bash
npm init -y
```
Expected: creates a default `package.json`.

- [ ] **Step 3: Replace package.json with the customized version**

Write `package.json` with this exact content:

```json
{
  "name": "tuition-finder-server",
  "version": "0.1.0",
  "description": "Backend for the Tuition Finder platform",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "keywords": ["tuition", "coaching", "express", "mongodb"],
  "license": "ISC"
}
```

- [ ] **Step 4: Commit**

```bash
git add package.json
git commit -m "chore: initialize package.json with scripts and metadata"
```

- [ ] **Step 5: Summarize + pause for user**

Tell the user: "package.json created with `start` and `dev` scripts. Proceed to install dependencies (Task 2)?"
Wait for go-ahead.

---

## Task 2: Install Phase 1 dependencies

**Files:**
- Modify: `package.json` (npm will edit)
- Create: `package-lock.json`, `node_modules/`

- [ ] **Step 1: Pause — confirm with user before installing**

Tell the user:
> "About to install the following packages (already listed in the spec):
> - Production: `express`, `mongoose`, `dotenv`, `cors`
> - Dev: `nodemon`
> Proceed?"

Wait for go-ahead.

- [ ] **Step 2: Install production dependencies**

```bash
npm install express mongoose dotenv cors
```
Expected: package.json updates with `dependencies` block; no errors.

- [ ] **Step 3: Install dev dependencies**

```bash
npm install --save-dev nodemon
```
Expected: package.json updates with `devDependencies` block.

- [ ] **Step 4: Confirm versions are in range**

```bash
node -e "const p=require('./package.json'); console.log(p.dependencies, p.devDependencies);"
```
Expected: shows `express`, `mongoose`, `dotenv`, `cors`, and `nodemon`.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: install Phase 1 dependencies (express, mongoose, dotenv, cors, nodemon)"
```

Note: `node_modules/` will be ignored once Task 3 lands `.gitignore`. Do not stage it.

- [ ] **Step 6: Summarize + pause**

Tell the user: "Dependencies installed. Proceed to project hygiene files (Task 3)?"
Wait for go-ahead.

---

## Task 3: Project hygiene — .gitignore, .env.example, .env

**Files:**
- Create: `.gitignore`
- Create: `.env.example`
- Create: `.env` (gitignored)

- [ ] **Step 1: Pause — confirm with user**

Tell the user: "About to create `.gitignore`, `.env.example` (committed template), and `.env` (gitignored). Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
.env
.env.local
*.log
.DS_Store
coverage/
dist/
```

- [ ] **Step 3: Create `.env.example`**

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

- [ ] **Step 4: Create `.env` (copy of template for local dev)**

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

- [ ] **Step 5: Verify `.env` is gitignored**

```bash
git check-ignore -v .env
```
Expected: prints `.gitignore:2:.env  .env` (or similar — must show the file is ignored).

- [ ] **Step 6: Commit**

```bash
git add .gitignore .env.example
git commit -m "chore: add .gitignore and .env.example template"
```

- [ ] **Step 7: Summarize + pause**

Tell the user: ".gitignore and .env.example committed; .env created locally (gitignored). Proceed to central config (Task 4)?"
Wait for go-ahead.

---

## Task 4: Central config object

**Files:**
- Create: `src/config/index.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/config/index.js` — single source of truth for env reads. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/config/index.js`

```js
// Central environment configuration — single source of truth.
// All other modules should require this instead of reading process.env directly.
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

- [ ] **Step 3: Smoke check**

```bash
node -e "require('dotenv').config(); const c = require('./src/config'); console.log(c);"
```
Expected: prints the full config object with values from `.env` (port 5000, mongoUri set, cors.origin includes `http://localhost:3000`).

- [ ] **Step 4: Commit**

```bash
git add src/config/index.js
git commit -m "feat(config): add central environment configuration object"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Central config in place. Proceed to MongoDB connection (Task 5)?"
Wait for go-ahead.

---

## Task 5: MongoDB connection

**Files:**
- Create: `src/config/db.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/config/db.js` — Mongoose connection with fail-fast validation. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/config/db.js`

```js
const mongoose = require('mongoose');
const config = require('./index');

// Connect to MongoDB and wire up connection event logging.
// Throws on missing URI or initial connection failure so the process
// exits cleanly under a supervisor (nodemon, PM2, Docker).
const connectDB = async () => {
  if (!config.mongoUri) {
    throw new Error('[mongo] MONGO_URI is not set. Add it to your .env file.');
  }

  await mongoose.connect(config.mongoUri);
  console.log(`[mongo] connected to ${mongoose.connection.name}`);

  mongoose.connection.on('error', (err) => {
    console.error('[mongo] connection error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[mongo] disconnected');
  });
};

module.exports = connectDB;
```

- [ ] **Step 3: Smoke check (syntactic — does not connect)**

```bash
node -e "const c = require('./src/config/db'); console.log(typeof c);"
```
Expected: prints `function`.

- [ ] **Step 4: Commit**

```bash
git add src/config/db.js
git commit -m "feat(config): add MongoDB connection with event logging"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Mongo connection module ready (not yet wired into the server). Proceed to error utilities and middleware (Task 6)?"
Wait for go-ahead.

---

## Task 6: Error class + error middleware + 404 middleware

**Files:**
- Create: `src/utils/ApiError.js`
- Create: `src/middleware/errorHandler.js`
- Create: `src/middleware/notFound.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create three small files: a custom error class and two middlewares (404 + central error handler). All three commit together since they're tightly coupled. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create `src/utils/ApiError.js`**

```js
// Lightweight error class so controllers can throw structured errors
// that the central error handler translates into HTTP responses.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
```

- [ ] **Step 3: Create `src/middleware/errorHandler.js`**

```js
const config = require('../config');

// Centralized async-aware error handler. Must be registered LAST in app.js.
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const statusCode =
    err.statusCode && Number.isInteger(err.statusCode) ? err.statusCode : 500;

  const payload = {
    status: 'error',
    message: err.message || 'Internal Server Error',
  };

  // Include stack trace in development for easier debugging.
  if (config.env === 'development' && err.stack) {
    payload.stack = err.stack;
  }

  res.status(statusCode).json(payload);
};
```

- [ ] **Step 4: Create `src/middleware/notFound.js`**

```js
const ApiError = require('../utils/ApiError');

// 404 fallback — register after all routes, before the error handler.
module.exports = (req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
};
```

- [ ] **Step 5: Smoke check all three files load**

```bash
node -e "
  const ApiError = require('./src/utils/ApiError');
  const errorHandler = require('./src/middleware/errorHandler');
  const notFound = require('./src/middleware/notFound');
  const e = new ApiError(404, 'test');
  console.log('ApiError:', e.statusCode, e.message);
  console.log('errorHandler type:', typeof errorHandler);
  console.log('notFound type:', typeof notFound);
"
```
Expected:
```
ApiError: 404 test
errorHandler type: function
notFound type: function
```

- [ ] **Step 6: Commit**

```bash
git add src/utils/ApiError.js src/middleware/errorHandler.js src/middleware/notFound.js
git commit -m "feat(middleware): add ApiError class, central error handler, and 404 fallback"
```

- [ ] **Step 7: Summarize + pause**

Tell the user: "Error class + 404 + central error handler in place. Proceed to the health route (Task 7)?"
Wait for go-ahead.

---

## Task 7: Health route

**Files:**
- Create: `src/routes/health.routes.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/routes/health.routes.js` — defines `GET /` returning `{ status: 'ok', ... }`. Mounted at `/api/health` in app.js next. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/routes/health.routes.js`

```js
const express = require('express');
const config = require('../config');

const router = express.Router();

// GET /api/health — boot sanity check.
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    env: config.env,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
```

- [ ] **Step 3: Smoke check**

```bash
node -e "const r = require('./src/routes/health.routes'); console.log('router stack length:', r.stack.length);"
```
Expected: `router stack length: 1`.

- [ ] **Step 4: Commit**

```bash
git add src/routes/health.routes.js
git commit -m "feat(routes): add GET /api/health route"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Health route ready. Proceed to Express app wiring (Task 8)?"
Wait for go-ahead.

---

## Task 8: Express app wiring (app.js)

**Files:**
- Create: `src/app.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/app.js` — Express app with JSON body parser, CORS, the health route, and the 404 + error middlewares. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/app.js`

```js
const express = require('express');
const cors = require('cors');

const config = require('./config');
const healthRoutes = require('./routes/health.routes');
const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Core middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: config.cors.origin.length ? config.cors.origin : '*',
    credentials: true,
  })
);

// Routes
app.use('/api/health', healthRoutes);

// 404 + central error handler — must come LAST.
app.use(notFound);
app.use(errorHandler);

module.exports = app;
```

- [ ] **Step 3: Smoke check**

```bash
node -e "require('dotenv').config(); const a = require('./src/app'); console.log('app type:', typeof a, 'listen?', typeof a.listen);"
```
Expected: `app type: function listen? function`.

- [ ] **Step 4: Commit**

```bash
git add src/app.js
git commit -m "feat(app): wire Express app with JSON, CORS, health route, and error handling"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Express app wired (not started yet — no DB connection). Proceed to the server boot script (Task 9)?"
Wait for go-ahead.

---

## Task 9: Server entry (server.js)

**Files:**
- Create: `src/server.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/server.js` — loads .env, connects DB, then `app.listen`. After this we can boot for the first time. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/server.js`

```js
// Load env FIRST so all subsequent requires see process.env values.
require('dotenv').config();

const app = require('./app');
const config = require('./config');
const connectDB = require('./config/db');

const start = async () => {
  try {
    await connectDB();
    app.listen(config.port, () => {
      console.log(`[server] listening on :${config.port} (${config.env})`);
    });
  } catch (err) {
    console.error('[server] failed to start:', err.message);
    process.exit(1);
  }
};

start();
```

- [ ] **Step 3: First boot — verify the server starts and the health route works**

Prerequisite: a MongoDB instance is reachable at the URI in `.env`. If using local Mongo, ensure it is running (`mongod` or `systemctl status mongod`).

Run in one terminal:
```bash
npm run dev
```
Expected console output (in order):
```
[mongo] connected to tuition_finder
[server] listening on :5000 (development)
```

In a second terminal:
```bash
curl -s http://localhost:5000/api/health | node -e "let d=''; process.stdin.on('data',c=>d+=c).on('end',()=>console.log(JSON.parse(d)))"
```
Expected: a JSON object like `{ status: 'ok', uptime: <number>, env: 'development', timestamp: '...' }`.

Then `Ctrl+C` the server. Confirm you see `[mongo] disconnected` before the prompt returns.

- [ ] **Step 4: Verify 404 + error middleware**

Restart `npm run dev`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/api/nonexistent
```
Expected: `404`.

Stop the server.

- [ ] **Step 5: Commit**

```bash
git add src/server.js
git commit -m "feat(server): add boot script that loads env, connects DB, and listens"
```

- [ ] **Step 6: Summarize + pause**

Tell the user: "Server boots, Mongo connects, `/api/health` returns 200, unknown routes return 404. The scaffolding half of Phase 1 is done. Proceed to the models (Task 10)?"
Wait for go-ahead.

---

## Task 10: User model

**Files:**
- Create: `src/models/User.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/models/User.js` — fields per spec, no bcrypt hook (deferred to Phase 2). Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/models/User.js`

```js
const mongoose = require('mongoose');

// Basic email validation regex (RFC 5322 simplified — good enough for app-level validation).
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // not returned by default
    },
    phone: { type: String, trim: true },
    role: {
      type: String,
      enum: ['student', 'owner', 'admin'],
      default: 'student',
    },
    profileImage: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// `email` already has unique via field option; explicit index on role for admin queries.
userSchema.index({ role: 1 });

// NOTE: bcrypt pre-save hashing hook is intentionally deferred to Phase 2
// (added with /auth/register and /auth/login endpoints).

module.exports = mongoose.model('User', userSchema);
```

- [ ] **Step 3: Smoke check — model loads and validates**

```bash
node -e "
  const mongoose = require('mongoose');
  const User = require('./src/models/User');
  const ok = new User({ name: 'A', email: 'a@b.com', password: 'secret123' });
  ok.validate().then(() => console.log('valid doc OK'));
  const bad = new User({});
  bad.validate().catch(e => console.log('invalid doc errors:', Object.keys(e.errors)));
"
```
Expected:
```
valid doc OK
invalid doc errors: [ 'name', 'email', 'password' ]
```

- [ ] **Step 4: Commit**

```bash
git add src/models/User.js
git commit -m "feat(models): add User schema with role-based access fields"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "User model done. Proceed to Subject (Task 11)?"
Wait for go-ahead.

---

## Task 11: Subject model

**Files:**
- Create: `src/models/Subject.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/models/Subject.js` — name + auto-slug + category. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/models/Subject.js`

```js
const mongoose = require('mongoose');

// Simple slugifier — lowercase, alnum + hyphen only.
const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Subject name is required'],
      unique: true,
      trim: true,
    },
    slug: { type: String, unique: true, lowercase: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Derive slug from name before validation, so the unique check sees the final value.
subjectSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
});

subjectSchema.index({ category: 1 });

module.exports = mongoose.model('Subject', subjectSchema);
```

- [ ] **Step 3: Smoke check**

```bash
node -e "
  const Subject = require('./src/models/Subject');
  const s = new Subject({ name: 'Mathematics' });
  s.validate().then(() => console.log('slug:', s.slug));
"
```
Expected: `slug: mathematics`.

- [ ] **Step 4: Commit**

```bash
git add src/models/Subject.js
git commit -m "feat(models): add Subject schema with auto-slug"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Subject model done. Proceed to the big one — CoachingCenter (Task 12)?"
Wait for go-ahead.

---

## Task 12: CoachingCenter model

**Files:**
- Create: `src/models/CoachingCenter.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/models/CoachingCenter.js` — large schema with GeoJSON location (2dsphere index), text index, multikey indexes, structured timings, fees, denormalized rating fields. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/models/CoachingCenter.js`

```js
const mongoose = require('mongoose');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/; // 'HH:MM' 24-hour

const slugify = (str) =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

// GeoJSON Point sub-schema — paired with a 2dsphere index below.
const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON convention
      required: true,
      validate: {
        validator: (v) => Array.isArray(v) && v.length === 2,
        message: 'Coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false }
);

// Per-day timing entry. closed=true overrides openTime/closeTime.
const timingSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: true,
    },
    openTime: { type: String, match: TIME_REGEX },
    closeTime: { type: String, match: TIME_REGEX },
    closed: { type: Boolean, default: false },
  },
  { _id: false }
);

const coachingCenterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, trim: true },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    address: { type: String, required: true, trim: true },
    location: { type: pointSchema, required: true },
    area: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: 'India', trim: true },
    phone: { type: String, required: true, trim: true },
    alternatePhone: { type: String, trim: true },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please provide a valid email'],
    },
    website: { type: String, trim: true },
    subjectsOffered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Subject' }],
    boards: [
      {
        type: String,
        enum: ['CBSE', 'ICSE', 'State', 'IB', 'IGCSE', 'Other'],
      },
    ],
    classRange: {
      from: { type: Number, min: 1, max: 12 },
      to: { type: Number, min: 1, max: 12 },
    },
    fees: {
      min: { type: Number, min: 0 },
      max: { type: Number, min: 0 },
      currency: { type: String, default: 'INR', trim: true },
    },
    timings: [timingSchema],
    profileImage: { type: String, default: '' },
    bannerImage: { type: String, default: '' },
    gallery: [{ type: String }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    // Denormalized rating fields — kept in sync by Review hooks (see ADR-0004).
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

// Derive slug from name + city; suffix with a short random string to avoid
// collisions across centers with the same name in the same city.
coachingCenterSchema.pre('validate', function (next) {
  if (this.isModified('name') || this.isModified('city') || !this.slug) {
    const base = slugify(`${this.name}-${this.city || ''}`);
    const suffix = Math.random().toString(36).slice(2, 6);
    this.slug = `${base}-${suffix}`;
  }
  next();
});

// Indexes — see ADR-0001 (geo) and the spec's Indexes table.
coachingCenterSchema.index({ location: '2dsphere' });
coachingCenterSchema.index({ name: 'text', description: 'text', area: 'text' });
coachingCenterSchema.index({ owner: 1 });
coachingCenterSchema.index({ subjectsOffered: 1 });
coachingCenterSchema.index({ city: 1, isActive: 1, isVerified: 1 });
coachingCenterSchema.index({ averageRating: -1 });

module.exports = mongoose.model('CoachingCenter', coachingCenterSchema);
```

- [ ] **Step 3: Smoke check**

```bash
node -e "
  const mongoose = require('mongoose');
  const CC = require('./src/models/CoachingCenter');
  const c = new CC({
    name: 'Test Coaching',
    owner: new mongoose.Types.ObjectId(),
    address: '123 Main St',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    city: 'Mumbai', state: 'MH', pincode: '400001', phone: '9999999999'
  });
  c.validate().then(() => console.log('valid; slug:', c.slug));
"
```
Expected: `valid; slug: test-coaching-mumbai-<random>`.

- [ ] **Step 4: Commit**

```bash
git add src/models/CoachingCenter.js
git commit -m "feat(models): add CoachingCenter with GeoJSON location and search indexes"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "CoachingCenter model done — includes 2dsphere, text, and compound indexes. Proceed to Review (Task 13)?"
Wait for go-ahead.

---

## Task 13: Review model + denormalization hooks

**Files:**
- Create: `src/models/Review.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/models/Review.js` — includes the `recalcStats` static and post-save/update/delete hooks that keep `CoachingCenter.averageRating` and `totalReviews` in sync (ADR-0004). Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/models/Review.js`

```js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    coachingCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// One review per student per coaching center.
reviewSchema.index({ coachingCenter: 1, student: 1 }, { unique: true });

// Recompute the denormalized fields on the parent CoachingCenter.
// Called by the hooks below whenever a review is written/updated/deleted.
reviewSchema.statics.recalcStats = async function (centerId) {
  if (!centerId) return;
  const CoachingCenter = mongoose.model('CoachingCenter');

  const stats = await this.aggregate([
    { $match: { coachingCenter: centerId } },
    {
      $group: {
        _id: '$coachingCenter',
        avg: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
  ]);

  const { avg = 0, count = 0 } = stats[0] || {};
  await CoachingCenter.findByIdAndUpdate(centerId, {
    averageRating: Math.round(avg * 10) / 10, // 1-decimal precision
    totalReviews: count,
  });
};

// Document middleware — fires on Review.create / new Review().save().
reviewSchema.post('save', async function () {
  await this.constructor.recalcStats(this.coachingCenter);
});

// Query middleware — fires on findOneAndUpdate / findByIdAndUpdate.
reviewSchema.post('findOneAndUpdate', async function (doc) {
  if (doc) await mongoose.model('Review').recalcStats(doc.coachingCenter);
});

// Query middleware — fires on findOneAndDelete / findByIdAndDelete.
reviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) await mongoose.model('Review').recalcStats(doc.coachingCenter);
});

module.exports = mongoose.model('Review', reviewSchema);
```

- [ ] **Step 3: Smoke check**

```bash
node -e "
  const mongoose = require('mongoose');
  const Review = require('./src/models/Review');
  const r = new Review({
    coachingCenter: new mongoose.Types.ObjectId(),
    student: new mongoose.Types.ObjectId(),
    rating: 5
  });
  r.validate().then(() => console.log('valid; recalcStats type:', typeof Review.recalcStats));
"
```
Expected: `valid; recalcStats type: function`.

- [ ] **Step 4: Commit**

```bash
git add src/models/Review.js
git commit -m "feat(models): add Review schema with denormalization hooks for center rating"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "Review model done with denormalization hooks. Proceed to Enquiry (Task 14)?"
Wait for go-ahead.

---

## Task 14: Enquiry model

**Files:**
- Create: `src/models/Enquiry.js`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `src/models/Enquiry.js` — student-to-center messages with status workflow. Login required (no anonymous in Phase 1). Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

Path: `src/models/Enquiry.js`

```js
const mongoose = require('mongoose');

const enquirySchema = new mongoose.Schema(
  {
    coachingCenter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoachingCenter',
      required: true,
    },
    // Phase 1 requires login — anonymous enquiries are out of scope.
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject' },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['new', 'contacted', 'closed'],
      default: 'new',
    },
    ownerNotes: { type: String, trim: true }, // private — only center owner sees
  },
  { timestamps: true }
);

enquirySchema.index({ student: 1 });
enquirySchema.index({ coachingCenter: 1, status: 1 });

module.exports = mongoose.model('Enquiry', enquirySchema);
```

- [ ] **Step 3: Smoke check**

```bash
node -e "
  const mongoose = require('mongoose');
  const Enquiry = require('./src/models/Enquiry');
  const e = new Enquiry({
    coachingCenter: new mongoose.Types.ObjectId(),
    student: new mongoose.Types.ObjectId(),
    message: 'When does the next batch start?'
  });
  e.validate().then(() => console.log('valid; status:', e.status));
"
```
Expected: `valid; status: new`.

- [ ] **Step 4: Commit**

```bash
git add src/models/Enquiry.js
git commit -m "feat(models): add Enquiry schema with status workflow"
```

- [ ] **Step 5: Summarize + pause**

Tell the user: "All five schemas done. Proceed to track-keeping files — ADRs, Task.md, README (Task 15)?"
Wait for go-ahead.

---

## Task 15: Decision logs (ADRs)

**Files:**
- Create: `decisions/0001-geolocation-geojson.md`
- Create: `decisions/0002-subject-as-reference.md`
- Create: `decisions/0003-owner-center-cardinality.md`
- Create: `decisions/0004-rating-denormalization.md`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create the `decisions/` folder and the four ADR files locking in the design choices. All four commit together. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create directory**

```bash
mkdir -p decisions
```

- [ ] **Step 3: Create `decisions/0001-geolocation-geojson.md`**

```markdown
# ADR-0001: Store coaching center location as GeoJSON Point with 2dsphere index

**Status:** Accepted (2026-05-20)

## Context

Students need to find coaching centers "near me" — within X km of their current location or a chosen pin. Without an indexed geospatial type, every "near me" request would require scanning all centers and computing distance in JS, which is O(n) per request and not viable as the dataset grows.

## Decision

Store `CoachingCenter.location` as a GeoJSON Point:

```js
{
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: [lng, lat]
}
```

Apply a `2dsphere` index on the field.

## Consequences

- MongoDB-native `$near` / `$geoWithin` operators become available in Phase 2 search endpoints.
- Coordinates are `[lng, lat]` (GeoJSON convention), not `[lat, lng]` — must be consistent in clients and seeders.
- Slightly more storage than plain numbers, but negligible at this scale.
```

- [ ] **Step 4: Create `decisions/0002-subject-as-reference.md`**

```markdown
# ADR-0002: Subject is its own collection; CoachingCenter references it via ObjectId

**Status:** Accepted (2026-05-20)

## Context

A CoachingCenter offers multiple subjects (Math, Physics, English, ...). Embedding these as a free-text string array opens the door to duplicates like `Math`/`Maths`/`Mathematics` and breaks filtering precision.

## Decision

`Subject` is a separate collection, admin-curated. `CoachingCenter.subjectsOffered` is an array of `ObjectId` references.

## Consequences

- Search-by-subject is a clean indexed lookup (`{ subjectsOffered: { $in: [...] } }`).
- Adding a new subject is an admin action, not a side-effect of any user creating a center.
- A `populate()` is needed when returning subject names alongside a center.
- An initial subject list seeder belongs in Phase 2.
```

- [ ] **Step 5: Create `decisions/0003-owner-center-cardinality.md`**

```markdown
# ADR-0003: One owner can manage many coaching centers (no uniqueness constraint)

**Status:** Accepted (2026-05-20)

## Context

Owners may run multiple branches or franchise centers. Enforcing 1:1 (owner:center) limits real-world use without functional benefit.

## Decision

`CoachingCenter.owner` references `User`, with no uniqueness constraint. One owner can have N centers.

## Consequences

- Owner dashboards must support listing multiple centers.
- Permission checks gate per-center actions on the matching `owner` field.
- If product policy ever requires 1:1, a unique partial index can be added later without a schema change.
```

- [ ] **Step 6: Create `decisions/0004-rating-denormalization.md`**

```markdown
# ADR-0004: Cache averageRating + totalReviews on CoachingCenter, kept in sync via Review hooks

**Status:** Accepted (2026-05-20)

## Context

Phase 2 search and listing endpoints need "sort by rating" and per-card rating display. Computing the average per request via aggregation over `Review` is O(reviews-per-center) and slows down listing endpoints at scale.

## Decision

Store `averageRating` and `totalReviews` directly on `CoachingCenter`. Keep them in sync via `Review` post-save / post-findOneAndUpdate / post-findOneAndDelete hooks, using a `Review.recalcStats(centerId)` static that runs the aggregation only when reviews change.

## Consequences

- Listing endpoints stay fast (single index hit on `averageRating: -1`).
- Updates to reviews trigger one aggregation per affected center — acceptable, because reviews change rarely compared to reads.
- Hooks live on the `Review` model — anyone changing review semantics must keep the recalc logic consistent.
- Direct DB writes that bypass the Mongoose Review model (e.g., bulk imports) must call `recalcStats` manually.
```

- [ ] **Step 7: Commit**

```bash
git add decisions/
git commit -m "docs: add ADRs 0001-0004 capturing locked-in Phase 1 design decisions"
```

- [ ] **Step 8: Summarize + pause**

Tell the user: "ADRs written. Proceed to Task.md (Task 16)?"
Wait for go-ahead.

---

## Task 16: Task.md tracker

**Files:**
- Create: `Task.md`

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to create `Task.md` — top-level task tracker with Phase 1 status and Phase 2 outline for context management. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Create the file**

```markdown
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
- [x] End-to-end verification (boot + health + DB)

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
```

- [ ] **Step 3: Commit**

```bash
git add Task.md
git commit -m "docs: add top-level Task.md tracker for Phase 1 status and Phase 2 outline"
```

- [ ] **Step 4: Summarize + pause**

Tell the user: "Task.md committed. Proceed to README (Task 17)?"
Wait for go-ahead.

---

## Task 17: README.md

**Files:**
- Create: `README.md` (overwrite existing one-liner)

- [ ] **Step 1: Pause — confirm**

Tell the user: "About to overwrite the current one-line `README.md` with a real project overview + quick-start. Proceed?"
Wait for go-ahead.

- [ ] **Step 2: Replace `README.md`**

```markdown
# Tuition Finder — Server

Backend for the Tuition Finder platform. Coaching center owners list institutes; students discover, search, and contact them.

## Stack

- Node.js + Express
- MongoDB + Mongoose (8+)
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

Phase 1 (scaffolding + schemas): see `Task.md`.
Phase 2 (auth, CRUD, search): planned.
```

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: replace placeholder README with project overview and quick-start"
```

- [ ] **Step 4: Summarize + pause**

Tell the user: "README replaced. Final task next — end-to-end verification (Task 18). Proceed?"
Wait for go-ahead.

---

## Task 18: End-to-end verification

**Files:** none created — this task only runs checks against what's already built.

- [ ] **Step 1: Verify file structure**

```bash
ls src/config src/models src/middleware src/routes src/utils
ls -la .env .env.example .gitignore package.json README.md Task.md
ls decisions/
```
Expected: all directories listed contain the expected files (5 models, 2 middleware files, etc.); top-level files all present; `decisions/` has 0001–0004.

- [ ] **Step 2: Verify all models load and validate together (catches cross-model issues)**

```bash
node -e "
  require('dotenv').config();
  const mongoose = require('mongoose');
  require('./src/models/User');
  require('./src/models/Subject');
  require('./src/models/CoachingCenter');
  require('./src/models/Review');
  require('./src/models/Enquiry');
  console.log('models loaded:', Object.keys(mongoose.models));
"
```
Expected: `models loaded: [ 'User', 'Subject', 'CoachingCenter', 'Review', 'Enquiry' ]`.

- [ ] **Step 3: Boot the server and verify Mongo connection**

```bash
npm run dev
```
Expected console output:
```
[mongo] connected to tuition_finder
[server] listening on :5000 (development)
```

- [ ] **Step 4: Health route returns 200**

In a second terminal:
```bash
curl -s -w "\n%{http_code}\n" http://localhost:5000/api/health
```
Expected: JSON body with `status: "ok"`, followed by `200`.

- [ ] **Step 5: Unknown route returns 404 via error middleware**

```bash
curl -s -w "\n%{http_code}\n" http://localhost:5000/api/does-not-exist
```
Expected: JSON body `{"status":"error","message":"Route not found: GET /api/does-not-exist", ...}` and `404`.

- [ ] **Step 6: Indexes get created on a model — sanity check via Mongo shell or Compass**

Optional but recommended. With the dev server still running (which loads all models), in a third terminal:

```bash
mongosh --quiet --eval "use tuition_finder; db.coachingcenters.getIndexes()" 2>/dev/null || \
  echo "mongosh not installed — verify indexes via MongoDB Compass instead"
```

If `mongosh` is installed, expected output includes `_id_`, a `2dsphere` index on `location`, a text index, multikey on `subjectsOffered`, and the compound `city_1_isActive_1_isVerified_1`. Note: indexes are created lazily on first interaction; if none show, insert a single test doc via:

```bash
mongosh --quiet --eval "
  use tuition_finder;
  db.users.insertOne({ name: 'seed', email: 'seed@example.com', password: 'seed123', role: 'student' });
  db.users.getIndexes();
"
```

- [ ] **Step 7: Misconfig fail-fast**

Stop the server. Comment out `MONGO_URI` in `.env`. Run `npm run dev`. Expected:
```
[server] failed to start: [mongo] MONGO_URI is not set. Add it to your .env file.
```
Process exits with code 1. Restore `MONGO_URI` afterward.

- [ ] **Step 8: Graceful shutdown**

Start the server again. Press `Ctrl+C`. Expected: `[mongo] disconnected` appears before the prompt returns.

- [ ] **Step 9: Final commit (only if any drift was found and fixed during verification)**

If steps 1–8 all passed unchanged, skip this step. Otherwise, commit any small fixes with a descriptive message such as:

```bash
git add <files>
git commit -m "fix(verify): <what was fixed during verification>"
```

- [ ] **Step 10: Final summary to user**

Report to the user:
> Phase 1 is complete. End-to-end verification passed: server boots, MongoDB connects, `/api/health` returns 200, unknown routes return 404 via the error middleware, all five models load with their indexes registered, misconfig fails fast, and shutdown is graceful.
>
> Next: Phase 2 — auth APIs, CoachingCenter CRUD, search/filter. Want me to brainstorm Phase 2 now, or pause here?

---

## Self-Review (against the spec)

**Spec coverage:**
- ✅ Project structure (Task 1–9 builds it exactly per spec)
- ✅ Phase 1 dependencies (Task 2)
- ✅ Env config + .env.example + .env (Task 3)
- ✅ Central config object (Task 4)
- ✅ Mongoose connection with fail-fast (Task 5)
- ✅ ApiError + error middleware + notFound (Task 6)
- ✅ `/api/health` route (Task 7)
- ✅ Express app wiring (Task 8)
- ✅ Server entry with proper boot order (Task 9)
- ✅ User schema (Task 10) — all fields from spec, bcrypt deferred
- ✅ Subject schema with auto-slug (Task 11)
- ✅ CoachingCenter schema with GeoJSON + all required indexes (Task 12)
- ✅ Review schema with `recalcStats` + three hooks (Task 13)
- ✅ Enquiry schema with login-required (Task 14)
- ✅ ADRs 0001–0004 (Task 15)
- ✅ Task.md (Task 16)
- ✅ README (Task 17)
- ✅ All 7 verification points from the spec (Task 18)

**Placeholder scan:** No "TBD", "TODO", "implement later", or hand-wavy "add appropriate X" language found.

**Type/identifier consistency:**
- `Review.recalcStats(centerId)` referenced consistently in Task 13's hooks and ADR-0004.
- `CoachingCenter.averageRating` and `CoachingCenter.totalReviews` field names match between Task 12 (definition) and Task 13 (writes via recalcStats).
- `pointSchema` / `timingSchema` used only locally inside `CoachingCenter.js` — no cross-task references to drift.
- All file paths in tasks match the structure in Task 1's `package.json` `main` field (`src/server.js`).
