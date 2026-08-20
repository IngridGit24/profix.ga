import express from 'express';
import Joi from 'joi';
import demandeController from '../controllers/demandeController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';

const router = express.Router();

const createSchema = Joi.object({
  prestataireId: Joi.number().integer().required(),
  categorie: Joi.string().max(100).optional().allow('', null),
  description: Joi.string().min(10).max(2000).required(),
});

router.use(authenticateToken);

router.get('/', demandeController.listMine);
router.get('/:id', demandeController.getById);
router.post('/', validateRequest(createSchema), demandeController.create);

export default router;
