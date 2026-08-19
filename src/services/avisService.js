import { executeQuery, executeTransaction } from '../config/database.js';

/**
 * Replaces the old Firestore `avis.liste` array-field-on-the-prestataire-doc
 * pattern (read whole array, push, write whole array back — a race under
 * concurrent reviews) with a proper table plus a denormalized
 * prestataires.rating/reviews_count kept in sync in the same transaction.
 * Same business rule as before: one review per client per prestataire,
 * enforced by the UNIQUE(prestataire_id, client_id) constraint instead of
 * a client-side `.some(av => av.clientId === user.uid)` scan.
 */
export class AvisService {
  static async create({ prestataireId, clientId, note, commentaire }) {
    const existing = await executeQuery(
      'SELECT id FROM avis WHERE prestataire_id = ? AND client_id = ?',
      [prestataireId, clientId]
    );
    if (existing.length > 0) {
      const err = new Error('Vous avez déjà laissé un avis pour ce prestataire');
      err.statusCode = 409;
      throw err;
    }

    // Both statements run on the same connection (executeTransaction), so
    // the aggregate UPDATE's subquery sees the row just inserted above.
    await executeTransaction([
      {
        query: 'INSERT INTO avis (prestataire_id, client_id, note, commentaire) VALUES (?, ?, ?, ?)',
        params: [prestataireId, clientId, note, commentaire],
      },
      {
        query: `UPDATE prestataires SET
                  reviews_count = reviews_count + 1,
                  rating = (SELECT AVG(note) FROM avis WHERE prestataire_id = ?)
                WHERE id = ?`,
        params: [prestataireId, prestataireId],
      },
    ]);

    return this.listForPrestataire(prestataireId);
  }

  static async listForPrestataire(prestataireId) {
    return executeQuery(
      `SELECT a.*, u.name AS client_name
       FROM avis a
       JOIN users u ON a.client_id = u.id
       WHERE a.prestataire_id = ?
       ORDER BY a.created_at DESC`,
      [prestataireId]
    );
  }
}

export default AvisService;
