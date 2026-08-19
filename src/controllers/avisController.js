import { AvisService } from '../services/avisService.js';
import { PrestataireService } from '../services/prestataireService.js';
import { ApiResponse } from '../types/index.js';
import { asyncHandler } from '../middlewares/errorHandler.js';

class AvisController {
  create = asyncHandler(async (req, res) => {
    const prestataire = await PrestataireService.getById(req.params.prestataireId);
    if (!prestataire || !prestataire.validated) {
      return res.status(404).json(ApiResponse.error('Prestataire introuvable', 404));
    }
    if (prestataire.user_id === req.user.id) {
      return res.status(400).json(ApiResponse.error('Vous ne pouvez pas vous noter vous-même', 400));
    }

    const avis = await AvisService.create({
      prestataireId: req.params.prestataireId,
      clientId: req.user.id,
      note: req.body.note,
      commentaire: req.body.commentaire,
    });
    res.status(201).json(ApiResponse.success(avis, 'Avis publié avec succès', 201));
  });

  list = asyncHandler(async (req, res) => {
    const avis = await AvisService.listForPrestataire(req.params.prestataireId);
    res.json(ApiResponse.success(avis, 'Avis récupérés avec succès'));
  });
}

export default new AvisController();
