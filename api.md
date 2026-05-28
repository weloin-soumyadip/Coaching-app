# Coaching App — API Reference

> REST API documentation for the Coaching App backend.
> Base URL (dev): `http://localhost:5000`
> All request and response bodies are `application/json` unless otherwise noted.

---

## Table of contents

1. [Conventions](#conventions)
2. [Authentication](#authentication)
   - [POST /api/auth/register](#post-apiauthregister)
   - [POST /api/auth/login](#post-apiauthlogin)
   - [POST /api/auth/refresh](#post-apiauthrefresh)
   - [POST /api/auth/logout](#post-apiauthlogout)
   - [GET /api/auth/me](#get-apiauthme)

---

## Conventions

### Auth model

The API uses a **two-token** auth model:

| Token | Lifetime | Where it lives | Purpose |
|---|---|---|---|
| Access JWT | 15 min (default) | JSON body field `token`, sent back as `Authorization: Bearer <token>` | Authorizes protected endpoints |
| Refresh JWT | 7 days (default) | **Both** JSON body field `refreshToken` **and** HTTP-only `refreshToken` cookie at `Path=/api/auth` | Issues new access tokens via `/api/auth/refresh` |

Clients must:
- Store the access token in memory and send it as `Authorization: Bearer <token>` on protected endpoints.
- For browser clients: do nothing — the `refreshToken` cookie is sent automatically and `/api/auth/refresh` will read it.
- For mobile / CLI clients: capture the `refreshToken` field from the JSON body, persist it in secure storage, and send it on `/api/auth/refresh` by attaching a `Cookie: refreshToken=<value>` header (the endpoint reads the cookie, not a body field).

Refresh-token cookie attributes:

```
HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=604800; Secure (in production)
```

> **Security note.** Returning the refresh token in the response body makes it readable by any JavaScript on the page, which means an XSS bug could exfiltrate it — something the HTTP-only cookie alone would have prevented. The body value exists for non-browser clients; browser apps should ignore it and rely on the cookie.

### User types

Every auth endpoint requires a `userType` field. The four roles map to four separate collections:

| `userType` | Collection | Registerable? |
|---|---|---|
| `owner` | `owners` | Yes |
| `teacher` | `teachers` | Yes |
| `student` | `students` | Yes |
| `admin` | `admins` | No — created via `npm run seed:admin` or `POST /api/admin/admins` |

### Standard response shapes

**Success** — varies per endpoint (documented below).

**Error** — every non-2xx response follows this shape:

```json
{
  "status": "error",
  "message": "Human-readable description"
}
```

In `development`, the response also includes a `stack` field. Status code is in the HTTP status line.

### Common error codes

| Status | Meaning |
|---|---|
| `400` | Malformed body, missing required fields, or invalid `userType` |
| `401` | Missing / invalid / expired token, or wrong credentials |
| `409` | Email already registered (possibly under a different role) |
| `500` | Unexpected server error |

---

## Authentication

All authentication endpoints live under `/api/auth`. Registration and login are public; `me` requires a valid access token; `refresh` and `logout` require the refresh cookie.

---

### POST /api/auth/register

Creates a new `owner`, `teacher`, or `student` account, returns an access token, and sets the refresh-token cookie. Admins cannot self-register — use the seed script or admin moderation endpoints.

**Auth:** none (public).

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `userType` | `"owner" \| "teacher" \| "student"` | yes | `admin` is rejected with 400. |
| `name` | string | yes | Trimmed. |
| `email` | string | yes | Lowercased, trimmed, must match `[^\s@]+@[^\s@]+\.[^\s@]+`. Unique across **all** role collections. |
| `password` | string | yes | Minimum 6 chars. Hashed with bcrypt (12 rounds) before storage. |
| `phone` | string | no | Trimmed. |

**Example request**

```bash
curl -s -c jar.txt -X POST http://localhost:5000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{
    "userType": "owner",
    "name": "Alice",
    "email": "alice@example.com",
    "password": "secret123",
    "phone": "+919999999999"
  }'
```

**Success response — `201 Created`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "67234c0e7e1c0a4d5f6a7b8c",
    "name": "Alice",
    "email": "alice@example.com",
    "phone": "+919999999999",
    "profileImage": "",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2026-05-28T10:00:00.000Z",
    "updatedAt": "2026-05-28T10:00:00.000Z"
  }
}
```

`refreshToken` in the body is the **same** token that is set in the `Set-Cookie: refreshToken=...; HttpOnly; SameSite=Strict; Path=/api/auth; Max-Age=604800` header. Use one or the other depending on client type — see [Conventions → Auth model](#auth-model).

> The `user` object's shape varies by role (teachers include `bio`, `subjects`, `feesRange`, etc.; students include `currentClass`, `board`; admins include `permissions[]`). The `password` field is always stripped from responses.

**Error responses**

| Status | `message` | Cause |
|---|---|---|
| `400` | `userType must be one of: owner, teacher, student` | Missing or admin/unknown userType. |
| `400` | `name, email, and password are required` | Any of the three missing. |
| `400` | Mongoose validation error (e.g. `Password must be at least 6 characters`) | Body fails model-level validation. |
| `409` | `Email already registered as <role>` | Email exists in any role collection. |

---

### POST /api/auth/login

Verifies credentials, returns an access token, and sets the refresh-token cookie. Works for all four roles.

**Auth:** none (public).

**Request body**

| Field | Type | Required | Notes |
|---|---|---|---|
| `userType` | `"owner" \| "teacher" \| "student" \| "admin"` | yes | |
| `email` | string | yes | Lowercased + trimmed before lookup. |
| `password` | string | yes | |

**Example request**

```bash
curl -s -c jar.txt -X POST http://localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{
    "userType": "owner",
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

**Success response — `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "67234c0e7e1c0a4d5f6a7b8c",
    "name": "Alice",
    "email": "alice@example.com",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2026-05-28T10:00:00.000Z",
    "updatedAt": "2026-05-28T10:00:00.000Z"
  }
}
```

The same refresh token is also set as a `refreshToken` cookie. For admins, `lastLoginAt` is bumped on the server.

**Error responses**

| Status | `message` | Cause |
|---|---|---|
| `400` | `userType must be one of: owner, teacher, student, admin` | Missing or unknown userType. |
| `400` | `email and password are required` | Either missing. |
| `401` | `Invalid credentials` | No user with that email in the given role collection, **or** password mismatch. (Same message — deliberate, to avoid email enumeration.) |
| `401` | `Account is deactivated` | User exists but `isActive=false`. |

---

### POST /api/auth/refresh

Rotates the refresh token and returns a new access token. The presented refresh JTI is single-use — once rotated, replaying it is treated as a stolen-token incident and **revokes the entire token family** (the user must re-login).

**Auth:** `refreshToken` cookie (no Bearer needed).

**Request body:** none.

**Example request**

```bash
curl -s -b jar.txt -c jar.txt -X POST http://localhost:5000/api/auth/refresh
```

**Success response — `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

The returned `refreshToken` has a **new JTI** (different from the one you sent) and belongs to the same family. The same value is also set as a `refreshToken` cookie. Discard the old refresh token immediately — replaying it will trip reuse detection and revoke the whole family.

**Error responses**

| Status | `message` | Cause |
|---|---|---|
| `401` | `Missing refresh token` | No `refreshToken` cookie on the request. |
| `401` | `Invalid or expired refresh token` | Bad signature, expired, already-rotated (reuse → family revoked), or family previously revoked. The cookie is cleared. |

> When a rotated JTI is replayed, the server **also revokes all sibling JTIs in the same family** and logs the event at WARN with `{jti, family, sub}`. The legitimate user must log in again.

---

### POST /api/auth/logout

Revokes the current refresh JTI in Redis and clears the cookie. Idempotent — calling with no cookie or an invalid cookie still returns `204` and clears any cookie present.

> This logs out **only the current session/device**. To log out every device (e.g. after a password change), use `POST /api/{role}/me/password` — that revokes the entire family.

**Auth:** `refreshToken` cookie (optional — endpoint is idempotent).

**Request body:** none.

**Example request**

```bash
curl -s -b jar.txt -c jar.txt -X POST http://localhost:5000/api/auth/logout
```

**Success response — `204 No Content`**

Empty body. `Set-Cookie: refreshToken=; Path=/api/auth; Expires=Thu, 01 Jan 1970 00:00:00 GMT` clears the cookie.

**Error responses:** none under normal use.

---

### GET /api/auth/me

Returns the currently authenticated user, identified by the access token.

**Auth:** `Authorization: Bearer <access-token>` header.

**Example request**

```bash
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"userType":"owner","email":"alice@example.com","password":"secret123"}' | jq -r .token)

curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Success response — `200 OK`**

```json
{
  "userType": "owner",
  "user": {
    "_id": "67234c0e7e1c0a4d5f6a7b8c",
    "name": "Alice",
    "email": "alice@example.com",
    "phone": "+919999999999",
    "profileImage": "",
    "isActive": true,
    "isEmailVerified": false,
    "createdAt": "2026-05-28T10:00:00.000Z",
    "updatedAt": "2026-05-28T10:00:00.000Z"
  }
}
```

`userType` is one of `owner`, `teacher`, `student`, `admin`. The `user` payload shape matches the underlying role document (with `password` stripped).

**Error responses**

| Status | `message` | Cause |
|---|---|---|
| `401` | `Not authenticated` / `Invalid token` / `Token expired` | Missing, malformed, expired, or wrong-secret access token. |
| `401` | `Account is deactivated` | The user record exists but `isActive=false`. |

---

## End-to-end flow (cheat sheet)

```bash
# 1. Register (sets refresh cookie, returns access token)
curl -s -c jar.txt -X POST http://localhost:5000/api/auth/register \
  -H 'content-type: application/json' \
  -d '{"userType":"owner","name":"Alice","email":"alice@x.com","password":"secret123"}'

# 2. Login (same — refreshes cookie + access token)
curl -s -c jar.txt -X POST http://localhost:5000/api/auth/login \
  -H 'content-type: application/json' \
  -d '{"userType":"owner","email":"alice@x.com","password":"secret123"}'

# 3. Use access token on protected endpoints
curl -s http://localhost:5000/api/auth/me -H "Authorization: Bearer $TOKEN"

# 4. Rotate access token via refresh cookie
curl -s -b jar.txt -c jar.txt -X POST http://localhost:5000/api/auth/refresh

# 5. Logout (revokes current JTI, clears cookie)
curl -s -b jar.txt -c jar.txt -X POST http://localhost:5000/api/auth/logout
```

---

> Next sections (profile self-management, admin moderation, public teacher profile, etc.) will be added as documentation is expanded. See `task.md` §9 for the full endpoint list already available on the server.
