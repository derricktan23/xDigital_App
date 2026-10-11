/**
 * HTTP request logging middleware.
 * Logs incoming HTTP requests, response status codes, and execution duration.
 */
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

function formatMethod(method: string): string {
  switch (method.toUpperCase()) {
    case 'GET':
      return logger.colorize(logger.colors.green, method.padEnd(6));
    case 'POST':
      return logger.colorize(logger.colors.blue, method.padEnd(6));
    case 'PUT':
      return logger.colorize(logger.colors.yellow, method.padEnd(6));
    case 'PATCH':
      return logger.colorize(logger.colors.magenta, method.padEnd(6));
    case 'DELETE':
      return logger.colorize(logger.colors.red, method.padEnd(6));
    default:
      return logger.colorize(logger.colors.cyan, method.padEnd(6));
  }
}

function formatStatus(status: number): string {
  const str = status.toString();
  if (status >= 500) return logger.colorize(logger.colors.red, str);
  if (status >= 400) return logger.colorize(logger.colors.yellow, str);
  if (status >= 300) return logger.colorize(logger.colors.cyan, str);
  if (status >= 200) return logger.colorize(logger.colors.green, str);
  return str;
}

function formatDuration(ms: number): string {
  const str = `${ms.toFixed(1)}ms`;
  if (ms >= 500) return logger.colorize(logger.colors.red, str);
  if (ms >= 100) return logger.colorize(logger.colors.yellow, str);
  return logger.colorize(logger.colors.dim, str);
}

function truncateString(str: string, maxLength: number = 100): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1_000_000;

    const method = formatMethod(req.method);
    const url = req.originalUrl || req.url;
    const status = formatStatus(res.statusCode);
    const duration = formatDuration(durationMs);

    let details = '';

    // Log query params if present and not empty
    if (req.query && Object.keys(req.query).length > 0) {
      details += ` query=${JSON.stringify(req.query)}`;
    }

    // Log request body for mutation methods (POST, PUT, PATCH) if present
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
      const sanitizedBody = { ...req.body };
      if ('password' in sanitizedBody) sanitizedBody.password = '***';
      details += ` body=${truncateString(JSON.stringify(sanitizedBody))}`;
    }

    const logLine = `${method} ${url} ${status} (${duration})${details ? ' |' + details : ''}`;

    if (res.statusCode >= 500) {
      logger.error(logLine);
    } else if (res.statusCode >= 400) {
      logger.warn(logLine);
    } else {
      logger.info(logLine);
    }
  });

  next();
};
