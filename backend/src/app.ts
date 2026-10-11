/**
 * Express application configuration.
 * Sets up global middlewares, health check endpoint, and API routes.
 */
import express from 'express';
import cors from 'cors';
import taskRoutes from './routes/task.routes';
import developerRoutes from './routes/developer.routes';
import skillRoutes from './routes/skill.routes';
import { errorHandler } from './middlewares/errorHandler';
import { requestLogger } from './middlewares/requestLogger';

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestLogger);

// API Routes
app.use('/tasks', taskRoutes);
app.use('/developers', developerRoutes);
app.use('/skills', skillRoutes);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handling middleware
app.use(errorHandler);

export default app;
