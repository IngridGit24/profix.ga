import { PrestataireService } from '../services/prestataireService.js';
import { getSignedIdentityUrl } from '../services/cloudinaryService.js';
import { ApiResponse, Pagination } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { emitPrestataireValidation } from '../config/socket.js';
import logger from '../utils/logger.js';

// piece_identite (ID document) is only ever meant for the owner or an
// admin — never echo the raw stored URL to anyone else, and always
// re-sign it (see cloudinaryService.getSignedIdentityUrl) before handing
// it to someone who IS authorized, since the asset itself is uploaded as
// type: 'authenticated' and the raw URL 401s otherwise.
const withSignedIdentity = (prestataire) => {
  if (!prestataire?.piece_identite) return prestataire;
  return { ...prestataire, piece_identite: getSignedIdentityUrl(prestataire.piece_identite) };
};

const stripIdentity = (prestataire) => {
  const { piece_identite: _pi, ...rest } = prestataire;
  return rest;
};

class PrestataireController {
  list = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);
    const result = await PrestataireService.list(
      { categorie: req.query.categorie, ville: req.query.ville, search: req.query.search },
      { page, limit }
    );
    // Public, unauthenticated browse endpoint — piece_identite has no
    // business being here for anyone, regardless of who's asking. (Was
    // previously only filtered on the single-item getById below, not here —
    // this list leaked every validated provider's ID document URL to any
    // anonymous visitor.)
    result.prestataires = result.prestataires.map(stripIdentity);
    res.json(ApiResponse.success(result, 'Prestataires récupérés avec succès'));
  });

  getById = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.getById(req.params.id);
    if (!prestataire) {
      return res.status(404).json(ApiResponse.error('Prestataire introuvable', 404));
    }
    // Only the owner or an admin should see the identity document URL.
    const isAuthorized = req.user && (req.user.id === prestataire.user_id || req.user.type === 'admin');
    const payload = isAuthorized ? withSignedIdentity(prestataire) : stripIdentity(prestataire);
    res.json(ApiResponse.success(payload, 'Prestataire récupéré avec succès'));
  });

  getMyProfile = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.getByUserId(req.user.id);
    if (!prestataire) {
      return res.status(404).json(ApiResponse.error('Aucun profil prestataire pour cet utilisateur', 404));
    }
    res.json(ApiResponse.success(withSignedIdentity(prestataire), 'Profil récupéré avec succès'));
  });

  create = asyncHandler(async (req, res) => {
    const existing = await PrestataireService.getByUserId(req.user.id);
    if (existing) {
      return res.status(409).json(ApiResponse.error('Vous avez déjà un profil prestataire', 409));
    }
    const prestataire = await PrestataireService.createProfile(req.user.id, req.body);
    res.status(201).json(ApiResponse.success(withSignedIdentity(prestataire), 'Candidature envoyée — en attente de validation', 201));
  });

  update = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.updateProfile(req.params.id, req.body);
    res.json(ApiResponse.success(withSignedIdentity(prestataire), 'Profil mis à jour avec succès'));
  });

  setAvailability = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.setAvailability(req.params.id, !!req.body.available);
    res.json(ApiResponse.success(withSignedIdentity(prestataire), 'Disponibilité mise à jour'));
  });

  // -- Admin only (see authorizeRoles('admin') in prestataireRoutes.js) —
  // every response below is admin-only, so piece_identite is always signed
  // rather than stripped (never stripped for a genuinely unauthorized
  // viewer — that's list()/getById() above).

  getPending = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);
    const result = await PrestataireService.getPendingValidation({ page, limit });
    result.prestataires = result.prestataires.map(withSignedIdentity);
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
    result.prestataires = result.prestataires.map(withSignedIdentity);
    res.json(ApiResponse.success(result, 'Tous les prestataires récupérés'));
  });

  validate = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.validate(req.params.id);
    try {
      emitPrestataireValidation(prestataire.user_id, true);
    } catch (err) {
      logger.warn('emitPrestataireValidation failed:', err?.message);
    }
    res.json(ApiResponse.success(withSignedIdentity(prestataire), 'Prestataire validé avec succès'));
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
