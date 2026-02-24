import type { ErrorRequestHandler } from 'express';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  logger.error({ err }, 'Unhandled error');
  const status = err.status || 500;
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: config.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    },
  });
};
