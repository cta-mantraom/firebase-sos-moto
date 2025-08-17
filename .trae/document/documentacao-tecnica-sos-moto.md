# Documentação Técnica - Sistema SOS Moto

---

## ⚠️ Regras CRÍTICAS Arquiteturais

> **DEVE SER SEGUIDA EM TODA IMPLEMENTAÇÃO**

### **🏗️ ARQUITETURA SERVERLESS (VERCEL FUNCTIONS) - REGRAS FUNDAMENTAIS**

#### **1. Princípios Serverless Obrigatórios:**

**⚠️ REGRA CRÍTICA: FUNCTIONS SÃO STATELESS**
- Cada invocação de função é COMPLETAMENTE ISOLADA
- NÃO existe estado compartilhado entre execuções
- NÃO existe memória persistente entre chamadas
- Cada função deve inicializar seus próprios recursos

**Factory Pattern Obrigatório para Firebase:**
```typescript
// ✅ CORRETO - lib/services/firebase.ts
export function getFirebaseApp() {
  if (!getApps().length) {
    return initializeApp({...});
  }
  return getApps()[0];
}

// api/any-endpoint.ts
const app = getFirebaseApp(); // Cada função inicializa
```

#### **2. Estrutura de Pastas Serverless:**

**📁 api/ - Endpoints & Workers:**
- TODOS arquivos em api/ são ENDPOINTS públicos
- DEVEM validar entrada com Zod
- DEVEM delegar lógica para lib/services/
- NÃO devem conter lógica de negócio complexa
- Workers PRECISAM ser endpoints para receber webhooks

**📁 lib/ - Lógica de Negócio:**
- NÃO são endpoints acessíveis
- Contêm TODA lógica de negócio
- São importados pelos endpoints
- Devem ser PUROS e TESTÁVEIS
- Schemas Zod APENAS em lib/types/ ou lib/schemas/

#### **3. Integração Vercel Marketplace:**

**Upstash Redis (via Vercel Integration):**
```typescript
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});
```

**QStash (via Vercel Integration):**
```typescript
import { Client } from '@upstash/qstash';
const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// Workers DEVEM ser endpoints em api/processors/
await qstash.publishJSON({
  url: `${process.env.VERCEL_URL}/api/processors/final-processor`,
  body: jobData,
});
```

#### **4. Padrões de Processamento Assíncrono:**

**Event-Driven Pattern Obrigatório:**
1. Evento → Validação → Service → Enfileirar Job
2. Worker → Processar Job → Atualizar Estado
3. NÃO processar síncronamente em webhooks

**Separação de Responsabilidades:**
- payment.processor.ts → Processa EVENTO (enfileira job)
- final-processor.ts → Processa JOB (cria perfil)
- NÃO é duplicação, é arquitetura correta!

#### **5. Timeouts Vercel:**
- API Routes: 10 segundos (Pro: 60s)
- Edge Functions: 30 segundos
- Background Functions: 15 minutos (Enterprise)

#### **6. Variáveis de Ambiente Críticas:**
```bash
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
```

---

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios
- **NUNCA misturar** código de teste com código de produção
- **NUNCA implementar funcionalidades** sem definir interfaces primeiro
- **NUNCA criar arquivos** sem seguir o fluxo arquitetural obrigatório
- **NUNCA assumir estado** entre invocações de função
- **NUNCA processar síncronamente** em webhooks
- **NUNCA mover workers** de api/processors/
- **NUNCA definir schemas duplicados**
- **NUNCA colocar lógica de negócio** em api/

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente
- **Definir interfaces antes da implementação** (Interface-First Development)
- **Documentar dependências** antes de usar
- **Validar exportações** antes de importar
- **SEMPRE validar dados externos** com Zod
- **SEMPRE usar helpers** para inicialização
- **SEMPRE manter workers** como endpoints em api/processors/
- **SEMPRE usar types** de lib/types/

---

## 📦 Dependências Obrigatórias (CRÍTICO - 3 erros prevenidos)

### **Dependências de Produção**

#### **AWS SDK (CRÍTICO - ausente causa falha total)**
```bash
npm install @aws-sdk/client-ses
```
**Uso:** Envio de emails via AWS SES
**Arquivos Afetados:**
- `lib/services/notification/email.service.ts`
- `api/processors/email-sender.ts`

**Configuração Obrigatória:**
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION

#### **Firebase Admin SDK**
```bash
npm install firebase-admin
```
**Uso:** Database, Storage, Authentication
**Arquivos Afetados:**
- `lib/services/firebase.ts`
- `lib/repositories/*.repository.ts`
- `lib/services/storage/firebase.service.ts`

#### **QStash Client**
```bash
npm install @upstash/qstash
```
**Uso:** Queue management e processamento assíncrono
**Arquivos Afetados:**
- `lib/services/queue/qstash.service.ts`
- `lib/services/notification/queue.service.ts`

#### **Redis Client**
```bash
npm install @upstash/redis
```
**Uso:** Cache e sessões
**Arquivos Afetados:**
- `lib/services/redis.ts`
- `lib/repositories/*.repository.ts`

#### **MercadoPago SDK**
```bash
npm install mercadopago
npm install @mercadopago/sdk-react
```
**Uso:** Processamento de pagamentos
**Arquivos Afetados:**
- `lib/services/payment/payment.service.ts`
- `src/components/MercadoPagoCheckout.tsx`

### **Dependências de Desenvolvimento**

#### **TypeScript e Tipos**
```bash
npm install -D typescript @types/node
```

#### **Validação Zod**
```bash
npm install zod
```
**Uso:** Validação de dados na fronteira
**Arquivos Afetados:**
- `lib/schemas/*.ts`
- Todos os endpoints API

### **Validação de Instalação**

**Checklist Obrigatório:**
- [ ] AWS SDK instalado e configurado
- [ ] Firebase Admin SDK configurado
- [ ] QStash client configurado
- [ ] Redis client configurado
- [ ] MercadoPago SDK configurado
- [ ] Zod schemas implementados
- [ ] TypeScript strict mode habilitado

**Comando de Verificação:**
```bash
npm list @aws-sdk/client-ses firebase-admin @upstash/qstash @upstash/redis mercadopago zod
```

## 🔍 Detalhes Técnicos e Justificativas Importantes

### **Sobre Tipos e Validação**

Dados recebidos em cada função (ex: webhook, checkout) quando necessário usar `unknown` devem ser inicialmente tipados

Esses dados brutos são imediatamente validados com schemas fortes (Zod), convertendo para tipos definidos.

Código interno trabalha somente com esses tipos validados.

Isso garante robustez, segurança, e elimina bugs silenciosos.

### **Sobre Código de Testes em Produção**

Sempre analise se há identificação de código de teste misturado em código de produção não pode ter código de teste misturado com código de produção

**Deve ser removido imediatamente.**

Nenhum teste novo será criado nem modificado nesta fase.

## 🎯 Benefícios Esperados da Refatoração

- ✅ **Segurança máxima de tipos**, com validação rigorosa
- ✅ **Código limpo, modular**, com responsabilidades claras
- ✅ **Remoção completa de código de testes em produção**
- ✅ **Configuração correta do mercado pago sdk react para cada função relacionada com pagamento**
- ✅ **Melhor garantia de deploys estáveis e previsíveis**
- ✅ **Estrutura preparada para escalabilidade e manutenção facilitada**

## ⚠️ AVISO IMPORTANTE

> **Durante esta fase de refatoração, é expressamente proibido o uso do tipo `any` em qualquer código de produção.**
>
> quando for necessário usar `unknown` Use somente para representar dados externos não validados, validando-os imediatamente com schemas (Zod).
>
> **Jamais trabalhe com `any` para dados genéricos.**
>
> **É expressamente proibido criar, modificar ou excluir qualquer arquivo nos diretórios `tests/` e seus subdiretórios.**
>
> **Código de teste presente em produção deve ser removido — testes não serão criados/modificados nesta etapa.**
>
> **Manutenção da estrutura modular, clara e possível de deploy na vercel**
>
> **O cumprimento estrito destas regras é FUNDAMENTAL para garantir a qualidade, segurança e manutenibilidade do sistema.**

---

## 1. Visão Geral do Produto

O SOS Moto é uma plataforma de emergência médica para motociclistas que permite criar perfis médicos digitais acessíveis via QR Code. O sistema processa pagamentos via MercadoPago, gera QR Codes únicos e disponibiliza informações médicas críticas para socorristas em situações de emergência.

- **Objetivo Principal**: Fornecer acesso rápido a informações médicas vitais de motociclistas em emergências
- **Público-Alvo**: Motociclistas, socorristas e profissionais de saúde
- **Valor de Mercado**: Redução do tempo de resposta em emergências médicas, potencialmente salvando vidas

## 2. Funcionalidades Principais

### 2.1 Papéis de Usuário

| Papel | Método de Registro | Permissões Principais |
|-------|-------------------|----------------------|
| Motociclista | Pagamento via MercadoPago | Criar perfil médico, visualizar QR Code |
| Socorrista | Acesso via QR Code | Visualizar informações médicas de emergência |

### 2.2 Módulos Funcionais

Nosso sistema consiste nas seguintes páginas principais:

1. **Página Inicial**: formulário de criação de perfil, seleção de planos, integração com checkout MercadoPago
2. **Página de Sucesso**: confirmação de pagamento, exibição do QR Code gerado
3. **Página Memorial**: visualização das informações médicas via QR Code
4. **Páginas de Status**: falha e pendência de pagamento

### 2.3 Detalhes das Páginas

| Nome da Página | Módulo | Descrição da Funcionalidade |
|----------------|--------|-----------------------------|
| Página Inicial | Formulário de Perfil | Coleta dados pessoais, médicos e contatos de emergência. Integração com checkout MercadoPago modal |
| Página Inicial | Seleção de Planos | Oferece planos Básico (R$ 55) e Premium (R$ 85) com diferentes funcionalidades |
| Página Inicial | Checkout MercadoPago | Modal integrado para processamento de pagamentos com SDK React |
| Página de Sucesso | Exibição QR Code | Mostra QR Code gerado e link para download da imagem PNG |
| Página Memorial | Visualização de Dados | Exibe informações médicas, contatos de emergência e dados vitais |
| Páginas de Status | Feedback de Pagamento | Informa status de falha ou pendência no processamento |

## 3. Fluxo Principal do Sistema

### 3.1 Fluxo do Usuário

**Fluxo do Motociclista:**
1. Acessa página inicial e preenche formulário médico
2. Seleciona plano (Básico ou Premium)
3. Realiza pagamento via checkout MercadoPago modal
4. Recebe confirmação e acesso ao QR Code
5. Baixa imagem PNG do QR Code para uso físico

**Fluxo do Socorrista:**
1. Escaneia QR Code do motociclista
2. Acessa página memorial com informações médicas
3. Visualiza dados críticos para atendimento de emergência

### 3.2 Diagrama de Navegação

```mermaid
graph TD
    A[Página Inicial] --> B[Checkout MercadoPago]
    B --> C[Página de Sucesso]
    B --> D[Página de Falha]
    B --> E[Página Pendente]
    C --> F[Download QR Code]
    G[QR Code Físico] --> H[Página Memorial]
    H --> I[Informações Médicas]
```

## 4. Arquitetura Técnica Atual

### 4.1 Diagrama de Arquitetura

```mermaid
graph TD
    A[Frontend React/Vite] --> B[Vercel APIs]
    B --> C[Firebase Firestore]
    B --> D[Firebase Storage]
    B --> E[Upstash Redis]
    B --> F[MercadoPago API]
    B --> G[AWS SES]
    
    subgraph "Frontend Layer"
        A
    end
    
    subgraph "API Layer (Vercel)"
        B
    end
    
    subgraph "Storage Layer"
        C
        D
    end
    
    subgraph "Cache Layer"
        E
    end
    
    subgraph "External Services"
        F
        G
    end
```

### 4.2 Stack Tecnológico

- **Frontend**: React@18 + Vite + TailwindCSS + shadcn/ui
- **Backend**: Vercel Functions (Node.js)
- **Banco de Dados**: Firebase Firestore
- **Storage**: Firebase Storage
- **Cache**: Upstash Redis
- **Pagamentos**: MercadoPago SDK
- **Email**: AWS SES
- **Validação**: Zod
- **QR Code**: qrcode + qrcode.react

### 4.3 Definição de Rotas

| Rota | Propósito |
|------|----------|
| / | Página inicial com formulário e checkout |
| /success | Página de sucesso com QR Code |
| /failure | Página de falha no pagamento |
| /pending | Página de pagamento pendente |
| /memorial/:id | Página memorial com dados médicos |
| /404 | Página não encontrada |

### 4.4 Estado Real da Implementação

#### 4.4.1 ✅ APIs Implementadas Corretamente

**API de Criação de Pagamento**
```
POST /api/create-payment
```
- Validação Zod completa
- Headers obrigatórios (X-Idempotency-Key)
- Integração correta com MercadoPago Preferences API
- Salva pending_profile no Firestore
- Retorna preferenceId para Payment Brick

#### 4.4.2 ⚠️ Problemas Críticos Identificados

**Webhook MercadoPago (NECESSITA CORREÇÃO)**
```
POST /api/mercadopago-webhook
```
- ❌ NÃO usa MercadoPagoService (chama API direta)
- ❌ Processamento SÍNCRONO (deveria ser apenas enfileiramento)
- ❌ Código duplicado com final-processor
- ✅ Validação HMAC implementada
- ✅ Enfileiramento QStash implementado

**Frontend MercadoPagoCheckout.tsx (NECESSITA CORREÇÃO)**
- ❌ Device ID OBRIGATÓRIO não implementado
- ❌ Reduz taxa de aprovação significativamente
- ✅ Payment Brick corretamente integrado
- ✅ Validação de erros implementada

**Melhorias Implementadas:**
- Desacoplamento de outras funcionalidades
- Headers obrigatórios (`X-Idempotency-Key`)
- Suporte exclusivo a cartão e PIX
- Informações adicionais para aprovação
- Device ID obrigatório

**Request:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|----------|
| selectedPlan | string | true | Plano selecionado ('basic' ou 'premium') |
| name | string | true | Nome completo do usuário |
| email | string | true | Email válido (pré-preenchido no checkout) |
| phone | string | true | Telefone de contato |
| age | number | true | Idade (1-120) |
| bloodType | string | false | Tipo sanguíneo |
| allergies | array | false | Lista de alergias |
| medications | array | false | Lista de medicamentos |
| medicalConditions | array | false | Lista de condições médicas |
| emergencyContacts | array | false | Contatos de emergência |
| device_id | string | true | Device ID do MercadoPago (segurança) |

**Response:**
| Parâmetro | Tipo | Descrição |
|-----------|------|----------|
| preferenceId | string | ID da preferência MercadoPago |
| checkoutUrl | string | URL do checkout (não usado no Payment Brick) |
| uniqueUrl | string | ID único do perfil |
| correlationId | string | ID de correlação para logs |

**Referência:** Consulte `mercadopago-integration-guide.md` para implementação completa

#### 4.4.2 API de Webhook MercadoPago (Atualizada)

```
POST /api/mercadopago-webhook
```

**Melhorias de Segurança Implementadas:**
- Validação obrigatória de assinatura HMAC
- Verificação de headers `x-signature` e `x-request-id`
- Processamento apenas de notificações `payment.updated`
- Logs detalhados com correlation ID
- Tratamento de erros específicos

**Headers Obrigatórios:**
| Header | Descrição |
|--------|----------|
| x-signature | Assinatura HMAC do MercadoPago |
| x-request-id | ID único da requisição |

**Fluxo de Validação:**
1. Verificação do método POST
2. Validação da assinatura HMAC
3. Processamento apenas de `type: payment`
4. Busca de detalhes via API MercadoPago
5. Processamento de pagamentos aprovados

**Referência:** Consulte `mercadopago-integration-guide.md` para implementação completa

#### 4.4.3 API de Busca de Perfil

```
GET /api/get-profile?id={uniqueUrl}
```

Busca dados do perfil com estratégia cache-first (Redis → Firestore).

#### 4.4.4 API de Verificação de Status

```
GET /api/check-status?id={uniqueUrl}
```

Verifica status do processamento via Redis cache.

## 5. Integração MercadoPago - Implementação Atualizada

### 5.1 SDK e Configuração Atual

O sistema utiliza o **MercadoPago SDK React oficial** (`@mercadopago/sdk-react`) com Payment Brick:

**Características Implementadas:**
- Payment Brick com SDK React oficial
- Suporte exclusivo a cartão de crédito/débito e PIX
- Pré-preenchimento automático de email
- Device ID obrigatório para segurança
- Callback `onReady` implementado
- Gerenciamento de `unmount` do Brick
- Headers obrigatórios (`X-Idempotency-Key`)

**Referência:** Consulte `mercadopago-integration-guide.md` para implementação completa

### 5.2 Melhorias de Segurança Implementadas

**Device ID (Obrigatório):**
- Implementação do script de segurança MercadoPago
- Coleta automática do `MP_DEVICE_SESSION_ID`
- Envio obrigatório em todas as transações
- **Referência:** `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/melhorara a aprovacao.md`

**Validação HMAC no Webhook:**
- Verificação de assinatura em todas as notificações
- Proteção contra requisições maliciosas
- Headers `x-signature` e `x-request-id` obrigatórios

**Headers de Segurança:**
- `X-Idempotency-Key` obrigatório em todas as requisições
- Prevenção de duplicação de transações
- **Referência:** `documentMp/INTEGRAÇÃO BRICKS/Payment/Cartões.md`

### 5.3 Otimizações para Aprovação

**Informações Adicionais (`additional_info`):**
- Dados detalhados do comprador
- Informações do produto/serviço
- Endereço de entrega quando aplicável
- **Referência:** `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/melhorara a aprovacao.md`

**Pré-preenchimento de Dados:**
- Email automático no checkout
- Redução de erros de digitação
- Melhoria na experiência do usuário
- **Referência:** `documentMp/INTEGRAÇÃO BRICKS/Funcionalidades avançadas/Inicializar dados nos Bricks.md`

## 6. Sistema de Cache e Performance

### 6.1 Estratégia de Cache Redis

**Implementação Atual:**
```typescript
// Cache-first strategy com fallback automático
const profileData = await redisService.getOrSet(
  `qr_code:${uniqueUrl}`,
  () => firebaseService.getProfile(uniqueUrl, correlationId),
  86400, // TTL 24h
  correlationId
);
```

**Benefícios:**
- Reduz carga no Firestore
- Melhora tempo de resposta para QR Codes
- Graceful degradation (falha silenciosa)
- TTL previne dados obsoletos

### 6.2 Fluxo de Dados Detalhado

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as Vercel API
    participant R as Redis
    participant FB as Firestore
    participant MP as MercadoPago
    
    U->>F: Preenche formulário
    F->>API: POST /create-payment
    API->>MP: Cria preferência
    API->>FB: Salva pending_profile
    MP-->>API: Webhook pagamento
    API->>FB: Processa perfil aprovado
    API->>R: Cache perfil (TTL 24h)
    
    Note over U,R: Leitura QR Code
    U->>API: GET /get-profile
    API->>R: Busca cache
    alt Cache Hit
        R-->>API: Retorna dados
    else Cache Miss
        API->>FB: Busca Firestore
        FB-->>API: Retorna dados
        API->>R: Atualiza cache
    end
    API-->>U: Dados do perfil
```

## 7. Problemas Arquiteturais Identificados

### 7.1 Separação de Responsabilidades

**Problemas Atuais:**
1. **create-payment.ts** tem múltiplas responsabilidades:
   - Validação de dados
   - Criação de preferência MercadoPago
   - Processamento de pagamento aprovado
   - Upload de QR Code
   - Envio de email
   - Interação com Firestore

2. **Falta de sistema de filas** para processamento assíncrono

3. **Ausência de separação por domínios** (pagamento, perfil, notificação)

### 7.2 Estrutura Proposta

```
lib/
├── services/
│   ├── payment/
│   │   ├── mercadopago.service.ts
│   │   └── payment.processor.ts
│   ├── profile/
│   │   ├── profile.service.ts
│   │   └── qrcode.service.ts
│   ├── notification/
│   │   ├── email.service.ts
│   │   └── queue.service.ts
│   ├── storage/
│   │   ├── firebase.service.ts
│   │   └── redis.service.ts
│   └── queue/
│       ├── qstash.service.ts
│       └── job.processor.ts
```

## 8. Sistema de Filas QStash (Proposta)

### 8.1 Implementação de Filas

**Fluxo Proposto:**
```mermaid
sequenceDiagram
    participant W as Webhook
    participant Q as QStash
    participant P as Processor
    participant E as Email Service
    
    W->>Q: enqueueProcessingJob()
    Q->>P: HTTP POST /final-processor
    P->>P: Processa pagamento
    P->>P: Salva perfil
    P->>P: Atualiza cache
    P->>Q: enqueueEmailJob()
    Q->>E: HTTP POST /email-sender
    E->>E: Envia email confirmação
```

**Benefícios:**
- Desacoplamento de etapas críticas
- Retry automático em falhas
- Melhor resiliência do sistema
- Processamento assíncrono

### 8.2 Jobs Propostos

1. **ProcessingJob**: Processa pagamento aprovado
2. **EmailJob**: Envia emails de confirmação
3. **CacheUpdateJob**: Atualiza cache Redis
4. **QRCodeGenerationJob**: Gera e faz upload de QR Codes

## 9. Estratégias de Resiliência

### 9.1 Fallback Strategies

**Redis Cache:**
- Falha silenciosa → busca Firestore
- Logs de warning para monitoramento
- Não bloqueia operações críticas

**Firebase Storage:**
- Retry automático em uploads
- Fallback para URL de dados base64
- Graceful degradation

**MercadoPago API:**
- Timeout configurável
- Retry em falhas transitórias
- Logs detalhados para debugging

### 9.2 Monitoramento e Logs

**Correlation ID:**
- Rastreamento end-to-end
- Logs centralizados
- Debugging facilitado

**Métricas Importantes:**
- Taxa de sucesso de pagamentos
- Tempo de resposta das APIs
- Hit rate do cache Redis
- Falhas de processamento

## 10. Plano de Implementação

### 10.1 Fase 1 - Correções Imediatas

1. **Corrigir checkout MercadoPago**
   - Debuggar problema do botão
   - Implementar fallback para checkout externo
   - Testes em diferentes dispositivos

2. **Melhorar logs e monitoramento**
   - Adicionar métricas de performance
   - Implementar alertas de falha

### 10.2 Fase 2 - Refatoração Arquitetural

1. **Separar responsabilidades**
   - Criar serviços especializados
   - Implementar padrão Repository
   - Separar lógica de negócio

2. **Implementar sistema de filas**
   - Configurar QStash
   - Criar jobs de processamento
   - Implementar retry policies

### 10.3 Fase 3 - Otimizações

1. **Melhorar performance**
   - Otimizar queries Firestore
   - Implementar cache inteligente
   - Comprimir imagens QR Code

2. **Adicionar funcionalidades**
   - Dashboard administrativo
   - Relatórios de uso
   - API para parceiros

## 11. Considerações de Segurança (Atualizadas)

### 11.1 Validação de Dados

- **Zod schemas** para validação rigorosa
- **Sanitização** de inputs do usuário
- **Rate limiting** nas APIs
- **Device ID obrigatório** em todas as transações
- **Headers de segurança** (`X-Idempotency-Key`)

### 11.2 Autenticação e Autorização MercadoPago

- **HMAC signature validation** obrigatória para webhooks
- **Headers obrigatórios** (`x-signature`, `x-request-id`)
- **Validação de origem** das notificações
- **CORS** configurado adequadamente
- **Environment variables** para secrets
- **Referência:** `documentMp/INTEGRAÇÃO BRICKS/Como melhorar a aprovação dos pagamentos/melhorara a aprovacao.md`

### 11.3 Proteção de Dados e Prevenção de Fraude

- **Dados médicos sensíveis** protegidos
- **TTL** no cache para privacidade
- **Logs** sem informações pessoais
- **Device ID** para identificação única do dispositivo
- **Informações adicionais** para análise de risco
- **Retry logic** com backoff exponencial

## 12. Conclusão

O sistema SOS Moto possui uma base sólida com Firebase + Vercel, mas necessita de melhorias na separação de responsabilidades e implementação de sistema de filas para maior resiliência. O checkout MercadoPago modal é a abordagem correta, mas requer correções técnicas. A estratégia de cache Redis está bem implementada e deve ser mantida.

**Próximos Passos Prioritários:**
1. Corrigir problema do checkout MercadoPago
2. Implementar sistema de filas QStash
3. Refatorar separação de responsabilidades
4. Melhorar monitoramento e logs

Esta documentação serve como guia para as próximas iterações do sistema, priorizando estabilidade, performance e manutenibilidade.