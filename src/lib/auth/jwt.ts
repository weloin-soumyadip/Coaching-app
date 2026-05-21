import jwt, { type SignOptions } from 'jsonwebtoken';
import config from '../../config/index.js';

export type UserType = 'owner' | 'teacher' | 'student' | 'admin';

export interface JwtPayload {
  sub: string;
  userType: UserType;
}

export function issue(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: config.jwt.expiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(payload, config.jwt.secret, options);
}

export function verify(token: string): JwtPayload {
  const decoded = jwt.verify(token, config.jwt.secret);
  if (
    typeof decoded === 'string' ||
    typeof decoded.sub !== 'string' ||
    typeof (decoded as { userType?: unknown }).userType !== 'string'
  ) {
    throw new Error('[jwt] invalid token payload');
  }
  const userType = (decoded as { userType: string }).userType;
  if (!['owner', 'teacher', 'student', 'admin'].includes(userType)) {
    throw new Error(`[jwt] unknown userType: ${userType}`);
  }
  return { sub: decoded.sub, userType: userType as UserType };
}
