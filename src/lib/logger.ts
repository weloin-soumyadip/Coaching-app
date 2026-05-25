import pino, { type LoggerOptions } from 'pino';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import config from '../config/index.js';

const isProd = config.env === 'production';

const loggerOptions: LoggerOptions = {
  level: config.logLevel,
  base: { env: config.env },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'req.body.password',
      'req.body.currentPassword',
      'req.body.newPassword',
      'res.headers["set-cookie"]',
      '*.password',
      '*.token',
      '*.jwt',
    ],
    remove: true,
  },
  ...(isProd
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss.l' },
        },
      }),
};

const logger = pino(loggerOptions);

export const httpLogger = pinoHttp({
  logger,
  customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  autoLogging: {
    ignore: (req: IncomingMessage) => req.url === '/api/health',
  },
});

export default logger;
