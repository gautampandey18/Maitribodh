import bcrypt from 'bcrypt';
import rateLimit from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { createApp } from './app.js';
import { loadAuthConfig } from './config/auth.js';
import { createDatabasePool } from './config/database.js';
import { createAuthRepository } from './modules/auth/auth.repository.js';
import { createAuthRouter } from './modules/auth/auth.routes.js';
import { createAuthService } from './modules/auth/auth.service.js';
import { createUsersRouter } from './modules/users/users.routes.js';
import { createUsersRepository } from './modules/users/users.repository.js';
import { createUsersService } from './modules/users/users.service.js';
import { createCategoriesRepository } from './modules/categories/categories.repository.js';
import { createCategoriesService } from './modules/categories/categories.service.js';
import { createCategoriesRouter } from './modules/categories/categories.routes.js';
import { createLookupsRepository } from './modules/lookups/lookups.repository.js';
import { createLookupsService } from './modules/lookups/lookups.service.js';
import { createLookupsRouter } from './modules/lookups/lookups.routes.js';
import { createLocationsRepository } from './modules/locations/locations.repository.js';
import { createLocationsService } from './modules/locations/locations.service.js';
import { createLocationsRouter } from './modules/locations/locations.routes.js';
import { createPersonsRepository } from './modules/persons/persons.repository.js';
import { createPersonsService } from './modules/persons/persons.service.js';
import { createPersonsRouter } from './modules/persons/persons.routes.js';
import { createRegistrationRepository } from './modules/persons/registration.repository.js';
import { createRegistrationRouter } from './modules/persons/registration.routes.js';
import { createQrService } from './modules/qr/qr.service.js';
import { loadQrConfig } from './config/qr.js';
import { createPublicQrRepository } from './modules/qr/public-qr.repository.js';
import { createPublicQrRouter } from './modules/qr/public-qr.routes.js';
import { createGateRepository } from './modules/gate/gate.repository.js';
import { createGateService } from './modules/gate/gate.service.js';
import { createGateRouter } from './modules/gate/gate.routes.js';
import { createVisitsRepository } from './modules/visits/visits.repository.js';
import { createVisitsService } from './modules/visits/visits.service.js';
import { createVisitsRouter } from './modules/visits/visits.routes.js';
import { createApprovalsRepository } from './modules/approvals/approvals.repository.js';
import { createApprovalsService } from './modules/approvals/approvals.service.js';
import { createApprovalsRouter } from './modules/approvals/approvals.routes.js';
import { createAuthenticate } from './middleware/authenticate.js';
import { createBlacklistRepository } from './modules/blacklist/blacklist.repository.js';
import { createBlacklistService } from './modules/blacklist/blacklist.service.js';
import { createBlacklistRouter } from './modules/blacklist/blacklist.routes.js';
import { createReportsRepository } from './modules/reports/reports.repository.js';
import { createReportsService } from './modules/reports/reports.service.js';
import { createReportsRouter } from './modules/reports/reports.routes.js';
import { createDashboardRepository } from './modules/dashboard/dashboard.repository.js';
import { createDashboardService } from './modules/dashboard/dashboard.service.js';
import { createDashboardRouter } from './modules/dashboard/dashboard.routes.js';
import { createActivityRouter } from './modules/activity/activity.routes.js';

const port = Number(process.env.PORT ?? 6200);
const authConfig = loadAuthConfig();
const databasePool = createDatabasePool();
const authRepository = createAuthRepository(databasePool);
const usersService = createUsersService({ repository: createUsersRepository(databasePool) });
const categoriesService = createCategoriesService({ repository: createCategoriesRepository(databasePool) });
const lookupsService = createLookupsService({ repository: createLookupsRepository(databasePool) });
const locationsService = createLocationsService({ repository: createLocationsRepository(databasePool) });
const personsRepository = createPersonsRepository(databasePool);
const personsService = createPersonsService({ repository: personsRepository });
const qrConfig = loadQrConfig();
const publicQrRepository = createPublicQrRepository(databasePool);
const qrService = createQrService({
  repository: personsRepository,
  publicRepository: publicQrRepository,
  hmacSecret: qrConfig.hmacSecret,
});
const approvalsRepository = createApprovalsRepository(databasePool);
approvalsRepository.syncNonApprovalPersons?.().catch((err) => console.warn('Could not sync non-approval persons', err));
const approvalsService = createApprovalsService({ repository: approvalsRepository });
const gateService = createGateService({ repository: createGateRepository(databasePool), qrService });
const visitsService = createVisitsService({ repository: createVisitsRepository(databasePool) });
const blacklistService = createBlacklistService({ repository: createBlacklistRepository(databasePool) });
const reportsService = createReportsService({ repository: createReportsRepository(databasePool) });
const dashboardService = createDashboardService({ repository: createDashboardRepository(databasePool) });
const authService = createAuthService({
  repository: authRepository,
  comparePassword: bcrypt.compare,
  hashPassword: (password, rounds) => bcrypt.hash(password, rounds),
  issueToken: (user, expiresIn) => jwt.sign(
    { role: user.role, tokenVersion: user.token_version },
    authConfig.jwtSecret,
    { subject: String(user.user_id), expiresIn, algorithm: 'HS256' },
  ),
});
const authenticate = createAuthenticate({
  verifyToken: (token) => jwt.verify(token, authConfig.jwtSecret, { algorithms: ['HS256'] }),
  getUserById: authRepository.getUserById,
});
const loginRateLimiter = rateLimit({
  windowMs: authConfig.loginRateLimitWindowMs,
  limit: authConfig.loginRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
});
const authRouter = createAuthRouter({ authService, loginRateLimiter, authenticate });
const usersRouter = createUsersRouter({ authService, usersService, authenticate });
const categoriesRouter = createCategoriesRouter({ categoriesService, authenticate });
const lookupsRouter = createLookupsRouter({ lookupsService, authenticate });
const locationsRouter = createLocationsRouter({ locationsService, authenticate });
const approvalsRouter = createApprovalsRouter({ approvalsService, authenticate });
const registrationRouter = createRegistrationRouter({ repository: createRegistrationRepository(databasePool), authenticate, encryptionSecret: process.env.DATA_ENCRYPTION_SECRET ?? qrConfig.hmacSecret });
const personsRouter = createPersonsRouter({ personsService, approvalsService, qrService, authenticate, registrationRouter });
const publicQrRouter = createPublicQrRouter({ qrService });
const gateRouter = createGateRouter({ gateService, authenticate });
const visitsRouter = createVisitsRouter({ visitsService, authenticate });
const blacklistRouter = createBlacklistRouter({ blacklistService, authenticate });
const reportsRouter = createReportsRouter({ reportsService, authenticate });
const dashboardRouter = createDashboardRouter({ dashboardService, authenticate });
const activityRouter = createActivityRouter({ pool: databasePool, authenticate });
const app = createApp({ authRouter, usersRouter, categoriesRouter, lookupsRouter, locationsRouter, personsRouter, approvalsRouter, publicQrRouter, gateRouter, visitsRouter, blacklistRouter, reportsRouter, dashboardRouter, activityRouter });

app.listen(port, () => {
  console.info(`MAMS API listening on port ${port}`);
});