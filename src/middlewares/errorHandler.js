import { config } from '../config/app.js';
import { ApiResponse } from '../types/index.js';
import logger from '../utils/logger.js';

/**
 * Map of status codes → safe, user-facing French messages.
 * NEVER return raw SQL errors, stack traces, or internal field names in production.
 */
const GENERIC_MESSAGES = {
  400: 'La requête est invalide. Vérifiez les données envoyées.',
  401: 'Authentification requise. Veuillez vous reconnecter.',
  403: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
  404: 'La ressource demandée est introuvable.',
  409: 'Un conflit a été détecté. Cette ressource existe peut-être déjà.',
  422: 'Les données soumises sont invalides. Vérifiez les champs requis.',
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
};

export const errorHandler = (err, req, res, next) => {
  const isProd = config.nodeEnv === 'production';

  logger.error(`[ERROR] ${req.method} ${req.originalUrl} — ${err.message}`);

  let statusCode = err.statusCode || 500;
  let message = err.message || GENERIC_MESSAGES[500];
  let errors = err.errors || null;

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = GENERIC_MESSAGES[409];
    errors = null;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Une référence est introuvable. Vérifiez les identifiants fournis.';
    errors = null;
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 400;
    message = 'Impossible de supprimer cet élément car il est référencé ailleurs.';
    errors = null;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token invalide. Veuillez vous reconnecter.';
    errors = null;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expirée. Veuillez vous reconnecter.';
    errors = null;
  } else if (err.name === 'MulterError') {
    statusCode = 400;
    message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Le fichier est trop volumineux (max 5 Mo).'
      : 'Erreur lors du téléversement du fichier.';
    errors = null;
  }

  if (isProd && statusCode >= 500) {
    message = GENERIC_MESSAGES[500];
    errors = null;
  }

  if (!message) message = GENERIC_MESSAGES[statusCode] || GENERIC_MESSAGES[500];

  res.status(statusCode).json(ApiResponse.error(message, statusCode, errors));
};

export const notFound = (req, res) => {
  res.status(404).json(ApiResponse.error(`Route ${req.originalUrl} not found`, 404));
};

export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
