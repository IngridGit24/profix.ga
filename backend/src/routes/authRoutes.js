import express from 'express';
import rateLimit from 'express-rate-limit';
import Joi from 'joi';
import authController from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';
import { loginLockout } from '../middlewares/loginLockout.js';

const router = express.Router();

const passwordComplexity = Joi.string()
  .min(8)
  .pattern(/[a-z]/, 'lowercase')
  .pattern(/[A-Z]/, 'uppercase')
  .pattern(/[0-9]/, 'digit')
  .required()
  .messages({
    'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
    'string.pattern.name': 'Le mot de passe doit contenir des majuscules, minuscules et chiffres',
  });

// `type` is intentionally not a field here — every registration becomes a
// plain client; see authService.register()'s doc comment for why.
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().max(255).required(),
  password: passwordComplexity,
  phone: Joi.string().max(20).optional().allow('', null),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  phone: Joi.string().max(20).optional().allow('', null),
  profileImage: Joi.string().uri().optional().allow('', null),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordComplexity,
});

const setModeSchema = Joi.object({
  mode: Joi.string().valid('client', 'prestataire').required(),
});

const requestResetSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: passwordComplexity,
});

// Rate limit on top of loginLockout — this caps total attempts per IP
// across all accounts, loginLockout caps per email+IP pair.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, validateRequest(registerSchema), authController.register);
router.post('/login', authLimiter, loginLockout, validateRequest(loginSchema), authController.login);
router.post('/request-password-reset', authLimiter, validateRequest(requestResetSchema), authController.requestPasswordReset);
router.post('/reset-password', authLimiter, validateRequest(resetPasswordSchema), authController.resetPassword);

router.get('/me', authenticateToken, authController.getProfile);
router.put('/profile', authenticateToken, validateRequest(updateProfileSchema), authController.updateProfile);
router.put('/change-password', authenticateToken, validateRequest(changePasswordSchema), authController.changePassword);
router.put('/mode', authenticateToken, validateRequest(setModeSchema), authController.setMode);
router.post('/logout', authenticateToken, authController.logout);

export default router;
