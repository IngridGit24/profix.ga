import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

export const config = {
  // Server
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  apiPrefix: process.env.API_PREFIX || '/api',
  baseUrl: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 4000}`,

  // JWT — no default secret, ever. Fails loudly in production rather than
  // quietly running with a guessable key (same pattern as api-livrago-express).
  jwtSecret: (() => {
    if (!process.env.JWT_SECRET) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('SECURITY ERROR: JWT_SECRET must be set in production environment!');
      }
      logger.warn('WARNING: Using default JWT secret - NOT FOR PRODUCTION USE');
      return 'dev-only-secret-key-change-in-production';
    }
    return process.env.JWT_SECRET;
  })(),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  // CORS — explicit whitelist, not a blanket localhost accept, even in dev.
  corsOrigin: process.env.CORS_ORIGIN?.split(',').map((o) => o.trim()).filter(Boolean) || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ],

  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000, // 15 min
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  // File uploads
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  uploadPath: process.env.UPLOAD_PATH || './uploads',

  // Cloudinary — uploads are now signed server-side. The old frontend used
  // an unsigned upload preset (anyone, even logged out, could upload
  // directly to the Cloudinary account); this generates a short-lived
  // signature per authenticated request instead.
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },
};

export default config;
