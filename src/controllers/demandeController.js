import { DemandeService } from '../services/demandeService.js';
import { PrestataireService } from '../services/prestataireService.js';
import { ApiResponse, Pagination } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { emitNewDemande } from '../config/socket.js';
import logger from '../utils/logger.js';

class DemandeController {
  create = asyncHandler(async (req, res) => {
    const { prestataireId, categorie, description } = req.body;

    const prestataire = await PrestataireService.getById(prestataireId);
    if (!prestataire || !prestataire.validated) {
      return res.status(404).json(ApiResponse.error('Prestataire introuvable ou non validé', 404));
    }

    const demande = await DemandeService.create({
      clientId: req.user.id,
      prestataireId,
      categorie,
      description,
    });

    try {
      emitNewDemande(prestataire.user_id, demande);
    } catch (err) {
      logger.warn('emitNewDemande failed:', err?.message);
    }

    res.status(201).json(ApiResponse.success(demande, 'Demande envoyée avec succès', 201));
  });

  getById = asyncHandler(async (req, res) => {
    const demande = await DemandeService.getById(req.params.id);
    if (!demande) {
      return res.status(404).json(ApiResponse.error('Demande introuvable', 404));
    }
    if (req.user.type !== 'admin' && req.user.id !== demande.client_id && req.user.id !== demande.prestataire_user_id) {
      return res.status(403).json(ApiResponse.error('Accès refusé', 403));
    }
    res.json(ApiResponse.success(demande, 'Demande récupérée avec succès'));
  });

  listMine = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);

    let result;
    if (req.user.current_mode === 'prestataire' || req.query.as === 'prestataire') {
      const prestataire = await PrestataireService.getByUserId(req.user.id);
      if (!prestataire) return res.json(ApiResponse.success({ demandes: [], total: 0, page, limit }, 'Aucune demande'));
      result = await DemandeService.listForPrestataire(prestataire.id, { page, limit });
    } else {
      result = await DemandeService.listForClient(req.user.id, { page, limit });
    }

    res.json(ApiResponse.success(result, 'Demandes récupérées avec succès'));
  });
}

export default new DemandeController();
