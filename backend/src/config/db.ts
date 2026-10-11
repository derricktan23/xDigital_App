/**
 * Database connection setup.
 * Initializes and exports the PostgreSQL connection pool using environment variables.
 */
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from '../utils/logger';

// Load .env from root directory if available
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const connectionString = process.env.DATABASE_URL;

export const pool = connectionString
  ? new Pool({ connectionString })
  : new Pool({
      host: process.env.POSTGRES_HOST || process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT || process.env.POSTGRES_PORT || 5432),
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB,
    });

export const initDbSchema = async (): Promise<void> => {
  try {
    await pool.query(`
      ALTER TABLE tasks ADD COLUMN IF NOT EXISTS parent_task_id INT REFERENCES tasks(id) ON DELETE CASCADE;
      CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);
    `);
  } catch (err: any) {
    logger.debug('Schema migration check skipped or failed:', err.message);
  }
};

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client pool', err.message);
});

export default pool;
