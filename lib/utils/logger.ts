// lib/utils/logger.ts - Structured logging with data masking
interface LogData {
    correlationId?: string;
    operation?: string;
    duration?: number;
    error?: string;
    [key: string]: unknown;
}

const SENSITIVE_FIELDS = [
    'password', 'token', 'secret', 'key', 'signature',
    'email', 'phone', 'cpf', 'credit_card', 'api_key',
    'access_token', 'webhook_secret', 'authorization'
];

function maskSensitiveData(data: unknown): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) return {};

    const objData = data as Record<string, unknown>;
    const masked = { ...objData };
    for (const field of SENSITIVE_FIELDS) {
        if (field in masked) {
            masked[field] = '***MASKED***';
        }
    }
    return masked;
}

export function logInfo(message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        level: 'INFO',
        timestamp,
        message,
        ...maskSensitiveData(data || {})
    };
    console.log(JSON.stringify(logEntry));
}

export function logError(message: string, error?: Error, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        level: 'ERROR',
        timestamp,
        message,
        error: error?.message,
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
        ...maskSensitiveData(data || {})
    };
    console.error(JSON.stringify(logEntry));
}

export function logWarning(message: string, data?: LogData): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
        level: 'WARN',
        timestamp,
        message,
        ...maskSensitiveData(data || {})
    };
    console.warn(JSON.stringify(logEntry));
}