import { executeQuery, executeTransaction } from '../config/database.js';

export class PrestataireService {
  static async createProfile(userId, data) {
    const { nom, categorie, ville, description, experience, skills, photo, galerie, pieceIdentite } = data;

    const result = await executeQuery(
      `INSERT INTO prestataires (user_id, nom, categorie, ville, description, experience, skills, photo, galerie, piece_identite)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, nom, categorie, ville, description, experience || null,
        JSON.stringify(skills || []), photo || null, JSON.stringify(galerie || []), pieceIdentite || null,
      ]
    );

    await executeQuery('UPDATE users SET pending_provider = TRUE WHERE id = ?', [userId]);

    return this.getById(result.insertId);
  }

  static async getById(id) {
    const rows = await executeQuery(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM prestataires p
       JOIN users u ON p.user_id = u.id
       WHERE p.id = ? AND p.deleted_at IS NULL`,
      [id]
    );
    return rows[0] ? this._parse(rows[0]) : null;
  }

  static async getByUserId(userId) {
    const rows = await executeQuery(
      'SELECT * FROM prestataires WHERE user_id = ? AND deleted_at IS NULL LIMIT 1',
      [userId]
    );
    return rows[0] ? this._parse(rows[0]) : null;
  }

  /** Public browse — only validated + available providers, unless includeAll (admin). */
  static async list(filters = {}, pagination = {}) {
    const { categorie, ville, search, includeAll = false } = filters;
    const { page = 1, limit = 20 } = pagination;
    const offset = (page - 1) * limit;

    const conditions = ['p.deleted_at IS NULL'];
    const params = [];

    if (!includeAll) {
      conditions.push('p.validated = TRUE', 'p.available = TRUE');
    }
    if (categorie) { conditions.push('p.categorie = ?'); params.push(categorie); }
    if (ville) { conditions.push('p.ville = ?'); params.push(ville); }
    if (search) {
      conditions.push('(p.nom LIKE ? OR p.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.join(' AND ');

    const countRows = await executeQuery(`SELECT COUNT(*) as total FROM prestataires p WHERE ${where}`, params);
    const total = countRows[0]?.total || 0;

    const rows = await executeQuery(
      `SELECT p.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM prestataires p JOIN users u ON p.user_id = u.id
       WHERE ${where}
       ORDER BY p.rating DESC, p.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { prestataires: rows.map((r) => this._parse(r)), total, page, limit };
  }

  /** Owner-only update — validated/available are deliberately excluded here; see validate()/setAvailability(). */
  static async updateProfile(id, data) {
    const { nom, categorie, ville, description, experience, skills, photo, galerie } = data;
    const fields = [];
    const values = [];

    const set = (col, val) => { if (val !== undefined) { fields.push(`${col} = ?`); values.push(val); } };
    set('nom', nom);
    set('categorie', categorie);
    set('ville', ville);
    set('description', description);
    set('experience', experience);
    if (skills !== undefined) { fields.push('skills = ?'); values.push(JSON.stringify(skills)); }
    set('photo', photo);
    if (galerie !== undefined) { fields.push('galerie = ?'); values.push(JSON.stringify(galerie)); }

    if (fields.length === 0) return this.getById(id);

    values.push(id);
    await executeQuery(`UPDATE prestataires SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    return this.getById(id);
  }

  static async setAvailability(id, available) {
    await executeQuery('UPDATE prestataires SET available = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [available, id]);
    return this.getById(id);
  }

  // -----------------------------------------------------------------------
  // Admin-only. Everything below here used to be a client-side check
  // (AdminPage.jsx's hardcoded ADMIN_EMAIL) with nothing enforcing it
  // server-side — any authenticated user could call the equivalent
  // Firestore updateDoc directly from the browser console. These routes
  // are gated by authorizeRoles('admin') in prestataireRoutes.js.
  // -----------------------------------------------------------------------

  static async getPendingValidation(pagination = {}) {
    return this.list({ includeAll: true }, pagination).then((result) => ({
      ...result,
      prestataires: result.prestataires.filter((p) => !p.validated),
    }));
  }

  static async validate(id) {
    const prestataire = await this.getById(id);
    if (!prestataire) {
      const err = new Error('Prestataire introuvable');
      err.statusCode = 404;
      throw err;
    }

    await executeTransaction([
      {
        query: 'UPDATE prestataires SET validated = TRUE, available = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        params: [id],
      },
      {
        query: `UPDATE users SET type = 'prestataire', validated = TRUE, pending_provider = FALSE, current_mode = 'prestataire', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [prestataire.user_id],
      },
    ]);

    return this.getById(id);
  }

  static async reject(id) {
    const prestataire = await this.getById(id);
    if (!prestataire) {
      const err = new Error('Prestataire introuvable');
      err.statusCode = 404;
      throw err;
    }

    await executeTransaction([
      { query: 'UPDATE prestataires SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', params: [id] },
      {
        query: `UPDATE users SET type = 'client', pending_provider = FALSE, current_mode = 'client', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        params: [prestataire.user_id],
      },
    ]);
  }

  static _parse(row) {
    return {
      ...row,
      skills: this._safeJsonParse(row.skills, []),
      galerie: this._safeJsonParse(row.galerie, []),
    };
  }

  static _safeJsonParse(value, fallback) {
    if (value == null) return fallback;
    if (typeof value !== 'string') return value; // mysql2 may already parse JSON columns
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
}

export default PrestataireService;
