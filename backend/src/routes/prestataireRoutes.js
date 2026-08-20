import express from 'express';
import Joi from 'joi';
import prestataireController from '../controllers/prestataireController.js';
import { authenticateToken, authorizeRoles, authorizePrestataireOwner, optionalAuth } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';

const router = express.Router();

const createSchema = Joi.object({
  nom: Joi.string().min(2).max(150).required(),
  categorie: Joi.string().min(2).max(100).required(),
  ville: Joi.string().min(2).max(100).required(),
  description: Joi.string().min(10).max(2000).required(),
  experience: Joi.string().max(100).optional().allow('', null),
  skills: Joi.array().items(Joi.string()).optional(),
  photo: Joi.string().uri().optional().allow('', null),
  galerie: Joi.array().items(Joi.string().uri()).optional(),
  pieceIdentite: Joi.string().uri().optional().allow('', null),
});

const updateSchema = Joi.object({
  nom: Joi.string().min(2).max(150).optional(),
  categorie: Joi.string().min(2).max(100).optional(),
  ville: Joi.string().min(2).max(100).optional(),
  description: Joi.string().min(10).max(2000).optional(),
  experience: Joi.string().max(100).optional().allow('', null),
  skills: Joi.array().items(Joi.string()).optional(),
  photo: Joi.string().uri().optional().allow('', null),
  galerie: Joi.array().items(Joi.string().uri()).optional(),
});

const availabilitySchema = Joi.object({
  available: Joi.boolean().required(),
});

// Public browse — optionalAuth so getById can decide whether to include
// piece_identite based on whether the requester is the owner/admin.
router.get('/', prestataireController.list);
router.get('/me/profile', authenticateToken, prestataireController.getMyProfile);

// Admin — before /:id so it isn't shadowed by the param route.
router.get('/admin/pending', authenticateToken, authorizeRoles('admin'), prestataireController.getPending);
router.get('/admin/all', authenticateToken, authorizeRoles('admin'), prestataireController.getAll);
router.post('/:id/validate', authenticateToken, authorizeRoles('admin'), prestataireController.validate);
router.post('/:id/reject', authenticateToken, authorizeRoles('admin'), prestataireController.reject);

router.get('/:id', optionalAuth, prestataireController.getById);
router.post('/', authenticateToken, validateRequest(createSchema), prestataireController.create);
router.put('/:id', authenticateToken, authorizePrestataireOwner, validateRequest(updateSchema), prestataireController.update);
router.patch('/:id/availability', authenticateToken, authorizePrestataireOwner, validateRequest(availabilitySchema), prestataireController.setAvailability);

export default router;
