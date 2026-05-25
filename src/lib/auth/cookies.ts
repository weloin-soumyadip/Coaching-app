import type { CookieOptions, Response } from 'express';
import config from '../../config/index.js';
import type { IssuedRefresh } from './refreshTokens.js';

// Refresh-token cookie helpers. Shared by auth.controller and any other
// controller that needs to (re-)issue or clear a session cookie — e.g.,
// password change handlers re-issue tokens after revoking all sessions.

export function refreshCookieOptions(maxAgeSec: number): CookieOptions {
  return {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'strict',
    path: config.cookie.refreshPath,
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
    maxAge: maxAgeSec * 1000,
  };
}

export function setRefreshCookie(res: Response, issued: IssuedRefresh): void {
  res.cookie(config.cookie.refreshName, issued.token, refreshCookieOptions(issued.expiresInSec));
}

export function clearRefreshCookie(res: Response): void {
  res.clearCookie(config.cookie.refreshName, {
    path: config.cookie.refreshPath,
    ...(config.cookie.domain ? { domain: config.cookie.domain } : {}),
  });
}
