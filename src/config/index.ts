// Central environment configuration — single source of truth.
// All other modules should import this instead of reading process.env directly.

interface Config {
  env: string;
  port: number;
  mongoUri: string | undefined;
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiresIn: string;
    refreshExpiresIn: string;
  };
  cors: {
    origin: string[];
  };
  redis: {
    url: string;
  };
  cookie: {
    refreshName: string;
    refreshPath: string;
    domain: string | undefined;
  };
  logLevel: string;
}

const accessSecret = process.env.JWT_SECRET;
if (!accessSecret) {
  // Fail-fast at boot. Mirrors the Mongo URI guarantee from Phase 1.
  throw new Error('[config] JWT_SECRET is required');
}

const refreshSecret = process.env.JWT_REFRESH_SECRET;
if (!refreshSecret) {
  throw new Error('[config] JWT_REFRESH_SECRET is required');
}
if (refreshSecret === accessSecret) {
  throw new Error('[config] JWT_REFRESH_SECRET must differ from JWT_SECRET');
}

const config: Config = {
  env: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret,
    refreshSecret,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  cors: {
    origin: (process.env.CORS_ORIGIN || '').split(',').filter(Boolean),
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
  },
  cookie: {
    refreshName: 'refreshToken',
    refreshPath: '/api/auth',
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  logLevel:
    process.env.LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
};

export default config;
