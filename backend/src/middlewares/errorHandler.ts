/**
 * Global error handling middleware.
 * Catches application errors, logs details, and returns structured JSON responses.
 */
import { Request, Response, NextFunction } from 'express';
import { CustomError } from '../types';
import { logger } from '../utils/logger';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof CustomError) {
    logger.warn(`Client Error [${err.statusCode}] on ${req.method} ${req.originalUrl || req.url}: ${err.message}`);
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  logger.error(
    `Unhandled Server Error on ${req.method} ${req.originalUrl || req.url}: ${err.message}`,
    err.stack ? `\n${err.stack}` : ''
  );
  res.status(500).json({ error: 'Internal server error' });
};
