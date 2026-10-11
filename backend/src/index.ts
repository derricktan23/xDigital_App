import app from './app';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const PORT = parseInt(process.env.PORT || '5001', 10);
const NODE_ENV = process.env.NODE_ENV || 'development';

app.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT} [env: ${NODE_ENV}]`);
});
