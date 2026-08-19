import express from 'express';
import Joi from 'joi';
import avisController from '../controllers/avisController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';

const router = express.Router();

const createSchema = Joi.object({
  note: Joi.number().integer().min(1).max(5).required(),
  commentaire: Joi.string().min(10).max(500).required(),
});

router.get('/:prestataireId', avisController.list);
router.post('/:prestataireId', authenticateToken, validateRequest(createSchema), avisController.create);

export default router;
