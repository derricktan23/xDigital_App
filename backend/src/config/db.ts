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

pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client pool', err.message);
});

export default pool;
