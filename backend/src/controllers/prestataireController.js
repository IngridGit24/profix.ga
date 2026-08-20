import { PrestataireService } from '../services/prestataireService.js';
import { ApiResponse, Pagination } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { emitPrestataireValidation } from '../config/socket.js';
import logger from '../utils/logger.js';

class PrestataireController {
  list = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);
    const result = await PrestataireService.list(
      { categorie: req.query.categorie, ville: req.query.ville, search: req.query.search },
      { page, limit }
    );
    res.json(ApiResponse.success(result, 'Prestataires récupérés avec succès'));
  });

  getById = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.getById(req.params.id);
    if (!prestataire) {
      return res.status(404).json(ApiResponse.error('Prestataire introuvable', 404));
    }
    // Only the owner or an admin should see the identity document URL.
    if (!(req.user && (req.user.id === prestataire.user_id || req.user.type === 'admin'))) {
      delete prestataire.piece_identite;
    }
    res.json(ApiResponse.success(prestataire, 'Prestataire récupéré avec succès'));
  });

  getMyProfile = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.getByUserId(req.user.id);
    if (!prestataire) {
      return res.status(404).json(ApiResponse.error('Aucun profil prestataire pour cet utilisateur', 404));
    }
    res.json(ApiResponse.success(prestataire, 'Profil récupéré avec succès'));
  });

  create = asyncHandler(async (req, res) => {
    const existing = await PrestataireService.getByUserId(req.user.id);
    if (existing) {
      return res.status(409).json(ApiResponse.error('Vous avez déjà un profil prestataire', 409));
    }
    const prestataire = await PrestataireService.createProfile(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(prestataire, 'Candidature envoyée — en attente de validation', 201));
  });

  update = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.updateProfile(req.params.id, req.body);
    res.json(ApiResponse.success(prestataire, 'Profil mis à jour avec succès'));
  });

  setAvailability = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.setAvailability(req.params.id, !!req.body.available);
    res.json(ApiResponse.success(prestataire, 'Disponibilité mise à jour'));
  });

  // -- Admin only (see authorizeRoles('admin') in prestataireRoutes.js) --

  getPending = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);
    const result = await PrestataireService.getPendingValidation({ page, limit });
    res.json(ApiResponse.success(result, 'Candidatures en attente récupérées'));
  });

  /**
   * Everything, validated or not, available or not — the public list()
   * only returns validated+available, so an admin reviewing e.g. a
   * validated-but-currently-unavailable provider needs this instead.
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);
    const result = await PrestataireService.list({ includeAll: true }, { page, limit });
    res.json(ApiResponse.success(result, 'Tous les prestataires récupérés'));
  });

  validate = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.validate(req.params.id);
    try {
      emitPrestataireValidation(prestataire.user_id, true);
    } catch (err) {
      logger.warn('emitPrestataireValidation failed:', err?.message);
    }
    res.json(ApiResponse.success(prestataire, 'Prestataire validé avec succès'));
  });

  reject = asyncHandler(async (req, res) => {
    // Capture user_id before reject() soft-deletes the row.
    const prestataire = await PrestataireService.getById(req.params.id);
    if (!prestataire) {
      return res.status(404).json(ApiResponse.error('Prestataire introuvable', 404));
    }
    await PrestataireService.reject(req.params.id);
    try {
      emitPrestataireValidation(prestataire.user_id, false);
    } catch (err) {
      logger.warn('emitPrestataireValidation failed:', err?.message);
    }
    res.json(ApiResponse.success(null, 'Candidature rejetée'));
  });
}

export default new PrestataireController();
