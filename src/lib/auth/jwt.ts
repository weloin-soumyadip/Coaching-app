import jwt, { type SignOptions } from 'jsonwebtoken';
import config from '../../config/index.js';

export type UserType = 'owner' | 'teacher' | 'student' | 'admin';

interface AccessPayload {
  sub: string;
  userType: UserType;
}

interface RefreshPayload {
  sub: string;
  userType: UserType;
  jti: string;
  family: string;
}

const ALL_USER_TYPES: ReadonlyArray<UserType> = ['owner', 'teacher', 'student', 'admin'];

const isUserType = (v: unknown): v is UserType =>
  typeof v === 'string' && (ALL_USER_TYPES as ReadonlyArray<string>).includes(v);

export function issueAccess(payload: AccessPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.accessExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign({ ...payload, tokenType: 'access' }, config.jwt.accessSecret, options);
}

export function issueRefresh(payload: RefreshPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.refreshExpiresIn as SignOptions['expiresIn'],
    jwtid: payload.jti,
  };
  return jwt.sign(
    {
      sub: payload.sub,
      userType: payload.userType,
      family: payload.family,
      tokenType: 'refresh',
    },
    config.jwt.refreshSecret,
    options,
  );
}

export function verifyAccess(token: string): AccessPayload {
  const decoded = jwt.verify(token, config.jwt.accessSecret);
  if (typeof decoded === 'string') throw new Error('[jwt] invalid token payload');
  const d = decoded as { sub?: unknown; userType?: unknown; tokenType?: unknown };
  if (d.tokenType !== 'access') throw new Error('[jwt] expected access token');
  if (typeof d.sub !== 'string' || !isUserType(d.userType)) {
    throw new Error('[jwt] invalid token payload');
  }
  return { sub: d.sub, userType: d.userType };
}

export function verifyRefresh(token: string): RefreshPayload {
  const decoded = jwt.verify(token, config.jwt.refreshSecret);
  if (typeof decoded === 'string') throw new Error('[jwt] invalid token payload');
  const d = decoded as {
    sub?: unknown;
    userType?: unknown;
    tokenType?: unknown;
    jti?: unknown;
    family?: unknown;
  };
  if (d.tokenType !== 'refresh') throw new Error('[jwt] expected refresh token');
  if (
    typeof d.sub !== 'string' ||
    !isUserType(d.userType) ||
    typeof d.jti !== 'string' ||
    typeof d.family !== 'string'
  ) {
    throw new Error('[jwt] invalid token payload');
  }
  return { sub: d.sub, userType: d.userType, jti: d.jti, family: d.family };
}
