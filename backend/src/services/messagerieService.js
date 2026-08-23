import { executeQuery } from '../config/database.js';

export class MessagerieService {
  /**
   * Replaces the old client-side "fetch every conversation this user is in,
   * scan for one whose participants array also contains the other user"
   * with a single UNIQUE(client_id, prestataire_id) lookup/insert.
   */
  static async getOrCreateConversation(clientId, prestataireUserId) {
    const existing = await executeQuery(
      'SELECT * FROM conversations WHERE client_id = ? AND prestataire_id = ?',
      [clientId, prestataireUserId]
    );
    if (existing.length > 0) return existing[0];

    const result = await executeQuery(
      'INSERT INTO conversations (client_id, prestataire_id) VALUES (?, ?)',
      [clientId, prestataireUserId]
    );

    await executeQuery(
      `INSERT INTO conversation_reads (conversation_id, user_id, unread_count) VALUES (?, ?, 0), (?, ?, 0)`,
      [result.insertId, clientId, result.insertId, prestataireUserId]
    );

    const rows = await executeQuery('SELECT * FROM conversations WHERE id = ?', [result.insertId]);
    return rows[0];
  }

  static async listForUser(userId) {
    const rows = await executeQuery(
      `SELECT c.*, cr.unread_count,
              client.name AS client_name, prest.name AS prestataire_name
       FROM conversations c
       JOIN conversation_reads cr ON cr.conversation_id = c.id AND cr.user_id = ?
       JOIN users client ON c.client_id = client.id
       JOIN users prest ON c.prestataire_id = prest.id
       WHERE c.client_id = ? OR c.prestataire_id = ?
       ORDER BY c.date_dernier_message IS NULL, c.date_dernier_message DESC`,
      [userId, userId, userId]
    );
    return rows;
  }

  static async getById(id) {
    const rows = await executeQuery('SELECT * FROM conversations WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** Used to gate devis creation without a demandeId — see devisController.create. */
  static async conversationExists(clientId, prestataireUserId) {
    const rows = await executeQuery(
      'SELECT id FROM conversations WHERE client_id = ? AND prestataire_id = ? LIMIT 1',
      [clientId, prestataireUserId]
    );
    return rows.length > 0;
  }

  static async sendMessage(conversationId, expediteurId, contenu) {
    const conversation = await this.getById(conversationId);
    if (!conversation) {
      const err = new Error('Conversation introuvable');
      err.statusCode = 404;
      throw err;
    }
    if (conversation.client_id !== expediteurId && conversation.prestataire_id !== expediteurId) {
      const err = new Error("Vous ne participez pas à cette conversation");
      err.statusCode = 403;
      throw err;
    }

    const result = await executeQuery(
      'INSERT INTO messages (conversation_id, expediteur_id, contenu) VALUES (?, ?, ?)',
      [conversationId, expediteurId, contenu]
    );

    const recipientId = conversation.client_id === expediteurId ? conversation.prestataire_id : conversation.client_id;

    await executeQuery(
      'UPDATE conversations SET dernier_message = ?, date_dernier_message = NOW() WHERE id = ?',
      [contenu, conversationId]
    );
    await executeQuery(
      `INSERT INTO conversation_reads (conversation_id, user_id, unread_count) VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE unread_count = unread_count + 1`,
      [conversationId, recipientId]
    );

    const rows = await executeQuery('SELECT * FROM messages WHERE id = ?', [result.insertId]);
    return { message: rows[0], recipientId };
  }

  /**
   * Returns the `limit` most recent messages for `page` (page 1 = most
   * recent), in chronological (oldest-first) order for the caller to render
   * directly. Ordering by created_at ASC with a plain OFFSET — the original
   * version of this method — would make page 1 return the *oldest* messages
   * in a long conversation instead of the most recent ones, since OFFSET 0
   * starts from the beginning either way; fetching DESC then reversing is
   * what actually gets "most recent N, oldest of that batch first".
   */
  static async getMessages(conversationId, pagination = {}) {
    const { page = 1, limit = 50 } = pagination;
    const offset = (page - 1) * limit;

    const rows = await executeQuery(
      `SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [conversationId, limit, offset]
    );
    return rows.reverse();
  }

  static async markAsRead(conversationId, userId) {
    await executeQuery('UPDATE messages SET lu = TRUE WHERE conversation_id = ? AND expediteur_id != ? AND lu = FALSE', [conversationId, userId]);
    await executeQuery(
      `INSERT INTO conversation_reads (conversation_id, user_id, unread_count) VALUES (?, ?, 0)
       ON DUPLICATE KEY UPDATE unread_count = 0`,
      [conversationId, userId]
    );
  }
}

export default MessagerieService;
