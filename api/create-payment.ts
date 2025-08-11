import { z } from 'zod';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CreatePaymentSchema } from '../lib/utils/validation.js';
import { generateCorrelationId } from '../lib/utils/ids.js';
import { logInfo, logError } from '../lib/utils/logger.js';
import { createSuccessResponse, createErrorResponse } from '../lib/types/index.js';
import { env } from '../lib/config/env.js';

const handler = async (req: VercelRequest, res: VercelResponse) => {
  const correlationId = generateCorrelationId();

  // Define os headers de CORS para todas as respostas
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Trata a requisição preflight do CORS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json(createErrorResponse('Method not allowed', correlationId));
  }

  try {
    const body = req.body;
    logInfo('Starting payment creation', { correlationId, operation: 'create-payment' });

    const validatedData = CreatePaymentSchema.parse(body);
    logInfo('Data validated successfully', {
      correlationId,
      operation: 'create-payment',
      plan: validatedData.selectedPlan
    });

    logInfo('Calling Firebase Function', { correlationId, operation: 'create-payment' });
    const firebaseResponse = await fetch(
      `${env.FIREBASE_FUNCTIONS_URL}/createCheckout`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Correlation-ID': correlationId
        },
        body: JSON.stringify({ ...validatedData, correlationId })
      }
    );

    const responseText = await firebaseResponse.text();

    if (!firebaseResponse.ok) {
      logError('Firebase Function error', new Error(responseText), {
        correlationId,
        status: firebaseResponse.status
      });
      throw new Error(`Erro do Firebase: ${firebaseResponse.status} ${responseText}`);
    }

    const result = JSON.parse(responseText);
    logInfo('Checkout created successfully', {
      correlationId,
      uniqueUrl: result.uniqueUrl,
      hasInitPoint: !!result.checkoutUrl
    });

    // Retornar no formato esperado pelo frontend
    return res.status(200).json(result);

  } catch (error) {
    logError('Error in create-payment', error as Error, { correlationId });

    if (error instanceof z.ZodError) {
      return res.status(400).json(createErrorResponse(
        'Dados inválidos fornecidos',
        correlationId,
        error.errors
      ));
    }

    return res.status(500).json(createErrorResponse(
      'Erro interno do servidor',
      correlationId,
      error instanceof Error ? error.message : 'Ocorreu um erro desconhecido'
    ));
  }
};

export default handler;