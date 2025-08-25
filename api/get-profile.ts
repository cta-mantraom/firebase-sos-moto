// Vercel Function para buscar dados do perfil
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateCorrelationId } from '../lib/utils/ids.js';
import { logInfo, logError } from '../lib/utils/logger.js';
import { firebaseService } from '../lib/services/firebase.js';
import { redisService } from '../lib/services/redis.js';

// UUID validation function (moved inline after validation.js deletion)
function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  // Also accept simple alphanumeric IDs for backward compatibility
  const simpleIdRegex = /^[a-zA-Z0-9_-]{8,}$/;
  return uuidRegex.test(uuid) || simpleIdRegex.test(uuid);
}

// Type definitions (moved inline after types/index.js deletion)
interface ProfileResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  source: string;
  correlationId: string;
  cached: boolean;
}

function createErrorResponse(message: string, correlationId: string): ProfileResponse {
  return {
    success: false,
    error: message,
    source: 'database',
    correlationId,
    cached: false
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const correlationId = generateCorrelationId();
  const uniqueUrl = req.query.id as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  logInfo('New profile request', { correlationId, uniqueUrl, operation: 'get-profile' });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json(createErrorResponse('Method not allowed', correlationId));
  }

  try {
    if (!uniqueUrl || typeof uniqueUrl !== 'string') {
      logError('Missing or invalid ID parameter', undefined, { correlationId });
      return res.status(400).json(createErrorResponse('O parâmetro "id" é obrigatório', correlationId));
    }

    // Validar formato UUID usando função centralizada
    if (!validateUUID(uniqueUrl)) {
      logError('Invalid UUID format', undefined, { correlationId, uniqueUrl });
      return res.status(400).json(createErrorResponse('Formato de ID inválido', correlationId));
    }

    // Use cache-first strategy with automatic fallback
    const profileData = await redisService.getOrSet(
      `qr_code:${uniqueUrl}`,
      () => firebaseService.getProfile(uniqueUrl, correlationId),
      86400, // 24h TTL
      correlationId
    );

    if (!profileData) {
      logInfo('Profile not found', { correlationId, uniqueUrl });
      const response: ProfileResponse = {
        success: false,
        error: 'Perfil não encontrado ou ainda não processado.',
        source: "database",
        correlationId,
        cached: false
      };

      return res.status(404).json(response);
    }

    logInfo('Profile found and returned', { correlationId, uniqueUrl });
    const response: ProfileResponse = {
      success: true,
      data: profileData,
      source: "database", // Will be updated by cache service
      correlationId,
      cached: false // Will be updated by cache service
    };

    return res.status(200).json(response);

  } catch (error) {
    logError('General error in get-profile', error as Error, { correlationId });
    const response: ProfileResponse = {
      success: false,
      error: 'Erro interno do servidor',
      source: "database",
      correlationId,
      cached: false
    };

    return res.status(500).json(response);
  }
}