import { AuthService } from '../services/authService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { recordLoginFailure, resetLoginAttempts } from '../middlewares/loginLockout.js';
import logger from '../utils/logger.js';

class AuthController {
  register = asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body);
    const token = AuthService.generateToken(user);

    res.status(201).json(
      ApiResponse.success({ user, token, token_type: 'Bearer' }, 'Compte créé avec succès', 201)
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const loginKey = req._loginKey;

    try {
      const user = await AuthService.login(email, password);
      const token = AuthService.generateToken(user);

      if (loginKey) resetLoginAttempts(loginKey);

      res.json(
        ApiResponse.success({ user, token, token_type: 'Bearer' }, 'Connexion réussie')
      );
    } catch (error) {
      // Don't count "needs password reset" as a brute-force attempt
      if (loginKey && error.code !== 'PASSWORD_RESET_REQUIRED') {
        recordLoginFailure(loginKey);
      }
      throw error;
    }
  });

  getProfile = asyncHandler(async (req, res) => {
    const user = await AuthService.getById(req.user.id);
    if (!user) {
      return res.status(404).json(ApiResponse.error('Utilisateur introuvable', 404));
    }
    res.json(ApiResponse.success(user, 'Profil récupéré avec succès'));
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await AuthService.updateProfile(req.user.id, req.body);
    res.json(ApiResponse.success(user, 'Profil mis à jour avec succès'));
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user.id, currentPassword, newPassword);
    res.json(ApiResponse.success(null, 'Mot de passe modifié avec succès'));
  });

  /** Switch between client/prestataire dashboards — only if the account is validated as a provider. */
  setMode = asyncHandler(async (req, res) => {
    const { mode } = req.body;
    if (mode === 'prestataire' && req.user.type !== 'prestataire') {
      return res.status(403).json(ApiResponse.error('Compte non validé comme prestataire', 403));
    }
    const user = await AuthService.setCurrentMode(req.user.id, mode);
    res.json(ApiResponse.success(user, 'Mode mis à jour'));
  });

  requestPasswordReset = asyncHandler(async (req, res) => {
    const token = await AuthService.requestPasswordReset(req.body.email);
    if (token) {
      // TODO: send `token` via email once SMTP is configured (see README).
      logger.log(`Password reset token for ${req.body.email}: ${token}`);
    }
    // Always the same response, whether or not the email exists.
    res.json(ApiResponse.success(null, 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'));
  });

  resetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const user = await AuthService.resetPassword(token, newPassword);
    const authToken = AuthService.generateToken(user);
    res.json(ApiResponse.success({ user, token: authToken, token_type: 'Bearer' }, 'Mot de passe réinitialisé avec succès'));
  });

  logout = asyncHandler(async (req, res) => {
    res.json(ApiResponse.success(null, 'Déconnexion réussie'));
  });
}

export default new AuthController();
