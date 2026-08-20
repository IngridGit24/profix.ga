import express from 'express';
import Joi from 'joi';
import devisController from '../controllers/devisController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';

const router = express.Router();

const createSchema = Joi.object({
  demandeId: Joi.number().integer().optional().allow(null),
  clientId: Joi.number().integer().required(),
  montant: Joi.number().positive().max(999999999).required(),
  description: Joi.string().max(2000).optional().allow('', null),
});

router.use(authenticateToken);

router.get('/', devisController.listMine);
router.get('/:id', devisController.getById);
router.post('/', validateRequest(createSchema), devisController.create);
router.post('/:id/accepter', devisController.accepter);
router.post('/:id/refuser', devisController.refuser);

export default router;
