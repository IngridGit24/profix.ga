import { DevisService } from '../services/devisService.js';
import { PrestataireService } from '../services/prestataireService.js';
import { ApiResponse, Pagination } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';
import { emitNewDevis, emitDevisStatusChange } from '../config/socket.js';
import logger from '../utils/logger.js';

class DevisController {
  create = asyncHandler(async (req, res) => {
    const { demandeId, clientId, montant, description } = req.body;

    const prestataire = await PrestataireService.getByUserId(req.user.id);
    if (!prestataire) {
      return res.status(403).json(ApiResponse.error('Vous devez être un prestataire pour créer un devis', 403));
    }

    const devis = await DevisService.create({
      demandeId: demandeId || null,
      clientId,
      prestataireId: prestataire.id,
      montant,
      description,
    });

    try {
      emitNewDevis(clientId, devis);
    } catch (err) {
      logger.warn('emitNewDevis failed:', err?.message);
    }

    res.status(201).json(ApiResponse.success(devis, 'Devis créé avec succès', 201));
  });

  getById = asyncHandler(async (req, res) => {
    const devis = await DevisService.getById(req.params.id);
    if (!devis) {
      return res.status(404).json(ApiResponse.error('Devis introuvable', 404));
    }
    if (req.user.type !== 'admin' && req.user.id !== devis.client_id && req.user.id !== devis.prestataire_user_id) {
      return res.status(403).json(ApiResponse.error('Accès refusé', 403));
    }
    res.json(ApiResponse.success(devis, 'Devis récupéré avec succès'));
  });

  listMine = asyncHandler(async (req, res) => {
    const { page, limit } = Pagination.create(req.query.page, req.query.limit);

    let result;
    if (req.user.current_mode === 'prestataire' || req.query.as === 'prestataire') {
      const prestataire = await PrestataireService.getByUserId(req.user.id);
      if (!prestataire) return res.json(ApiResponse.success({ devis: [], total: 0, page, limit }, 'Aucun devis'));
      result = await DevisService.listForPrestataire(prestataire.id, { page, limit });
    } else {
      result = await DevisService.listForClient(req.user.id, { page, limit });
    }

    res.json(ApiResponse.success(result, 'Devis récupérés avec succès'));
  });

  accepter = asyncHandler(async (req, res) => {
    if (!(await this._clientOwnsDevis(req, res))) return;

    const updated = await DevisService.accepter(req.params.id);
    try {
      emitDevisStatusChange(updated.prestataire_user_id, updated);
    } catch (err) {
      logger.warn('emitDevisStatusChange failed:', err?.message);
    }
    res.json(ApiResponse.success(updated, 'Devis accepté avec succès'));
  });

  refuser = asyncHandler(async (req, res) => {
    if (!(await this._clientOwnsDevis(req, res))) return;

    const updated = await DevisService.refuser(req.params.id);
    try {
      emitDevisStatusChange(updated.prestataire_user_id, updated);
    } catch (err) {
      logger.warn('emitDevisStatusChange failed:', err?.message);
    }
    res.json(ApiResponse.success(updated, 'Devis refusé'));
  });

  /** Returns true (and writes nothing) if req.user is the devis's client; otherwise responds with the right error and returns false. */
  async _clientOwnsDevis(req, res) {
    const devis = await DevisService.getById(req.params.id);
    if (!devis) {
      res.status(404).json(ApiResponse.error('Devis introuvable', 404));
      return false;
    }
    if (req.user.id !== devis.client_id) {
      res.status(403).json(ApiResponse.error('Seul le client destinataire peut répondre à ce devis', 403));
      return false;
    }
    return true;
  }
}

export default new DevisController();
