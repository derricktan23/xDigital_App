/**
 * Application logger utility.
 * Formats and outputs colorized console logs with timestamps for different log levels.
 */
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const isTest = process.env.NODE_ENV === 'test';
const configuredLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || (isTest ? 'error' : 'info');
const useColors = process.env.NO_COLOR === undefined && (process.stdout.isTTY || !isTest);

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  gray: '\x1b[90m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function formatTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function colorize(color: string, text: string): string {
  return useColors ? `${color}${text}${colors.reset}` : text;
}

export const logger = {
  debug(message: string, ...meta: any[]): void {
    if (LOG_LEVEL_PRIORITY.debug >= LOG_LEVEL_PRIORITY[configuredLevel]) {
      console.debug(
        `${colorize(colors.gray, formatTimestamp())} ${colorize(colors.dim, '[DEBUG]')} ${message}`,
        ...meta
      );
    }
  },

  info(message: string, ...meta: any[]): void {
    if (LOG_LEVEL_PRIORITY.info >= LOG_LEVEL_PRIORITY[configuredLevel]) {
      console.log(
        `${colorize(colors.gray, formatTimestamp())} ${colorize(colors.blue, '[INFO] ')} ${message}`,
        ...meta
      );
    }
  },

  warn(message: string, ...meta: any[]): void {
    if (LOG_LEVEL_PRIORITY.warn >= LOG_LEVEL_PRIORITY[configuredLevel]) {
      console.warn(
        `${colorize(colors.gray, formatTimestamp())} ${colorize(colors.yellow, '[WARN] ')} ${message}`,
        ...meta
      );
    }
  },

  error(message: string, ...meta: any[]): void {
    if (LOG_LEVEL_PRIORITY.error >= LOG_LEVEL_PRIORITY[configuredLevel]) {
      console.error(
        `${colorize(colors.gray, formatTimestamp())} ${colorize(colors.red, '[ERROR]')} ${message}`,
        ...meta
      );
    }
  },

  colors,
  colorize,
};
