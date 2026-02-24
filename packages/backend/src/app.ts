import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { agentRoutes } from './routes/agents.js';
import { metricsRoutes } from './routes/metrics.js';
import { topologyRoutes } from './routes/topology.js';
import { healthRoutes } from './routes/health.js';
import { settingsRoutes } from './routes/settings.js';
import { snapshotRoutes } from './routes/snapshots.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  const origins = config.CORS_ORIGIN.split(',').map(o => o.trim());
  app.use(cors({ origin: origins.length === 1 ? origins[0] : origins }));
  app.use(express.json());
  app.use(requestLogger);

  const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: 'RATE_LIMITED', message: 'Too many requests' } },
  });

  app.use('/api', apiLimiter);

  app.use('/api/health', healthRoutes);
  app.use('/api/agents', agentRoutes);
  app.use('/api/metrics', metricsRoutes);
  app.use('/api/topology', topologyRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/snapshots', snapshotRoutes);

  app.use(errorHandler);

  return app;
}
