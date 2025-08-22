// Vercel Function para verificar status do processamento
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { env, config } from '../lib/config/env.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const uniqueUrl = req.query.id as string;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!uniqueUrl || typeof uniqueUrl !== 'string') {
      return res.status(400).json({ error: 'O parâmetro "id" é obrigatório' });
    }

    // Use as variáveis de ambiente corretas do Vercel
    const redisUrl = config.redis.url;
    const redisToken = config.redis.token;

    if (!redisUrl || !redisToken) {
      console.error('Variáveis de ambiente do Redis não encontradas');
      return res.status(500).json({ error: 'Configuração interna do servidor incompleta' });
    }

    // Status check initiated

    const redisResponse = await fetch(`${redisUrl}/get/qr_code:${uniqueUrl}`, {
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });

    if (!redisResponse.ok) {
      console.error('Erro ao conectar com Redis:', redisResponse.status);
      return res.status(200).json({ status: 'processando' });
    }

    const redisData = await redisResponse.json();
    // Redis response processed

    if (redisData.result) {
      return res.status(200).json({ status: 'pronto' });
    } else {
      return res.status(200).json({ status: 'processando' });
    }

  } catch (error) {
    console.error('Erro em check-status:', error);
    return res.status(200).json({ status: 'processando' });
  }
}