// Vercel Edge Function para buscar dados do perfil - Refatorado
import { validateUUID } from '../lib/utils/validation.js';
import { generateCorrelationId } from '../lib/utils/ids.js';
import { logInfo, logError } from '../lib/utils/logger.js';
import { firebaseService } from '../lib/services/firebase.js';
import { redisService } from '../lib/services/redis.js';
import { ProfileResponse, MemorialData, createSuccessResponse, createErrorResponse } from '../lib/types/index.js';
import { env } from '../lib/config/env.js';

export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export default async function handler(req: Request): Promise<Response> {
  const correlationId = generateCorrelationId();
  const url = new URL(req.url);
  const uniqueUrl = url.searchParams.get('id');

  logInfo('New profile request', { correlationId, uniqueUrl, operation: 'get-profile' });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify(
      createErrorResponse('Method not allowed', correlationId)
    ), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (!uniqueUrl || typeof uniqueUrl !== 'string') {
      logError('Missing or invalid ID parameter', undefined, { correlationId });
      return new Response(JSON.stringify(
        createErrorResponse('O parâmetro "id" é obrigatório', correlationId)
      ), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validar formato UUID usando função centralizada
    if (!validateUUID(uniqueUrl)) {
      logError('Invalid UUID format', undefined, { correlationId, uniqueUrl });
      return new Response(JSON.stringify(
        createErrorResponse('Formato de ID inválido', correlationId)
      ), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
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

      return new Response(JSON.stringify(response), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    logInfo('Profile found and returned', { correlationId, uniqueUrl });
    const response: ProfileResponse = {
      success: true,
      data: profileData,
      source: "database", // Will be updated by cache service
      correlationId,
      cached: false // Will be updated by cache service
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    logError('General error in get-profile', error as Error, { correlationId });
    const response: ProfileResponse = {
      success: false,
      error: 'Erro interno do servidor',
      source: "database",
      correlationId,
      cached: false
    };

    return new Response(JSON.stringify(response), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}