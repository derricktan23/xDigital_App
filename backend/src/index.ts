/**
 * Application entry point.
 * Loads environment variables and starts the Express HTTP server.
 */
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other application modules
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

import app from './app';
import { logger } from './utils/logger';
import { initDbSchema } from './config/db';

const PORT = parseInt(process.env.PORT || '5001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, async () => {
  logger.info(`Backend server running on http://localhost:${PORT} [env: ${NODE_ENV}]`);
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim() !== '') {
    logger.info(`[LLMService] GEMINI_API_KEY loaded: ${apiKey.slice(0, 4)}...${apiKey.slice(-4)} (length ${apiKey.length})`);
  } else {
    logger.warn('[LLMService] GEMINI_API_KEY is NOT set in environment variables.');
  }
  await initDbSchema();
});
