/**
 * Seeds 15 demo prestataire profiles (account + validated provider profile
 * each) so the freshly-migrated DB isn't empty on first run. Idempotent —
 * re-running skips any email that already exists rather than erroring or
 * duplicating rows.
 *
 * Every seeded account shares the password below; only meant for local/dev
 * use (see docker-compose.yml's "First run" note). Run with:
 *   docker compose exec backend npm run seed
 */
import bcrypt from 'bcryptjs';
import { executeQuery, initDatabase, closeConnection } from '../config/database.js';
import logger from './logger.js';

const SEED_PASSWORD = 'ProFix2026!';

const PRESTATAIRES = [
  {
    name: 'Jean-Pierre Mboua',
    email: 'jp.mboua@profixgabon.ga',
    phone: '+241 62 14 88 30',
    nom: 'Jean-Pierre Mboua',
    categorie: 'Plomberie',
    ville: 'Libreville',
    description: "Plombier professionnel avec 5 ans d'expérience dans la réparation, l'installation et la maintenance de systèmes sanitaires à Libreville.",
    experience: '5 ans',
    skills: ["Fuites d'eau", 'Sanitaires', 'Chauffe-eau', 'Canalisation', 'Urgences'],
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    rating: 4.8,
    reviews_count: 32,
  },
  {
    name: 'Marc Asseko',
    email: 'marc.asseko@profixgabon.ga',
    phone: '+241 66 27 41 09',
    nom: 'Marc Asseko',
    categorie: 'Électricité',
    ville: 'Port-Gentil',
    description: "Électricien agréé spécialisé dans l'installation et la maintenance électrique résidentielle et commerciale.",
    experience: '7 ans',
    skills: ['Tableau électrique', 'Prises & interrupteurs', 'Éclairage', 'Domotique'],
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&q=80',
    rating: 4.6,
    reviews_count: 18,
  },
  {
    name: 'Fatou Ondo',
    email: 'fatou.ondo@profixgabon.ga',
    phone: '+241 74 03 56 12',
    nom: 'Fatou Ondo',
    categorie: 'Couture',
    ville: 'Franceville',
    description: "Couturière passionnée avec 10 ans d'expérience, spécialisée dans la mode africaine, les tenues de cérémonie et les retouches.",
    experience: '10 ans',
    skills: ['Mode africaine', 'Tenues de cérémonie', 'Couture sur mesure', 'Patron sur mesure'],
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&q=80',
    rating: 4.9,
    reviews_count: 61,
  },
  {
    name: 'Paul Nzigou',
    email: 'paul.nzigou@profixgabon.ga',
    phone: '+241 65 48 90 21',
    nom: 'Paul Nzigou',
    categorie: 'Nettoyage',
    ville: 'Libreville',
    description: 'Spécialiste du nettoyage résidentiel et professionnel, ponctuel et rigoureux.',
    experience: '3 ans',
    skills: ['Ménage complet', 'Vitres', 'Après travaux', 'Désinfection'],
    photo: 'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&q=80',
    rating: 4.7,
    reviews_count: 45,
  },
  {
    name: 'Éric Boundono',
    email: 'eric.boundono@profixgabon.ga',
    phone: '+241 62 71 34 58',
    nom: 'Éric Boundono',
    categorie: 'Plomberie',
    ville: 'Oyem',
    description: 'Expert en plomberie avec une forte expérience dans la réparation de chauffe-eau et les installations sanitaires.',
    experience: '6 ans',
    skills: ['Chauffe-eau', 'Tuyauterie', 'Robinetterie', 'Urgences 24h'],
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
    rating: 4.9,
    reviews_count: 28,
  },
  {
    name: 'Alicia Gombe',
    email: 'alicia.gombe@profixgabon.ga',
    phone: '+241 77 15 62 84',
    nom: 'Alicia Gombe',
    categorie: 'Peinture',
    ville: 'Franceville',
    description: 'Peintre professionnelle, spécialisée dans la décoration intérieure et les façades.',
    experience: '4 ans',
    skills: ['Peinture intérieure', 'Façades', 'Décoration', 'Enduit'],
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&q=80',
    rating: 4.5,
    reviews_count: 22,
  },
  {
    name: 'Sylvie Nguema',
    email: 'sylvie.nguema@profixgabon.ga',
    phone: '+241 66 92 07 43',
    nom: 'Sylvie Nguema',
    categorie: 'Coiffure femme',
    ville: 'Libreville',
    description: "Coiffeuse et esthéticienne depuis 8 ans, à domicile ou en salon, spécialisée dans les tresses africaines et soins capillaires naturels.",
    experience: '8 ans',
    skills: ['Tresses africaines', 'Soins capillaires', 'Coiffure de mariage', 'Extensions'],
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    rating: 4.8,
    reviews_count: 54,
  },
  {
    name: 'David Mve',
    email: 'david.mve@profixgabon.ga',
    phone: '+241 62 38 71 90',
    nom: 'David Mve',
    categorie: 'Menuiserie',
    ville: 'Port-Gentil',
    description: "Menuisier ébéniste, fabrication et réparation de meubles sur mesure, portes et placards.",
    experience: '12 ans',
    skills: ['Meubles sur mesure', 'Portes & placards', 'Restauration', 'Agencement intérieur'],
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    rating: 4.7,
    reviews_count: 39,
  },
  {
    name: 'Christelle Obiang',
    email: 'christelle.obiang@profixgabon.ga',
    phone: '+241 74 56 20 11',
    nom: 'Christelle Obiang',
    categorie: 'Cuisinier',
    ville: 'Libreville',
    description: "Cuisinière traiteur, cuisine gabonaise et internationale pour événements privés, mariages et réceptions d'entreprise.",
    experience: '9 ans',
    skills: ['Cuisine gabonaise', 'Traiteur événementiel', 'Menus sur mesure', 'Grandes quantités'],
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&q=80',
    rating: 4.9,
    reviews_count: 47,
  },
  {
    name: 'Patrick Ella',
    email: 'patrick.ella@profixgabon.ga',
    phone: '+241 65 09 84 27',
    nom: 'Patrick Ella',
    categorie: 'Mécanique auto',
    ville: 'Moanda',
    description: "Mécanicien automobile toutes marques, diagnostic électronique, entretien courant et réparation moteur.",
    experience: '11 ans',
    skills: ['Diagnostic électronique', 'Entretien courant', 'Réparation moteur', 'Freinage'],
    photo: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80',
    rating: 4.6,
    reviews_count: 33,
  },
  {
    name: 'Rachel Moussavou',
    email: 'rachel.moussavou@profixgabon.ga',
    phone: '+241 66 41 78 05',
    nom: 'Rachel Moussavou',
    categorie: 'Photographe',
    ville: 'Libreville',
    description: "Photographe professionnelle spécialisée en mariages, portraits et événements d'entreprise.",
    experience: '6 ans',
    skills: ['Mariages', 'Portraits', 'Événementiel', 'Retouche photo'],
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&q=80',
    rating: 4.9,
    reviews_count: 41,
  },
  {
    name: 'Junior Ngoua',
    email: 'junior.ngoua@profixgabon.ga',
    phone: '+241 62 83 15 67',
    nom: 'Junior Ngoua',
    categorie: 'Réparation téléphone',
    ville: 'Port-Gentil',
    description: "Technicien informatique et téléphonie, réparation d'écrans, batteries, et dépannage ordinateurs à domicile.",
    experience: '5 ans',
    skills: ['Réparation écran', 'Changement batterie', 'Dépannage PC', 'Récupération de données'],
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&q=80',
    rating: 4.5,
    reviews_count: 26,
  },
  {
    name: 'Bernadette Ivala',
    email: 'bernadette.ivala@profixgabon.ga',
    phone: '+241 77 60 42 93',
    nom: 'Bernadette Ivala',
    categorie: 'Nounou',
    ville: 'Lambaréné',
    description: "Nounou expérimentée et bienveillante, garde d'enfants de tous âges, aide aux devoirs.",
    experience: '10 ans',
    skills: ["Garde d'enfants", 'Aide aux devoirs', 'Premiers secours', 'Activités éducatives'],
    photo: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&q=80',
    rating: 4.9,
    reviews_count: 37,
  },
  {
    name: 'Steve Okoumou',
    email: 'steve.okoumou@profixgabon.ga',
    phone: '+241 65 27 99 14',
    nom: 'Steve Okoumou',
    categorie: 'Maçonnerie',
    ville: 'Koulamoutou',
    description: "Maçon expérimenté, construction, rénovation et extension de bâtiments résidentiels.",
    experience: '14 ans',
    skills: ['Construction', 'Rénovation', 'Fondations', 'Carrelage'],
    photo: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=400&q=80',
    rating: 4.7,
    reviews_count: 29,
  },
  {
    name: 'Nadège Bivigou',
    email: 'nadege.bivigou@profixgabon.ga',
    phone: '+241 66 18 53 76',
    nom: 'Nadège Bivigou',
    categorie: 'Jardinage',
    ville: 'Libreville',
    description: "Jardinière paysagiste, entretien d'espaces verts, création de jardins et entretien de piscines.",
    experience: '7 ans',
    skills: ['Entretien espaces verts', 'Création de jardins', 'Taille', 'Entretien piscine'],
    photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80',
    rating: 4.6,
    reviews_count: 19,
  },
];

const seed = async () => {
  console.log('🌱 Starting seed...');
  await initDatabase();

  let created = 0;
  let skipped = 0;

  for (const p of PRESTATAIRES) {
    const existing = await executeQuery('SELECT id FROM users WHERE email = ?', [p.email]);
    if (existing.length > 0) {
      console.log(`⏭️  Skipping ${p.name} — ${p.email} already exists`);
      skipped++;
      continue;
    }

    const hashed = await bcrypt.hash(SEED_PASSWORD, 12);
    const userResult = await executeQuery(
      `INSERT INTO users (name, email, password, phone, type, current_mode, validated)
       VALUES (?, ?, ?, ?, 'prestataire', 'prestataire', TRUE)`,
      [p.name, p.email, hashed, p.phone]
    );

    await executeQuery(
      `INSERT INTO prestataires
         (user_id, nom, categorie, ville, description, experience, skills, photo, galerie, validated, available, rating, reviews_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, ?, ?)`,
      [
        userResult.insertId, p.nom, p.categorie, p.ville, p.description, p.experience,
        JSON.stringify(p.skills), p.photo, JSON.stringify([]), p.rating, p.reviews_count,
      ]
    );

    console.log(`✅ Created ${p.name} (${p.categorie} · ${p.ville})`);
    created++;
  }

  console.log(`🎉 Seed complete — ${created} created, ${skipped} skipped.`);
  if (created > 0) {
    console.log(`   All seeded accounts share the password: ${SEED_PASSWORD}`);
  }
};

seed()
  .then(async () => {
    await closeConnection();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Seed failed:', error.message);
    await closeConnection();
    process.exit(1);
  });
