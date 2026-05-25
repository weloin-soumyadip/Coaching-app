import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import redis from '../redis.js';
import { issueRefresh, verifyRefresh, type UserType } from './jwt.js';
import logger from '../logger.js';

// Redis key layout:
//   rt:jti:<jti>             → familyId (string)        TTL = refresh-token expiry
//   rt:family:<fam>          → Set<jti>                 TTL = refresh-token expiry
//   rt:user:<sub>:families   → Set<familyId>            TTL = refresh-token expiry
//
// Family tracking enables reuse detection. The user→families index enables
// per-user revocation (password change, self-delete, admin deactivate).

const jtiKey = (jti: string) => `rt:jti:${jti}`;
const familyKey = (family: string) => `rt:family:${family}`;
const userFamiliesKey = (sub: string) => `rt:user:${sub}:families`;

const ttlSecondsFromToken = (token: string): number => {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  if (!decoded?.exp) {
    throw new Error('[refreshTokens] cannot derive TTL — missing exp claim');
  }
  return Math.max(1, decoded.exp - Math.floor(Date.now() / 1000));
};

export interface IssuedRefresh {
  token: string;
  jti: string;
  family: string;
  expiresInSec: number;
}

/** First-time issue (login / register / post-password-change re-issue). Starts a new family. */
export async function issueNewRefresh(
  sub: string,
  userType: UserType,
): Promise<IssuedRefresh> {
  const family = randomUUID();
  const issued = await issueIntoFamily(sub, userType, family);
  // Index the new family under the user so revokeAllForUser can find it.
  await redis
    .multi()
    .sadd(userFamiliesKey(sub), family)
    .expire(userFamiliesKey(sub), issued.expiresInSec)
    .exec();
  return issued;
}

async function issueIntoFamily(
  sub: string,
  userType: UserType,
  family: string,
): Promise<IssuedRefresh> {
  const jti = randomUUID();
  const token = issueRefresh({ sub, userType, jti, family });
  const ttl = ttlSecondsFromToken(token);

  await redis
    .multi()
    .set(jtiKey(jti), family, 'EX', ttl)
    .sadd(familyKey(family), jti)
    .expire(familyKey(family), ttl)
    .exec();

  return { token, jti, family, expiresInSec: ttl };
}

export interface RotatedRefresh extends IssuedRefresh {
  sub: string;
  userType: UserType;
}

/**
 * Rotate a refresh token. Atomic check-and-delete on the old JTI guarantees
 * single-use. If the old JTI is missing (already rotated / logged out /
 * stolen-and-used), the whole family is revoked.
 */
export async function rotateRefresh(rawToken: string): Promise<RotatedRefresh> {
  const payload = verifyRefresh(rawToken);

  // Atomic single-use check: DEL returns 1 if the key existed, 0 if not.
  // Two concurrent rotations cannot both succeed.
  const deleted = await redis.del(jtiKey(payload.jti));

  if (deleted === 0) {
    // The JTI is gone — either it was rotated already (reuse!) or revoked.
    // Defensive: nuke the whole family so any sibling refresh tokens die too.
    logger.warn(
      { jti: payload.jti, family: payload.family, sub: payload.sub },
      'refresh token reuse detected — revoking family',
    );
    await revokeFamily(payload.family);
    throw new Error('refresh token invalid (possible reuse)');
  }

  await redis.srem(familyKey(payload.family), payload.jti);

  const next = await issueIntoFamily(payload.sub, payload.userType, payload.family);
  return { ...next, sub: payload.sub, userType: payload.userType };
}

/** Logout — verify and delete the presented JTI. Safe on already-revoked tokens. */
export async function revokeRefresh(rawToken: string): Promise<void> {
  let payload;
  try {
    payload = verifyRefresh(rawToken);
  } catch {
    // Token already invalid — nothing to revoke. Idempotent logout.
    return;
  }
  await redis
    .multi()
    .del(jtiKey(payload.jti))
    .srem(familyKey(payload.family), payload.jti)
    .exec();
}

/** Nuke every refresh token in a family. Used on reuse detection. */
export async function revokeFamily(family: string): Promise<void> {
  const jtis = await redis.smembers(familyKey(family));
  const keys = jtis.map(jtiKey);
  keys.push(familyKey(family));
  await redis.del(...keys);
}

/**
 * Nuke every active session for a user. Called on password change,
 * self-delete, and admin deactivate. Idempotent on stale entries.
 */
export async function revokeAllForUser(sub: string): Promise<void> {
  const setKey = userFamiliesKey(sub);
  const families = await redis.smembers(setKey);
  for (const fam of families) {
    await revokeFamily(fam);
  }
  await redis.del(setKey);
}
