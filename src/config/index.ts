// Central environment configuration — single source of truth.
// All other modules should import this instead of reading process.env directly.

interface Config {
  env: string;
  port: number;
  mongoUri: string | undefined;
  jwt: {
    secret: string | undefined;
    expiresIn: string;
  };
  cors: {
    origin: string[];
  };
}

const config: Config = {
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

export default config;
