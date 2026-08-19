import { executeQuery, executeTransaction } from '../config/database.js';
import { DemandeService } from './demandeService.js';

const DEVIS_VALIDITY_DAYS = 7;

export class DevisService {
  /**
   * Atomic sequential quote number via MySQL's documented
   * `ON DUPLICATE KEY UPDATE col = LAST_INSERT_ID(expr)` idiom — must run
   * through executeTransaction (single connection) since LAST_INSERT_ID()
   * is connection-scoped; a plain executeQuery() pulls a fresh connection
   * from the pool per call and would defeat the point.
   *
   * Replaces the old `getDocs(collection(db,'devis'))` count-then-write,
   * which raced: two quotes created at the same moment could read the same
   * count and get the same numero_devis.
   */
  static async _generateNumero() {
    const year = new Date().getFullYear();
    const results = await executeTransaction([
      {
        query: `INSERT INTO quote_counters (year, last_number) VALUES (?, 1)
                 ON DUPLICATE KEY UPDATE last_number = LAST_INSERT_ID(last_number + 1)`,
        params: [year],
      },
    ]);
    const newNumber = results[0].insertId;
    return `DEV-${year}-${String(newNumber).padStart(4, '0')}`;
  }

  static async create({ demandeId, clientId, prestataireId, montant, description }) {
    const numeroDevis = await this._generateNumero();

    // Computed here, in JS, not via serverTimestamp(new Date(...)) — the
    // old Firestore code passed a Date into serverTimestamp(), which takes
    // no arguments and silently ignores it, so every quote's expiration was
    // actually set to "now" instead of 7 days out.
    const dateExpiration = new Date(Date.now() + DEVIS_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

    const result = await executeQuery(
      `INSERT INTO devis (numero_devis, demande_id, client_id, prestataire_id, montant, description, statut, date_emission, date_expiration)
       VALUES (?, ?, ?, ?, ?, ?, 'en_attente', NOW(), ?)`,
      [numeroDevis, demandeId || null, clientId, prestataireId, montant, description || null, dateExpiration]
    );

    if (demandeId) {
      await DemandeService.markDevisSent(demandeId, result.insertId);
    }

    return this.getById(result.insertId);
  }

  static async getById(id) {
    const rows = await executeQuery(
      `SELECT dv.*, u.name AS client_name, u.phone AS client_phone,
              p.nom AS prestataire_nom, p.user_id AS prestataire_user_id
       FROM devis dv
       JOIN users u ON dv.client_id = u.id
       JOIN prestataires p ON dv.prestataire_id = p.id
       WHERE dv.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  static async listForClient(clientId, pagination = {}) {
    return this._list('dv.client_id = ?', [clientId], pagination);
  }

  static async listForPrestataire(prestataireId, pagination = {}) {
    return this._list('dv.prestataire_id = ?', [prestataireId], pagination);
  }

  static async _list(whereClause, whereParams, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;

    const countRows = await executeQuery(`SELECT COUNT(*) as total FROM devis dv WHERE ${whereClause}`, whereParams);
    const total = countRows[0]?.total || 0;

    const rows = await executeQuery(
      `SELECT dv.*, u.name AS client_name, u.phone AS client_phone,
              p.nom AS prestataire_nom, p.user_id AS prestataire_user_id
       FROM devis dv
       JOIN users u ON dv.client_id = u.id
       JOIN prestataires p ON dv.prestataire_id = p.id
       WHERE ${whereClause}
       ORDER BY dv.date_emission DESC
       LIMIT ? OFFSET ?`,
      [...whereParams, limit, offset]
    );

    return { devis: rows, total, page, limit };
  }

  static async accepter(id) {
    const devis = await this.getById(id);
    if (!devis) {
      const err = new Error('Devis introuvable');
      err.statusCode = 404;
      throw err;
    }

    await executeQuery(`UPDATE devis SET statut = 'accepte', date_reponse = NOW() WHERE id = ?`, [id]);
    if (devis.demande_id) {
      await DemandeService.updateStatut(devis.demande_id, 'accepte');
    }
    return this.getById(id);
  }

  static async refuser(id) {
    const devis = await this.getById(id);
    if (!devis) {
      const err = new Error('Devis introuvable');
      err.statusCode = 404;
      throw err;
    }

    await executeQuery(`UPDATE devis SET statut = 'refuse', date_reponse = NOW() WHERE id = ?`, [id]);
    if (devis.demande_id) {
      await DemandeService.updateStatut(devis.demande_id, 'refuse');
    }
    return this.getById(id);
  }
}

export default DevisService;
