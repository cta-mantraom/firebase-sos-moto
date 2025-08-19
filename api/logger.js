/**
 * Logger Service for API Functions
 * Copy of lib/utils/logger for serverless environment
 */

/**
 * Mask sensitive data in objects
 */
function maskSensitiveData(data) {
  if (!data) return data;
  
  const sensitiveFields = [
    'password', 'token', 'secret', 'apiKey', 'accessToken', 
    'refreshToken', 'privateKey', 'cpf', 'phone', 'email'
  ];
  
  if (typeof data !== 'object') return data;
  
  const masked = Array.isArray(data) ? [...data] : { ...data };
  
  for (const key in masked) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      masked[key] = '***MASKED***';
    } else if (typeof masked[key] === 'object' && masked[key] !== null) {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}

/**
 * Format log message with timestamp and level
 */
function formatLogMessage(level, message, data) {
  const timestamp = new Date().toISOString();
  const logData = maskSensitiveData(data);
  
  return {
    timestamp,
    level,
    message,
    ...(logData && { data: logData })
  };
}

/**
 * Log info level message
 */
export function logInfo(message, data) {
  const log = formatLogMessage('INFO', message, data);
  console.log(JSON.stringify(log));
}

/**
 * Log warning level message
 */
export function logWarning(message, data) {
  const log = formatLogMessage('WARNING', message, data);
  console.warn(JSON.stringify(log));
}

/**
 * Log error level message
 */
export function logError(message, error, data) {
  const errorData = {
    ...data,
    error: {
      message: error?.message,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      name: error?.name,
      code: error?.code
    }
  };
  
  const log = formatLogMessage('ERROR', message, errorData);
  console.error(JSON.stringify(log));
}

/**
 * Log debug level message (only in development)
 */
export function logDebug(message, data) {
  if (process.env.NODE_ENV === 'development') {
    const log = formatLogMessage('DEBUG', message, data);
    console.debug(JSON.stringify(log));
  }
}