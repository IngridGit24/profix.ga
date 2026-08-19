import { MessagerieService } from '../services/messagerieService.js';
import { ApiResponse, Pagination } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { emitNewMessage, emitConversationUpdate } from '../config/socket.js';
import logger from '../utils/logger.js';

class MessagerieController {
  getOrCreateConversation = asyncHandler(async (req, res) => {
    const { prestataireUserId } = req.body;
    if (req.user.id === Number(prestataireUserId)) {
      return res.status(400).json(ApiResponse.error('Impossible de démarrer une conversation avec vous-même', 400));
    }
    const conversation = await MessagerieService.getOrCreateConversation(req.user.id, prestataireUserId);
    res.json(ApiResponse.success(conversation, 'Conversation récupérée avec succès'));
  });

  listMine = asyncHandler(async (req, res) => {
    const conversations = await MessagerieService.listForUser(req.user.id);
    res.json(ApiResponse.success(conversations, 'Conversations récupérées avec succès'));
  });

  getMessages = asyncHandler(async (req, res) => {
    const conversation = await MessagerieService.getById(req.params.id);
    if (!conversation) {
      return res.status(404).json(ApiResponse.error('Conversation introuvable', 404));
    }
    if (conversation.client_id !== req.user.id && conversation.prestataire_id !== req.user.id) {
      return res.status(403).json(ApiResponse.error('Accès refusé', 403));
    }

    const { page, limit } = Pagination.create(req.query.page, req.query.limit || 50);
    const messages = await MessagerieService.getMessages(req.params.id, { page, limit });
    res.json(ApiResponse.success(messages, 'Messages récupérés avec succès'));
  });

  sendMessage = asyncHandler(async (req, res) => {
    const { contenu } = req.body;
    const { message, recipientId } = await MessagerieService.sendMessage(req.params.id, req.user.id, contenu);

    try {
      emitNewMessage(req.params.id, message);
      const conversation = await MessagerieService.getById(req.params.id);
      emitConversationUpdate(recipientId, conversation);
    } catch (err) {
      logger.warn('Message socket emit failed:', err?.message);
    }

    res.status(201).json(ApiResponse.success(message, 'Message envoyé avec succès', 201));
  });

  markAsRead = asyncHandler(async (req, res) => {
    await MessagerieService.markAsRead(req.params.id, req.user.id);
    res.json(ApiResponse.success(null, 'Messages marqués comme lus'));
  });
}

export default new MessagerieController();
