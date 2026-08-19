import express from 'express';
import Joi from 'joi';
import messagerieController from '../controllers/messagerieController.js';
import { authenticateToken } from '../middlewares/auth.js';
import { validateRequest } from '../middlewares/validation.js';

const router = express.Router();

const getOrCreateSchema = Joi.object({
  prestataireUserId: Joi.number().integer().required(),
});

const sendMessageSchema = Joi.object({
  contenu: Joi.string().min(1).max(2000).required(),
});

router.use(authenticateToken);

router.get('/', messagerieController.listMine);
router.post('/', validateRequest(getOrCreateSchema), messagerieController.getOrCreateConversation);
router.get('/:id/messages', messagerieController.getMessages);
router.post('/:id/messages', validateRequest(sendMessageSchema), messagerieController.sendMessage);
router.post('/:id/read', messagerieController.markAsRead);

export default router;
