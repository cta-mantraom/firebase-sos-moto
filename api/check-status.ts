// Vercel Edge Function para verificar status do processamento
export const config = {
  runtime: 'edge',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const uniqueUrl = url.searchParams.get('id');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    if (!uniqueUrl || typeof uniqueUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'O parâmetro "id" é obrigatório' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Use as variáveis de ambiente corretas do Vercel
    const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!redisUrl || !redisToken) {
      console.error('Variáveis de ambiente do Redis não encontradas');
      return new Response(JSON.stringify({ error: 'Configuração interna do servidor incompleta' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Verificando status para: ${uniqueUrl}`);

    const redisResponse = await fetch(`${redisUrl}/get/qr_code:${uniqueUrl}`, {
      headers: {
        'Authorization': `Bearer ${redisToken}`
      }
    });

    if (!redisResponse.ok) {
      console.error('Erro ao conectar com Redis:', redisResponse.status);
      return new Response(JSON.stringify({ status: 'processando' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const redisData = await redisResponse.json();
    console.log('Redis response:', redisData);

    if (redisData.result) {
      return new Response(JSON.stringify({ status: 'pronto' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } else {
      return new Response(JSON.stringify({ status: 'processando' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

  } catch (error) {
    console.error('Erro em check-status:', error);
    return new Response(JSON.stringify({ status: 'processando' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}