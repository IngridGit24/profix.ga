import express from 'express';
import { ApiResponse } from '../types/index.js';

const router = express.Router();

// Kept as constants here rather than a DB table — same choice the frontend
// originally made (src/data/data.js); this just gives it a stable API
// shape so the frontend can fetch it instead of hardcoding a duplicate copy.
const VILLES = [
  'Libreville', 'Port-Gentil', 'Franceville', 'Oyem',
  'Moanda', 'Lambaréné', 'Tchibanga', 'Koulamoutou',
];

const CATEGORIES = [
  'Plomberie', 'Électricité', 'Maçonnerie', 'Peinture', 'Menuiserie',
  'Climatisation', 'Serrurerie', 'Soudure', 'Carrelage', 'Toiture',
  'Nettoyage', 'Repassage', 'Lavage auto', 'Nettoyage canapés', 'Dératisation', 'Vidange fosse',
  'Mécanique auto', 'Électricité auto', 'Carrosserie', 'Vulcanisation',
  'Coiffure femme', 'Barbier', 'Esthétique', 'Massage', 'Maquillage',
  'Couture', 'Cuisinier', 'Pâtisserie',
  'Informatique', 'Réparation téléphone', 'Installation WiFi', 'Infographie',
  'Garde-malade', 'Nounou', 'Répétiteur', 'Cours particuliers',
  'Chauffeur', 'Moto-taxi', 'Livraison colis',
  'Gardiennage', 'Vigile événement',
  'Vétérinaire', 'Garde animaux', 'Toilettage',
  'Photographe', 'Vidéaste', 'DJ / Animateur', 'Décoration événement', 'Maître de cérémonie',
  'Jardinage', 'Entretien piscine',
  'Panneau solaire', 'Antenne/Parabole',
];

router.get('/villes', (req, res) => res.json(ApiResponse.success(VILLES, 'Villes récupérées avec succès')));
router.get('/categories', (req, res) => res.json(ApiResponse.success(CATEGORIES, 'Catégories récupérées avec succès')));

export default router;
