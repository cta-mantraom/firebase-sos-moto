 📚 REGRAS ARQUITETURAIS CRÍTICAS PARA DOCUMENTAÇÃO

  🏗️ ARQUITETURA SERVERLESS - REGRAS FUNDAMENTAIS

  ---
  1. PRINCÍPIOS SERVERLESS (VERCEL FUNCTIONS)

  1.1 Stateless & Isolation

  ⚠️ REGRA CRÍTICA: FUNCTIONS SÃO STATELESS
  - Cada invocação de função é COMPLETAMENTE ISOLADA
  - NÃO existe estado compartilhado entre execuções
  - NÃO existe memória persistente entre chamadas
  - Cada função deve inicializar seus próprios recursos

  1.2 Inicialização de Recursos

  // ✅ CORRETO - Factory Pattern para Firebase
  // lib/services/firebase.ts
  export function getFirebaseApp() {
    if (!getApps().length) {
      return initializeApp({...});
    }
    return getApps()[0];
  }

  // api/any-endpoint.ts
  const app = getFirebaseApp(); // Cada função inicializa

  // ❌ INCORRETO - Tentar centralizar estado
  // NÃO funcionará em Serverless

  ---
  2. ESTRUTURA DE PASTAS E RESPONSABILIDADES

  2.1 Pasta api/ - Endpoints & Workers

  📁 api/
  ├── *.ts              → HTTP Endpoints (rotas acessíveis)
  └── processors/       → Workers assíncronos (recebem jobs)
      ├── email-sender.ts    → DEVE ser endpoint (QStash precisa URL)
      └── final-processor.ts → DEVE ser endpoint (processa jobs)

  ⚠️ REGRAS:
  - TODOS arquivos em api/ são ENDPOINTS públicos
  - DEVEM validar entrada com Zod
  - DEVEM delegar lógica para lib/services/
  - NÃO devem conter lógica de negócio complexa
  - Workers PRECISAM ser endpoints para receber webhooks

  2.2 Pasta lib/ - Lógica de Negócio

  📁 lib/
  ├── domain/          → Entidades e interfaces de domínio
  ├── services/        → Lógica de negócio e integrações
  ├── repositories/    → Acesso a dados
  ├── types/          → TypeScript types e schemas Zod
  ├── utils/          → Utilitários compartilhados
  └── config/         → Configurações e variáveis

  ⚠️ REGRAS:
  - NÃO são endpoints acessíveis
  - Contêm TODA lógica de negócio
  - São importados pelos endpoints
  - Devem ser PUROS e TESTÁVEIS
  - Schemas Zod APENAS em lib/types/ ou lib/schemas/

  ---
  3. INTEGRAÇÃO COM SERVIÇOS VERCEL MARKETPLACE

  3.1 Upstash Redis (via Vercel Integration)

  // ✅ CONFIGURAÇÃO CORRETA
  import { Redis } from '@upstash/redis';

  // Variáveis automáticas do Vercel
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ⚠️ ESPECIFICAÇÕES:
  - REST API (não conexão persistente)
  - Rate limit: 1000 req/s
  - Max payload: 1MB
  - TTL máximo: 365 dias
  - Comandos via HTTP (latência ~50ms)

  3.2 QStash (via Vercel Integration)

  // ✅ CONFIGURAÇÃO CORRETA
  import { Client } from '@upstash/qstash';

  const qstash = new Client({
    token: process.env.QSTASH_TOKEN,
  });

  // Publicar para worker endpoint
  await qstash.publishJSON({
    url: `${process.env.VERCEL_URL}/api/processors/final-processor`,
    body: jobData,
  });

  ⚠️ ESPECIFICAÇÕES:
  - Workers DEVEM ser endpoints em api/processors/
  - Retry automático: 3x com backoff exponencial
  - Timeout máximo: 2 minutos (Vercel limit)
  - Payload máximo: 1MB
  - Assinatura HMAC para segurança

  ---
  4. INTEGRAÇÕES EXTERNAS

  4.1 AWS SES (Email)

  // ✅ LOCALIZAÇÃO CORRETA
  // lib/services/notification/email.service.ts - Lógica
  // api/processors/email-sender.ts - Endpoint worker

  ⚠️ REGRAS:
  - Configuração AWS em lib/services/
  - Templates em lib/domain/notification/
  - Worker endpoint em api/processors/
  - Region: sa-east-1 (São Paulo)

  4.2 MercadoPago

  // ✅ FLUXO CORRETO
  // 1. Webhook → api/mercadopago-webhook.ts
  // 2. Service → lib/services/payment/mercadopago.service.ts
  // 3. Processor → lib/services/payment/payment.processor.ts
  // 4. Worker → api/processors/final-processor.ts

  ⚠️ REGRAS:
  - SEMPRE validar HMAC em webhooks
  - Device ID OBRIGATÓRIO em pagamentos
  - Usar MercadoPagoService (nunca API direta)
  - Timeout webhook: 22 segundos

  ---
  5. PADRÕES DE PROCESSAMENTO ASSÍNCRONO

  5.1 Event-Driven Pattern

  FLUXO OBRIGATÓRIO:
  1. Evento → Validação → Service → Enfileirar Job
  2. Worker → Processar Job → Atualizar Estado
  3. NÃO processar síncronamente em webhooks

  SEPARAÇÃO DE RESPONSABILIDADES:
  - payment.processor.ts → Processa EVENTO (enfileira job)
  - final-processor.ts → Processa JOB (cria perfil)
  - NÃO é duplicação, é arquitetura correta!

  5.2 Retry & Error Handling

  // ✅ PADRÃO CORRETO
  function isRetryableError(error: Error): boolean {
    // Network errors = retry
    // Validation errors = não retry
    // Rate limits = retry com delay
  }

  ⚠️ TIMEOUTS VERCEL:
  - API Routes: 10 segundos (Pro: 60s)
  - Edge Functions: 30 segundos
  - Background Functions: 15 minutos (Enterprise)

  ---
  6. SCHEMAS E VALIDAÇÃO

  6.1 Localização de Schemas

  ✅ CORRETO:
  - lib/types/*.ts → Schemas Zod centralizados
  - lib/schemas/*.ts → Schemas específicos de domínio

  ❌ INCORRETO:
  - api/*.ts → NÃO definir schemas nos endpoints
  - Duplicar schemas em múltiplos arquivos

  6.2 Validação de Dados

  // ✅ PADRÃO OBRIGATÓRIO
  // api/any-endpoint.ts
  import { CreatePaymentSchema } from '@/lib/types/api.types';

  const validated = CreatePaymentSchema.parse(req.body);
  // NUNCA usar dados sem validar

  ---
  7. CHECKLIST DE CONFORMIDADE

  Para todo arquivo em api/:

  - É um endpoint acessível via HTTP?
  - Valida entrada com Zod?
  - Delega lógica para lib/services/?
  - Inicializa Firebase com helper?
  - Retorna respostas padronizadas?

  Para todo arquivo em lib/:

  - Contém apenas lógica de negócio?
  - Não expõe endpoints HTTP?
  - Exports bem definidos?
  - Tipos TypeScript completos?
  - Sem duplicação de schemas?

  ---
  8. VARIÁVEIS DE AMBIENTE CRÍTICAS

  # Vercel Marketplace (automáticas)
  UPSTASH_REDIS_REST_URL=
  UPSTASH_REDIS_REST_TOKEN=
  QSTASH_TOKEN=
  QSTASH_CURRENT_SIGNING_KEY=
  QSTASH_NEXT_SIGNING_KEY=

  # Configurar manualmente
  VERCEL_URL= # Base URL para workers
  FIREBASE_PROJECT_ID=
  MERCADOPAGO_WEBHOOK_SECRET=
  AWS_SES_REGION=sa-east-1

  ---
  ⚠️ AVISOS FINAIS CRÍTICOS

  1. NUNCA assumir estado entre invocações de função
  2. SEMPRE validar dados externos com Zod
  3. NUNCA processar síncronamente em webhooks
  4. SEMPRE usar helpers para inicialização
  5. NUNCA definir schemas duplicados
  6. SEMPRE manter workers como endpoints em api/processors/
  7. NUNCA colocar lógica de negócio em api/
  8. SEMPRE usar types de lib/types/

  Esta documentação é MANDATÓRIA para manter a arquitetura Serverless funcionando corretamente!