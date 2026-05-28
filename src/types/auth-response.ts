import type { UserType } from '../lib/auth/jwt.js';

// Canonical shape returned by every auth flow that issues or refreshes tokens.
// `user` is omitted by the refresh endpoint (no identity payload is re-sent
// during rotation). All other token-issuing handlers include it.
export interface AuthTokenResponse {
  success: true;
  accessToken: string;
  refreshToken: string;
  user?: Record<string, unknown>;
}

// Shape returned by `GET /api/auth/me` — no tokens, just identity.
export interface AuthIdentityResponse {
  success: true;
  userType: UserType;
  user: Record<string, unknown>;
}
