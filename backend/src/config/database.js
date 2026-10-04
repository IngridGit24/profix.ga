import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'profix_db',
  user: process.env.DB_USER || 'profix_user',
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
};

let mysqlPool = null;

export const initDatabase = async () => {
  try {
    logger.log('Attempting to connect to MySQL...');

    mysqlPool = mysql.createPool(dbConfig);

    const connection = await Promise.race([
      mysqlPool.getConnection(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000)
      ),
    ]);

    await connection.query('SELECT NOW()');
    connection.release();

    logger.log('MySQL database connected successfully');
    return mysqlPool;
  } catch (error) {
    // Log only the message, never connection details (host/user/password)
    logger.error('MySQL database connection failed:', error.message);
    throw error;
  }
};

export const testConnection = async () => {
  try {
    if (!mysqlPool) {
      await initDatabase();
    }
    const connection = await mysqlPool.getConnection();
    await connection.query('SELECT 1 as test');
    connection.release();
    logger.log('MySQL database connection test successful');
    return true;
  } catch (error) {
    logger.error('Database connection test failed:', error.message);
    return false;
  }
};

export const executeQuery = async (query, params = [], options = {}) => {
  const { suppressErrorLog = false } = options;
  try {
    if (!mysqlPool) {
      await initDatabase();
    }

    const [result] = await mysqlPool.query(query, params);

    if (query.trim().toUpperCase().startsWith('SELECT')) {
      return result;
    } else if (query.trim().toUpperCase().startsWith('INSERT')) {
      return {
        lastID: result.insertId || null,
        insertId: result.insertId || null,
        changes: result.affectedRows || 0,
        affectedRows: result.affectedRows || 0,
        rowCount: result.affectedRows || 0,
      };
    } else {
      return {
        lastID: null,
        changes: result.affectedRows || 0,
        affectedRows: result.affectedRows || 0,
        rowCount: result.affectedRows || 0,
      };
    }
  } catch (error) {
    if (!suppressErrorLog) {
      logger.error('Database query error:', error.message);
    }
    throw error;
  }
};

export const executeTransaction = async (queries) => {
  try {
    if (!mysqlPool) {
      await initDatabase();
    }

    const connection = await mysqlPool.getConnection();

    try {
      await connection.beginTransaction();
      const results = [];

      for (const { query, params } of queries) {
        const [result] = await connection.query(query, params);
        results.push(result);
      }

      await connection.commit();
      return results;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    logger.error('Transaction error:', error.message);
    throw error;
  }
};

export const getConnection = () => mysqlPool;

export const closeConnection = async () => {
  if (mysqlPool) {
    await mysqlPool.end();
    mysqlPool = null;
  }
};

export default {
  initDatabase,
  testConnection,
  executeQuery,
  executeTransaction,
  getConnection,
  closeConnection,
};
