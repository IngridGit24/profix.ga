import jwt from 'jsonwebtoken';
import { config } from '../config/app.js';
import { ApiResponse } from '../types/index.js';
import { executeQuery } from '../config/database.js';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(ApiResponse.error('Access token required', 401));
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json(ApiResponse.error('Invalid or expired token', 403));
    }
    req.user = user;
    next();
  });
};

export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(ApiResponse.error('Authentication required', 401));
    }
    if (!roles.includes(req.user.type)) {
      return res.status(403).json(ApiResponse.error('Insufficient permissions', 403));
    }
    next();
  };
};

/**
 * Ownership check for a prestataire-owned resource — mirrors the pattern
 * that used to be a client-side ProtectedRoute redirect with nothing behind
 * it. Admins bypass; otherwise the requester must own the prestataire
 * profile referenced by req.params.id (or prestataireId).
 */
export const authorizePrestataireOwner = async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json(ApiResponse.error('Authentication required', 401));
  }
  if (req.user.type === 'admin') return next();

  const prestataireId = req.params.id || req.params.prestataireId;
  try {
    const rows = await executeQuery(
      'SELECT id FROM prestataires WHERE id = ? AND user_id = ? AND deleted_at IS NULL LIMIT 1',
      [prestataireId, req.user.id]
    );
    if (rows.length > 0) return next();
  } catch (_) {
    // falls through to 403
  }
  return res.status(403).json(ApiResponse.error('Access denied to this resource', 403));
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    req.user = err ? null : user;
    next();
  });
};
