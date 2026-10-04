import bcrypt from 'bcryptjs';
import { executeQuery, initDatabase, closeConnection } from '../config/database.js';
import logger from './logger.js';

const seedAdmin = async () => {
  const email = (process.env.ADMIN_EMAIL || 'admin@profix.com').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password.length < 8 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, and numeric characters');
  }

  await initDatabase();

  const existing = await executeQuery(
    'SELECT id, status, deleted_at FROM users WHERE email = ? LIMIT 1',
    [email]
  );
  const hashedPassword = await bcrypt.hash(password, 12);

  if (existing.length > 0) {
    if (existing[0].status !== 'active' || existing[0].deleted_at) {
      throw new Error(`Admin account ${email} is suspended or deleted; restore it before seeding`);
    }

    await executeQuery(
      `UPDATE users
       SET name = 'ProFix Admin', password = ?, type = 'admin', current_mode = 'client',
           pending_provider = FALSE
       WHERE id = ?`,
      [hashedPassword, existing[0].id]
    );
    console.log(`Admin account updated: ${email}`);
  } else {
    await executeQuery(
      `INSERT INTO users (name, email, password, type, current_mode, status)
       VALUES ('ProFix Admin', ?, ?, 'admin', 'client', 'active')`,
      [email, hashedPassword]
    );
    console.log(`Admin account created: ${email}`);
  }
};

seedAdmin()
  .then(async () => {
    await closeConnection();
    process.exit(0);
  })
  .catch(async (error) => {
    logger.error('Admin seed failed:', error.message);
    await closeConnection();
    process.exit(1);
  });