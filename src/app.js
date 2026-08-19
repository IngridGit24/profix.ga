import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { config } from './config/app.js';
import { testConnection } from './config/database.js';
import logger from './utils/logger.js';
import { errorHandler, notFound } from './middlewares/errorHandler.js';
import { initSocket } from './config/socket.js';

import authRoutes from './routes/authRoutes.js';
import prestataireRoutes from './routes/prestataireRoutes.js';
import demandeRoutes from './routes/demandeRoutes.js';
import devisRoutes from './routes/devisRoutes.js';
import messagerieRoutes from './routes/messagerieRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import referenceRoutes from './routes/referenceRoutes.js';

const app = express();
const server = createServer(app);

// CORS — explicit origin whitelist, same reasoning as api-livrago-express:
// even in dev, only accept known ports rather than any localhost origin.
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); // mobile apps, curl, server-to-server

    if (config.corsOrigin.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    const isDevelopment = config.nodeEnv !== 'production';
    if (isDevelopment) {
      const match = origin.match(/^https?:\/\/localhost:(\d+)$/);
      if (match) {
        const allowedPorts = ['5173', '5174', '3000', '4000'];
        if (allowedPorts.includes(match[1])) return callback(null, true);
      }
    }

    logger.warn(`CORS: Origin ${origin} not allowed`);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'X-Request-Id'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
    },
  },
  hsts: { maxAge: 63072000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

app.use(compression());
app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));

// Global rate limiting — the fake client-side rateLimiter.js the frontend
// used to rely on is gone; this is the real thing.
{
  const isProd = config.nodeEnv === 'production';
  const limiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: isProd ? config.rateLimitMaxRequests : 1000,
    message: { success: false, message: 'Trop de requêtes. Veuillez réessayer plus tard.', statusCode: 429 },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
  });
  app.use(limiter);
}

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'ProFixGabon API is running',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

const apiPrefix = `${config.apiPrefix}/${config.apiVersion}`;

app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/prestataires`, prestataireRoutes);
app.use(`${apiPrefix}/demandes`, demandeRoutes);
app.use(`${apiPrefix}/devis`, devisRoutes);
app.use(`${apiPrefix}/conversations`, messagerieRoutes);
app.use(`${apiPrefix}/uploads`, uploadRoutes);
app.use(`${apiPrefix}/reference`, referenceRoutes);

app.get('/api-info', (req, res) => {
  res.json({
    success: true,
    message: 'Welcome to the ProFixGabon API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: `${apiPrefix}/auth`,
      prestataires: `${apiPrefix}/prestataires`,
      demandes: `${apiPrefix}/demandes`,
      devis: `${apiPrefix}/devis`,
      conversations: `${apiPrefix}/conversations`,
      uploads: `${apiPrefix}/uploads`,
      reference: `${apiPrefix}/reference`,
    },
  });
});

app.use(notFound);
app.use(errorHandler);

const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      process.stderr.write('Failed to connect to database. Server not started.\n');
      process.exit(1);
    }

    initSocket(server);
    logger.log('Socket.io initialized');

    server.listen(config.port, '0.0.0.0', () => {
      logger.log(`ProFixGabon API Server running on port ${config.port}`);
      logger.log(`Environment: ${config.nodeEnv}`);
      logger.log(`API Base URL: http://0.0.0.0:${config.port}${apiPrefix}`);
    });
  } catch (error) {
    process.stderr.write(`Failed to start server: ${error?.message}\n`);
    process.exit(1);
  }
};

process.on('uncaughtException', (error) => {
  process.stderr.write(`Uncaught Exception: ${error?.message}\n`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  process.stderr.write(`Unhandled Rejection: ${reason}\n`);
  process.exit(1);
});

process.on('SIGTERM', () => {
  logger.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

startServer();

export default app;
