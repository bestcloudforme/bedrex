import type { RequestHandler } from 'express';
import { logger } from '../utils/logger.js';

export const requestLogger: RequestHandler = (req, _res, next) => {
  logger.info({ method: req.method, url: req.url }, 'incoming request');
  next();
};
