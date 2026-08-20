import { executeQuery } from '../config/database.js';

export class DemandeService {
  static async create({ clientId, prestataireId, categorie, description }) {
    const result = await executeQuery(
      `INSERT INTO demandes (client_id, prestataire_id, categorie, description, statut)
       VALUES (?, ?, ?, ?, 'en_attente')`,
      [clientId, prestataireId, categorie || null, description]
    );
    return this.getById(result.insertId);
  }

  static async getById(id) {
    const rows = await executeQuery(
      `SELECT d.*, u.name AS client_name, u.phone AS client_phone,
              p.nom AS prestataire_nom, p.user_id AS prestataire_user_id
       FROM demandes d
       JOIN users u ON d.client_id = u.id
       JOIN prestataires p ON d.prestataire_id = p.id
       WHERE d.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async listForClient(clientId, pagination = {}) {
    return this._list('d.client_id = ?', [clientId], pagination);
  }

  static async listForPrestataire(prestataireId, pagination = {}) {
    return this._list('d.prestataire_id = ?', [prestataireId], pagination);
  }

  static async _list(whereClause, whereParams, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const countRows = await executeQuery(`SELECT COUNT(*) as total FROM demandes d WHERE ${whereClause}`, whereParams);
    const total = countRows[0]?.total || 0;

    const rows = await executeQuery(
      `SELECT d.*, u.name AS client_name, u.phone AS client_phone,
              p.nom AS prestataire_nom, p.user_id AS prestataire_user_id
       FROM demandes d
       JOIN users u ON d.client_id = u.id
       JOIN prestataires p ON d.prestataire_id = p.id
       WHERE ${whereClause}
       ORDER BY d.created_at DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    return { demandes: rows, total, page, limit };
  }

  static async markDevisSent(demandeId, devisId) {
    await executeQuery(
      `UPDATE demandes SET statut = 'devis_envoye', devis_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [devisId, demandeId]
    );
  }

  static async updateStatut(demandeId, statut) {
    await executeQuery('UPDATE demandes SET statut = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [statut, demandeId]);
  }
}

export default DemandeService;
