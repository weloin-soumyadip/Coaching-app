import { Redis } from 'ioredis';
import config from '../config/index.js';
import logger from './logger.js';

// Lazy-connecting singleton. ioredis auto-reconnects with exponential backoff
// on transient failures; we surface lifecycle events through the logger so
// operators can spot connectivity issues without a separate health probe.
const redis = new Redis(config.redis.url, {
  lazyConnect: true,
  maxRetriesPerRequest: 3,
});

redis.on('error', (err: Error) => {
  logger.error({ err }, 'redis error');
});
redis.on('connect', () => {
  logger.info('redis connected');
});
redis.on('reconnecting', (delayMs: number) => {
  logger.warn({ delayMs }, 'redis reconnecting');
});
redis.on('end', () => {
  logger.warn('redis connection closed');
});

export const connectRedis = async (): Promise<void> => {
  await redis.connect();
  // PING confirms the connection is actually usable, not just open.
  await redis.ping();
};

export const disconnectRedis = async (): Promise<void> => {
  // quit() drains pending commands then closes — safer than disconnect().
  await redis.quit();
};

export default redis;
