export const VILLES = [
  'Libreville',
  'Port-Gentil',
  'Franceville',
  'Oyem',
  'Moanda',
  'Lambaréné',
  'Tchibanga',
  'Koulamoutou',
]

export const CATEGORIES = [
  // Maison & Bâtiment
  { label: 'Plomberie', bg: '#E6F1FB' },
  { label: 'Électricité', bg: '#EAF3DE' },
  { label: 'Maçonnerie', bg: '#F5EFE6' },
  { label: 'Peinture', bg: '#EEEDFE' },
  { label: 'Menuiserie', bg: '#FBF0E6' },
  { label: 'Climatisation', bg: '#E6F4FB' },
  { label: 'Serrurerie', bg: '#F0F0F0' },
  { label: 'Soudure', bg: '#F5F5DC' },
  { label: 'Carrelage', bg: '#E8F8F5' },
  { label: 'Toiture', bg: '#FDEBD0' },

  // Entretien & Nettoyage
  { label: 'Nettoyage', bg: '#FBEAF0' },
  { label: 'Repassage', bg: '#EAF3DE' },
  { label: 'Lavage auto', bg: '#E8F8F5' },
  { label: 'Nettoyage canapés', bg: '#F9EBEA' },
  { label: 'Dératisation', bg: '#F0F3F4' },
  { label: 'Vidange fosse', bg: '#EBF5FB' },

  // Automobile
  { label: 'Mécanique auto', bg: '#FDFEFE' },
  { label: 'Électricité auto', bg: '#EAF3DE' },
  { label: 'Carrosserie', bg: '#F5EEF8' },
  { label: 'Vulcanisation', bg: '#FBEEE6' },

  // Beauté & Bien-être
  { label: 'Coiffure femme', bg: '#FDEEF8' },
  { label: 'Barbier', bg: '#E8F8F5' },
  { label: 'Esthétique', bg: '#FDEDEC' },
  { label: 'Massage', bg: '#EAF0FB' },
  { label: 'Maquillage', bg: '#FBEAF0' },

  // Couture & Mode
  { label: 'Couture', bg: '#FBF0E6' },

  // Cuisine & Alimentation
  { label: 'Cuisinier', bg: '#FEF9E7' },
  { label: 'Pâtisserie', bg: '#FEF5E7' },

  // Informatique & Tech
  { label: 'Informatique', bg: '#FAECE7' },
  { label: 'Réparation téléphone', bg: '#EAF3DE' },
  { label: 'Installation WiFi', bg: '#E8F8F5' },
  { label: 'Infographie', bg: '#F5EEF8' },

  // Santé & Soins
  { label: 'Garde-malade', bg: '#E8F8F5' },

  // Enfants & Famille
  { label: 'Nounou', bg: '#FDEEF8' },
  { label: 'Répétiteur', bg: '#EAF3DE' },
  { label: 'Cours particuliers', bg: '#EBF5FB' },

  // Transport & Mobilité
  { label: 'Chauffeur', bg: '#F5EFE6' },
  { label: 'Moto-taxi', bg: '#FBEEE6' },
  { label: 'Livraison colis', bg: '#F0F3F4' },

  // Sécurité
  { label: 'Gardiennage', bg: '#F2F3F4' },
  { label: 'Vigile événement', bg: '#EAEDED' },

  // Animaux
  { label: 'Vétérinaire', bg: '#E8F8F5' },
  { label: 'Garde animaux', bg: '#FEF9E7' },
  { label: 'Toilettage', bg: '#FBEAF0' },

  // Événementiel
  { label: 'Photographe', bg: '#EAF0FB' },
  { label: 'Vidéaste', bg: '#F5EEF8' },
  { label: 'DJ / Animateur', bg: '#FDEEF8' },
  { label: 'Décoration événement', bg: '#FEF5E7' },
  { label: 'Maître de cérémonie', bg: '#F9EBEA' },

  // Extérieur
  { label: 'Jardinage', bg: '#FAEEDA' },
  { label: 'Entretien piscine', bg: '#E6F4FB' },

  // Énergie
  { label: 'Panneau solaire', bg: '#FEF9E7' },
  { label: 'Antenne/Parabole', bg: '#F0F3F4' },
]

export const PROVIDERS = [
  {
    id: 1,
    initials: 'JP',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    name: 'Jean-Pierre Mboua',
    role: 'Plombier certifié',
    category: 'Plomberie',
    ville: 'Libreville',
    bg: '#E6F1FB',
    rating: 4.8,
    reviews: 32,
    missions: 120,
    exp: '5 ans',
    available: true,
    about: "Plombier professionnel avec 5 ans d'expérience dans la réparation, l'installation et la maintenance de systèmes sanitaires à Libreville.",
    skills: ['Fuites d\'eau', 'Sanitaires', 'Chauffe-eau', 'Canalisation', 'Urgences'],
    galerie: [
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&q=80',
    ],
    avis: [
      { name: 'Amara K.', stars: 5, text: 'Très professionnel, rapide et efficace. Je recommande vivement !' },
      { name: 'Stéphanie O.', stars: 4, text: 'Bon travail, tarifs raisonnables. Quelques minutes de retard.' }
    ]
  },
  {
    id: 2,
    initials: 'MA',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80',
    name: 'Marc Asseko',
    role: 'Électricien agréé',
    category: 'Électricité',
    ville: 'Port-Gentil',
    bg: '#EAF3DE',
    rating: 4.6,
    reviews: 18,
    missions: 85,
    exp: '7 ans',
    available: true,
    about: "Électricien agréé spécialisé dans l'installation et la maintenance électrique résidentielle et commerciale.",
    skills: ['Tableau électrique', 'Prises & interrupteurs', 'Éclairage', 'Domotique'],
    galerie: [
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&q=80',
    ],
    avis: [
      { name: 'Paul N.', stars: 5, text: 'Très compétent et ponctuel. Travail soigné.' },
      { name: 'Marie E.', stars: 4, text: 'Bon rapport qualité. Je referai appel à lui.' }
    ]
  },
  {
    id: 3,
    initials: 'FO',
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&q=80',
    name: 'Fatou Ondo',
    role: 'Couturière & styliste',
    category: 'Couture',
    ville: 'Franceville',
    bg: '#FBF0E6',
    rating: 4.9,
    reviews: 61,
    missions: 200,
    exp: '10 ans',
    available: true,
    about: "Couturière passionnée avec 10 ans d'expérience, spécialisée dans la mode africaine, les tenues de cérémonie et les retouches.",
    skills: ['Mode africaine', 'Tenues de cérémonie', 'Couture sur mesure', 'Patron sur mesure'],
    galerie: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
      'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&q=80',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80',
    ],
    avis: [
      { name: 'Carine M.', stars: 5, text: 'Magnifique travail sur ma robe de mariage. Exactement ce que je voulais !' },
      { name: 'Judith A.', stars: 5, text: 'Professionnelle, créative et à l\'écoute.' }
    ]
  },
  {
    id: 4,
    initials: 'PN',
    photo: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=200&q=80',
    name: 'Paul Nzigou',
    role: 'Agent de nettoyage',
    category: 'Nettoyage',
    ville: 'Libreville',
    bg: '#FBEAF0',
    rating: 4.7,
    reviews: 45,
    missions: 300,
    exp: '3 ans',
    available: false,
    about: "Spécialiste du nettoyage résidentiel et professionnel, ponctuel et rigoureux.",
    skills: ['Ménage complet', 'Vitres', 'Après travaux', 'Désinfection'],
    galerie: [
      'https://images.unsplash.com/photo-1527515637462-cff94edd56f9?w=400&q=80',
      'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80',
      'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
    ],
    avis: [
      { name: 'Rose B.', stars: 5, text: 'Impeccable ! La maison brille.' }
    ]
  },
  {
    id: 5,
    initials: 'EB',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    name: 'Éric Boundono',
    role: 'Plombier',
    category: 'Plomberie',
    ville: 'Oyem',
    bg: '#E1F5EE',
    rating: 4.9,
    reviews: 28,
    missions: 90,
    exp: '6 ans',
    available: true,
    about: "Expert en plomberie avec une forte expérience dans la réparation de chauffe-eau et les installations sanitaires.",
    skills: ['Chauffe-eau', 'Tuyauterie', 'Robinetterie', 'Urgences 24h'],
    galerie: [
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&q=80',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&q=80',
      'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&q=80',
    ],
    avis: [
      { name: 'Simon K.', stars: 5, text: 'Intervention rapide, problème résolu en 1h.' }
    ]
  },
  {
    id: 6,
    initials: 'AG',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80',
    name: 'Alicia Gombe',
    role: 'Peintre en bâtiment',
    category: 'Peinture',
    ville: 'Franceville',
    bg: '#EEEDFE',
    rating: 4.5,
    reviews: 22,
    missions: 60,
    exp: '4 ans',
    available: true,
    about: "Peintre professionnelle, spécialisée dans la décoration intérieure et les façades.",
    skills: ['Peinture intérieure', 'Façades', 'Décoration', 'Enduit'],
    galerie: [
      'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?w=400&q=80',
      'https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&q=80',
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=400&q=80',
    ],
    avis: [
      { name: 'Hélène M.', stars: 5, text: 'Travail propre et soigné, belles finitions.' }
    ]
  },
]