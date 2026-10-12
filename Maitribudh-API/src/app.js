import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

/** Creates the HTTP application without opening a listener. */
export function createApp({ authRouter, usersRouter, categoriesRouter, lookupsRouter, locationsRouter, personsRouter, approvalsRouter, publicQrRouter, gateRouter, visitsRouter, blacklistRouter, reportsRouter, dashboardRouter, activityRouter } = {}) {
  const app = express();
  const trustProxyValue = process.env.TRUST_PROXY_HOPS;
  if (process.env.NODE_ENV === 'production' && trustProxyValue === undefined) {
    throw new Error('TRUST_PROXY_HOPS must be configured in production');
  }
  const trustProxyHops = trustProxyValue === undefined ? 0 : Number(trustProxyValue);
  if (!Number.isSafeInteger(trustProxyHops) || trustProxyHops < 0) {
    throw new Error('TRUST_PROXY_HOPS must be a non-negative integer');
  }

  app.disable('x-powered-by');
  app.set('trust proxy', trustProxyHops);
  app.use(helmet());
  app.use(cors({ origin: process.env.UI_ORIGIN ?? 'http://localhost:5173' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp());

  app.get('/health', (_request, response) => {
    response.status(200).json({ status: 'ok' });
  });

  if (authRouter) {
    app.use('/api/v1/auth', authRouter);
  }
  if (usersRouter) {
    app.use('/api/v1/users', usersRouter);
  }
  if (categoriesRouter) {
    app.use('/api/v1/categories', categoriesRouter);
  }
  if (lookupsRouter) {
    app.use('/api/v1/lookups', lookupsRouter);
  }
  if (locationsRouter) {
    app.use('/api/v1/locations', locationsRouter);
  }
  if (personsRouter) {
    app.use('/api/v1/persons', personsRouter);
  }
  if (approvalsRouter) {
    app.use('/api/v1/approvals', approvalsRouter);
  }
  if (publicQrRouter) {
    app.use('/api/v1/public', publicQrRouter);
  }
  if (gateRouter) {
    app.use('/api/v1/gate', gateRouter);
  }
  if (visitsRouter) {
    app.use('/api/v1/visits', visitsRouter);
  }
  if (blacklistRouter) {
    app.use('/api/v1/blacklist', blacklistRouter);
  }
  if (reportsRouter) {
    app.use('/api/v1/reports', reportsRouter);
  }
  if (dashboardRouter) {
    app.use('/api/v1/dashboard', dashboardRouter);
  }
  if (activityRouter) app.use('/api/v1', activityRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}