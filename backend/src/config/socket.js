import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from './app.js';
import logger from '../utils/logger.js';

let io = null;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: config.corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      if (!token) return next(new Error('Authentication error: No token provided'));

      const decoded = jwt.verify(token, config.jwtSecret);
      socket.userId = decoded.id;
      socket.userType = decoded.type;
      next();
    } catch (err) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.log(`Socket connected: user ${socket.userId}`);

    // Every user gets their own room — used for devis/demande notifications
    // that aren't tied to a specific open conversation.
    socket.join(`user_${socket.userId}`);

    // Client explicitly joins a conversation room when they open the chat
    // page — mirrors the customer app's join_order_room pattern.
    socket.on('join_conversation', (conversationId) => {
      socket.join(`conversation_${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation_${conversationId}`);
    });

    socket.on('disconnect', () => {
      logger.log(`Socket disconnected: user ${socket.userId}`);
    });
  });

  return io;
};

export const getSocketIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initSocket first.');
  }
  return io;
};

export const emitNewMessage = (conversationId, message) => {
  try {
    getSocketIO().to(`conversation_${conversationId}`).emit('new_message', {
      conversationId,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitNewMessage:', err?.message);
  }
};

/** Notifies the recipient's personal room too, so the conversations list
 * updates live even if they don't have that specific chat open. */
export const emitConversationUpdate = (userId, conversation) => {
  try {
    getSocketIO().to(`user_${userId}`).emit('conversation_updated', {
      conversation,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitConversationUpdate:', err?.message);
  }
};

export const emitNewDemande = (prestataireUserId, demande) => {
  try {
    getSocketIO().to(`user_${prestataireUserId}`).emit('new_demande', {
      demande,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitNewDemande:', err?.message);
  }
};

export const emitNewDevis = (clientId, devis) => {
  try {
    getSocketIO().to(`user_${clientId}`).emit('new_devis', {
      devis,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitNewDevis:', err?.message);
  }
};

export const emitDevisStatusChange = (prestataireUserId, devis) => {
  try {
    getSocketIO().to(`user_${prestataireUserId}`).emit('devis_status_changed', {
      devis,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitDevisStatusChange:', err?.message);
  }
};

/** Notify a provider the moment admin validates (or rejects) their profile. */
export const emitPrestataireValidation = (userId, validated) => {
  try {
    getSocketIO().to(`user_${userId}`).emit('prestataire_validation', {
      validated,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    logger.warn('emitPrestataireValidation:', err?.message);
  }
};
