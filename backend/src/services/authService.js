import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { executeQuery } from '../config/database.js';
import { config } from '../config/app.js';

const USER_FIELDS = 'id, name, email, phone, type, current_mode, validated, pending_provider, profile_image, status, created_at, updated_at';

export class AuthService {
  static generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        type: user.type,
        current_mode: user.current_mode,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  /**
   * `type` is deliberately NOT accepted here — every registration is
   * type='client', full stop. Becoming a prestataire only ever happens via
   * PrestataireService.validate(), which requires authorizeRoles('admin').
   * Letting registration set type directly would mean anyone could sign up
   * claiming to already be a validated provider, which is exactly the hole
   * the admin-validation flow exists to close (see prestataireService.js).
   * A prestataire *applicant* still registers as a plain client and then
   * calls POST /prestataires — see prestataireController.create.
   */
  static async register({ name, email, password, phone }) {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      const err = new Error('Un compte existe déjà avec cet email');
      err.statusCode = 409;
      throw err;
    }

    const hashed = await bcrypt.hash(password, 12);
    const result = await executeQuery(
      `INSERT INTO users (name, email, password, phone, type, current_mode)
       VALUES (?, ?, ?, ?, 'client', 'client')`,
      [name, email, hashed, phone || null]
    );

    return this.getById(result.insertId);
  }

  static async login(email, password) {
    const rows = await executeQuery(
      `SELECT * FROM users WHERE email = ? AND deleted_at IS NULL LIMIT 1`,
      [email]
    );
    if (rows.length === 0) {
      const err = new Error('Email ou mot de passe incorrect');
      err.statusCode = 401;
      throw err;
    }

    const user = rows[0];

    if (user.status !== 'active') {
      const err = new Error('Votre compte est désactivé');
      err.statusCode = 403;
      throw err;
    }

    if (!user.password) {
      // Migrated from Firebase Auth — there is no password to compare
      // against (Firebase never exposes usable hashes for migration).
      const err = new Error('Compte migré : veuillez réinitialiser votre mot de passe avant de vous connecter.');
      err.statusCode = 409;
      err.code = 'PASSWORD_RESET_REQUIRED';
      throw err;
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      const err = new Error('Email ou mot de passe incorrect');
      err.statusCode = 401;
      throw err;
    }

    const { password: _pw, ...safeUser } = user;
    return safeUser;
  }

  static async getById(id) {
    const rows = await executeQuery(`SELECT ${USER_FIELDS} FROM users WHERE id = ? AND deleted_at IS NULL`, [id]);
    return rows[0] || null;
  }

  static async updateProfile(userId, { name, phone, profileImage }) {
    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (phone !== undefined) { fields.push('phone = ?'); values.push(phone || null); }
    if (profileImage !== undefined) { fields.push('profile_image = ?'); values.push(profileImage || null); }

    if (fields.length > 0) {
      values.push(userId);
      await executeQuery(`UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values);
    }

    return this.getById(userId);
  }

  static async changePassword(userId, currentPassword, newPassword) {
    const rows = await executeQuery('SELECT password FROM users WHERE id = ?', [userId]);
    const user = rows[0];
    if (!user?.password) {
      const err = new Error('Aucun mot de passe défini pour ce compte — utilisez la réinitialisation.');
      err.statusCode = 409;
      throw err;
    }

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) {
      const err = new Error('Mot de passe actuel incorrect');
      err.statusCode = 401;
      throw err;
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await executeQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, userId]);
  }

  /**
   * Switch a dual-role user's active dashboard (client <-> prestataire).
   * Only meaningful for a user whose type/prestataire profile is already
   * validated — enforced by the controller, not here.
   */
  static async setCurrentMode(userId, mode) {
    await executeQuery('UPDATE users SET current_mode = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [mode, userId]);
    return this.getById(userId);
  }

  // ---------------------------------------------------------------------
  // Password reset — used both for normal "forgot password" and for
  // migrated Firebase accounts (password IS NULL) that must set one before
  // their first login here.
  // ---------------------------------------------------------------------

  static async requestPasswordReset(email) {
    const rows = await executeQuery('SELECT id FROM users WHERE email = ? AND deleted_at IS NULL', [email]);
    if (rows.length === 0) {
      // Don't reveal whether the email exists — caller always gets a generic success message.
      return null;
    }
    const userId = rows[0].id;

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await executeQuery(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );

    // Caller (controller) is responsible for emailing rawToken to the user —
    // no SMTP is wired up yet, see README for the follow-up needed here.
    return rawToken;
  }

  static async resetPassword(rawToken, newPassword) {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const rows = await executeQuery(
      `SELECT * FROM password_resets
       WHERE token_hash = ? AND used_at IS NULL AND expires_at > NOW()
       ORDER BY id DESC LIMIT 1`,
      [tokenHash]
    );
    if (rows.length === 0) {
      const err = new Error('Lien de réinitialisation invalide ou expiré');
      err.statusCode = 400;
      throw err;
    }
    const reset = rows[0];

    const hashed = await bcrypt.hash(newPassword, 12);
    await executeQuery('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [hashed, reset.user_id]);
    await executeQuery('UPDATE password_resets SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [reset.id]);

    return this.getById(reset.user_id);
  }
}

export default AuthService;
