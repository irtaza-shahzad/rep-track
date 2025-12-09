/**
 * Application Logger
 * Centralized logging utility that can be configured for different environments.
 * In production, sensitive logs are suppressed to prevent data exposure.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
    enabledInProduction: boolean;
    minLevel: LogLevel;
}

const LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
};

const config: LoggerConfig = {
    enabledInProduction: false,
    minLevel: 'warn', // Only warn and error in production
};

const isDevelopment = import.meta.env.DEV;

/**
 * Check if logging should be performed based on environment and level
 */
const shouldLog = (level: LogLevel): boolean => {
    if (!isDevelopment && !config.enabledInProduction) {
        // In production, only log errors (critical issues)
        return level === 'error';
    }
    return LOG_LEVELS[level] >= LOG_LEVELS[config.minLevel];
};

/**
 * Sanitize data to remove potentially sensitive information
 */
const sanitize = (data: unknown): unknown => {
    if (data === null || data === undefined) return data;

    if (typeof data === 'string') {
        // Don't log strings that look like tokens or passwords
        if (data.length > 20 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(data)) {
            return '[JWT_TOKEN]';
        }
        return data;
    }

    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
        return data.map(sanitize);
    }

    const sanitized: Record<string, unknown> = {};
    const sensitiveKeys = ['password', 'token', 'authorization', 'secret', 'key', 'credential'];

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sk => lowerKey.includes(sk))) {
            sanitized[key] = '[REDACTED]';
        } else {
            sanitized[key] = sanitize(value);
        }
    }

    return sanitized;
};

/**
 * Application logger with environment-aware behavior
 */
export const logger = {
    /**
     * Debug level - development only, never in production
     */
    debug: (message: string, ...args: unknown[]): void => {
        if (shouldLog('debug')) {
            console.debug(`[DEBUG] ${message}`, ...args.map(sanitize));
        }
    },

    /**
     * Info level - general information
     */
    info: (message: string, ...args: unknown[]): void => {
        if (shouldLog('info')) {
            console.info(`[INFO] ${message}`, ...args.map(sanitize));
        }
    },

    /**
     * Warning level - potential issues
     */
    warn: (message: string, ...args: unknown[]): void => {
        if (shouldLog('warn')) {
            console.warn(`[WARN] ${message}`, ...args.map(sanitize));
        }
    },

    /**
     * Error level - always logged (sanitized in production)
     */
    error: (message: string, error?: unknown): void => {
        if (shouldLog('error')) {
            // In production, only log the message, not the full error object
            if (isDevelopment) {
                console.error(`[ERROR] ${message}`, error);
            } else {
                // Sanitize error details in production
                const safeError = error instanceof Error
                    ? { name: error.name, message: error.message }
                    : sanitize(error);
                console.error(`[ERROR] ${message}`, safeError);
            }
        }
    },
};

export default logger;
