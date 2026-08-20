/**
 * Schema translated from the existing Firestore collections (users,
 * prestataires, demandes, devis, conversations, conversations/{id}/messages)
 * — see the ProfixGabon state analysis for the source data model. A few
 * deliberate departures from the Firestore shape, each fixing a specific
 * issue found there:
 *
 * - users.type now includes 'admin' as a real role, backed by
 *   authorizeRoles() server-side checks — replaces AdminPage.jsx's
 *   hardcoded ADMIN_EMAIL client-side check, which enforced nothing (the
 *   updateDoc/deleteDoc calls it gated were reachable directly from the
 *   browser console regardless of what the UI redirected to).
 * - quote_counters gives atomic sequential numero_devis generation via
 *   MySQL's LAST_INSERT_ID(expr) idiom (see devisService.js) — the
 *   Firestore version counted all existing quotes and read-then-wrote the
 *   count, which is a race: two concurrent quotes could get the same number.
 * - conversations has a UNIQUE(client_id, prestataire_id) constraint
 *   instead of scanning every conversation client-side to find one with
 *   matching participants.
 * - conversation_reads replaces the nonLu JSON map field with a proper
 *   join table.
 * - users.firebase_uid + users.password nullable: existing users are
 *   migrated by uid, not password — Firebase Auth never exposes usable
 *   password hashes, so migrated accounts start with password = NULL and
 *   must reset on first login here (see authService.js).
 */
import { executeQuery, initDatabase } from '../config/database.js';
import logger from './logger.js';

const migrations = [
  {
    name: 'create_users_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NULL COMMENT 'NULL for users migrated from Firebase until they reset',
        phone VARCHAR(20) NULL,
        type VARCHAR(20) NOT NULL DEFAULT 'client' COMMENT 'client, prestataire, admin',
        current_mode VARCHAR(20) NOT NULL DEFAULT 'client' COMMENT 'client, prestataire — which dashboard a dual-role user is currently viewing',
        validated BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'provider validation — set by admin only, see prestataireService.validateProvider',
        pending_provider BOOLEAN NOT NULL DEFAULT FALSE,
        profile_image VARCHAR(500) NULL,
        firebase_uid VARCHAR(128) NULL UNIQUE COMMENT 'links back to the original Firebase Auth account during migration',
        status VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, suspended',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        INDEX idx_users_type (type),
        INDEX idx_users_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_password_resets_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL COMMENT 'sha256 of the reset token — the raw token is never stored',
        expires_at DATETIME NOT NULL,
        used_at DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_password_resets_user (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_prestataires_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS prestataires (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        nom VARCHAR(150) NOT NULL,
        categorie VARCHAR(100) NOT NULL,
        ville VARCHAR(100) NOT NULL,
        description TEXT,
        experience VARCHAR(100) NULL,
        skills JSON NULL COMMENT 'array of strings',
        photo VARCHAR(500) NULL,
        galerie JSON NULL COMMENT 'array of image URLs',
        piece_identite VARCHAR(500) NULL COMMENT 'ID document — only ever readable by the owner + admin, see prestataireController',
        validated BOOLEAN NOT NULL DEFAULT FALSE,
        available BOOLEAN NOT NULL DEFAULT TRUE,
        rating DECIMAL(3,2) NOT NULL DEFAULT 0,
        reviews_count INT NOT NULL DEFAULT 0 COMMENT 'denormalized count, kept in sync by avisService.create — see avis table',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        FOREIGN KEY (user_id) REFERENCES users(id),
        INDEX idx_prestataires_categorie (categorie),
        INDEX idx_prestataires_ville (ville),
        INDEX idx_prestataires_validated (validated)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_demandes_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS demandes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        prestataire_id INT NOT NULL,
        categorie VARCHAR(100) NULL,
        description TEXT NOT NULL,
        statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' COMMENT 'en_attente, devis_envoye, accepte, refuse',
        devis_id INT NULL COMMENT 'set once a devis is created for this demande — no FK constraint (devis is created after demandes, avoids circular creation order); enforced in demandeService instead',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (prestataire_id) REFERENCES prestataires(id),
        INDEX idx_demandes_client (client_id),
        INDEX idx_demandes_prestataire (prestataire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_devis_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS devis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        numero_devis VARCHAR(50) UNIQUE NOT NULL,
        demande_id INT NULL,
        client_id INT NOT NULL,
        prestataire_id INT NOT NULL,
        montant DECIMAL(12,2) NOT NULL,
        description TEXT,
        statut VARCHAR(20) NOT NULL DEFAULT 'en_attente' COMMENT 'en_attente, accepte, refuse',
        date_emission DATETIME NOT NULL,
        date_expiration DATETIME NOT NULL,
        date_reponse DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (demande_id) REFERENCES demandes(id),
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (prestataire_id) REFERENCES prestataires(id),
        INDEX idx_devis_client (client_id),
        INDEX idx_devis_prestataire (prestataire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_quote_counters_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS quote_counters (
        year INT PRIMARY KEY,
        last_number INT NOT NULL DEFAULT 0
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_conversations_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS conversations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        prestataire_id INT NOT NULL,
        dernier_message TEXT NULL,
        date_dernier_message DATETIME NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES users(id),
        FOREIGN KEY (prestataire_id) REFERENCES users(id),
        UNIQUE KEY uniq_conversation_pair (client_id, prestataire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_conversation_reads_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS conversation_reads (
        conversation_id INT NOT NULL,
        user_id INT NOT NULL,
        unread_count INT NOT NULL DEFAULT 0,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_avis_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS avis (
        id INT AUTO_INCREMENT PRIMARY KEY,
        prestataire_id INT NOT NULL,
        client_id INT NOT NULL,
        note TINYINT NOT NULL COMMENT '1-5',
        commentaire TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (prestataire_id) REFERENCES prestataires(id),
        FOREIGN KEY (client_id) REFERENCES users(id),
        UNIQUE KEY uniq_avis_prestataire_client (prestataire_id, client_id) COMMENT 'one review per client per prestataire, same rule as the old Firestore code',
        INDEX idx_avis_prestataire (prestataire_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
  {
    name: 'create_messages_table',
    mysql: `
      CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        conversation_id INT NOT NULL,
        expediteur_id INT NOT NULL,
        contenu TEXT NOT NULL,
        lu BOOLEAN NOT NULL DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (expediteur_id) REFERENCES users(id),
        INDEX idx_messages_conversation (conversation_id, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `,
  },
];

const runMigrations = async () => {
  console.log('🔄 Starting MySQL database migrations...');

  try {
    await initDatabase();

    for (const migration of migrations) {
      console.log(`📝 Running migration: ${migration.name}`);
      await executeQuery(migration.mysql);
      console.log(`✅ Migration ${migration.name} completed`);
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

runMigrations()
  .then(() => {
    console.log('✅ Database setup complete');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration failed:', error.message);
    process.exit(1);
  });
