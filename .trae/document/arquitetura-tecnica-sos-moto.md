# Arquitetura Técnica - Sistema SOS Moto

---

## ⚠️ Regras CRÍTICAS para a Refatoração

> **DEVE SER REPETIDA EM TODAS DOCUMENTAÇÕES E PASSO A PASSO**

### **🚫 Proibições Absolutas:**

- **NUNCA usar `any`** em nenhuma situação no código de produção
- **É TOTALMENTE PROIBIDO** adicionar, modificar ou excluir qualquer arquivo ou código dentro da pasta `tests/` E `test-integration/` ou seus subdiretórios

### **✅ Práticas Obrigatórias:**

- Usar `unknown` **SOMENTE** para dados brutos/exteriores recebidos na fronteira do sistema (entrada de dados), antes da validação
- Validar **TODOS** os dados externos imediatamente com schemas definidos, preferencialmente utilizando Zod
- Após validação, trabalhar apenas com tipos claros, específicos e definidos
- Manutenção da estrutura modular e clara, desacoplada, é prioridade
- Usar `.env` files para variáveis de ambiente

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

## 1. Arquitetura do Sistema

### 1.1 Arquitetura Modular Implementada

```mermaid
graph TD
    A[Navegador do Usuário] --> B[Frontend React/Vite]
    B --> C[Vercel Functions APIs]
    C --> D[Domain Layer]
    C --> E[Service Layer]
    C --> F[Repository Layer]
    C --> G[Processors Layer]
    
    E --> H[Firebase Firestore]
    E --> I[Firebase Storage]
    E --> J[Upstash Redis]
    E --> K[MercadoPago API]
    E --> L[QStash Queue]
    E --> M[AWS SES]
    
    subgraph "Frontend Layer"
        B
    end
    
    subgraph "API Layer (Vercel)"
        C
    end
    
    subgraph "Business Logic (lib/)"
        D
        E
        F
        G
    end
    
    subgraph "External Services"
        H
        I
        J
        K
        L
        M
    end
```

### 1.2 Estrutura Modular Detalhada

```mermaid
graph TD
    A[lib/] --> B[domain/]
    A --> C[services/]
    A --> D[repositories/]
    A --> E[types/]
    A --> F[utils/]
    A --> G[config/]
    A --> H[schemas/]
    
    B --> B1[profile/]
    B --> B2[payment/]
    B --> B3[notification/]
    
    C --> C1[payment/]
    C --> C2[profile/]
    C --> C3[notification/]
    C --> C4[queue/]
    C --> C5[storage/]
    
    D --> D1[profile.repository.ts]
    D --> D2[payment.repository.ts]
```

## 2. Descrição das Tecnologias

### 2.1 Stack Principal
- **Frontend**: React@18 + Vite + TailwindCSS + shadcn/ui + @mercadopago/sdk-react (Payment Brick)
- **Backend**: Vercel Functions (Node.js) com arquitetura modular
- **Banco de Dados**: Firebase Firestore
- **Storage**: Firebase Storage
- **Cache**: Upstash Redis (REST API)
- **Filas**: QStash (Upstash) para processamento assíncrono
- **Pagamentos**: MercadoPago API + SDK React oficial (Payment Brick)
- **Email**: AWS SES v2
- **Validação**: Zod schemas em todas as fronteiras
- **QR Code**: qrcode + qrcode.react
- **Logs**: Sistema customizado com correlationId

### 2.2 Arquitetura Modular (lib/)
- **Domain Layer**: Entidades de negócio (Profile, Payment, Notification)
- **Service Layer**: Lógica de negócio e integração com serviços externos
- **Repository Layer**: Acesso a dados com padrão Repository
- **Types**: Definições TypeScript centralizadas
- **Utils**: Utilitários compartilhados (logger, validation, ids)
- **Config**: Configurações de ambiente
- **Schemas**: Validação Zod para todas as entradas

### 2.3 Segurança Implementada
- **Device ID**: OBRIGATÓRIO para MercadoPago (melhora aprovação)
- **Validação HMAC**: Webhooks MercadoPago com assinatura secreta
- **Headers Obrigatórios**: X-Idempotency-Key, X-Correlation-Id
- **Validação Zod**: Todas as entradas validadas na fronteira
- **Tipos Seguros**: Proibido uso de `any`, `unknown` apenas na fronteira

## 3. Definições de Rotas

| Rota | Propósito |
|------|----------|
| / | Página inicial com formulário de criação de perfil e checkout |
| /success?id={uniqueUrl} | Página de sucesso exibindo QR Code gerado |
| /failure | Página de falha no processamento do pagamento |
| /pending | Página de pagamento pendente (aguardando confirmação) |
| /memorial/:id | Página memorial com informações médicas (acesso via QR Code) |
| /404 | Página não encontrada |

## 4. Fluxo de Processamento Real vs Documentado

### 4.1 ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

**INCONSISTÊNCIA ARQUITETURAL:**
- **Documentado**: Fluxo assíncrono com QStash
- **Implementado**: Webhook processa SÍNCRONAMENTE
- **Problema**: Webhook não usa MercadoPagoService (chama API direta)
- **Duplicação**: processApprovedPayment em 2 lugares

### 4.2 Fluxo Atual Implementado (SÍNCRONO)

```mermaid
graph TD
    A[MercadoPago] --> B[api/mercadopago-webhook.ts]
    B --> C[Validação HMAC]
    B --> D[Busca Payment Details - API DIRETA]
    B --> E[Salva Log - PaymentRepository]
    B --> F[Enfileira Job - QStash]
    F --> G[api/processors/final-processor.ts]
    G --> H[Processamento Completo]
```

### 4.3 APIs Implementadas

#### Criação de Pagamento
```
POST /api/create-payment
```

**Status**: ✅ IMPLEMENTADO CORRETAMENTE
- Headers obrigatórios (`X-Idempotency-Key`)
- Validação Zod completa
- Suporte a cartão de crédito/débito e PIX
- ⚠️ **FALTA**: Device ID obrigatório no frontend
- Salva pending_profile no Firestore
- Retorna preferenceId para Payment Brick

**Request:**
| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|----------|
| selectedPlan | 'basic' \| 'premium' | true | Plano selecionado |
| name | string | true | Nome completo |
| email | string | true | Email válido (pré-preenchido no checkout) |
| phone | string | true | Telefone |
| age | number | true | Idade (1-120) |
| bloodType | string | false | Tipo sanguíneo |
| allergies | string[] | false | Lista de alergias |
| medications | string[] | false | Medicamentos |
| medicalConditions | string[] | false | Condições médicas |
| healthPlan | string | false | Plano de saúde |
| preferredHospital | string | false | Hospital preferido |
| medicalNotes | string | false | Observações médicas |
| emergencyContacts | EmergencyContact[] | false | Contatos de emergência |
| device_id | string | true | Device ID do MercadoPago (segurança) |

**Response:**
| Parâmetro | Tipo | Descrição |
|-----------|------|----------|
| preferenceId | string | ID da preferência MercadoPago |
| checkoutUrl | string | URL do checkout (backup) |
| uniqueUrl | string | ID único do perfil |
| correlationId | string | ID de correlação |

**Exemplo Request:**
```json
{
  "selectedPlan": "premium",
  "name": "João Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "age": 35,
  "bloodType": "O+",
  "allergies": ["Penicilina"],
  "medications": ["Losartana 50mg"],
  "emergencyContacts": [
    {
      "name": "Maria Silva",
      "relationship": "Esposa",
      "phone": "11888888888",
      "isMain": true
    }
  ]
}
```

#### Webhook MercadoPago
```
POST /api/mercadopago-webhook
```

**Status**: ⚠️ PARCIALMENTE IMPLEMENTADO - NECESSITA CORREÇÕES

**Implementado Corretamente:**
- Validação HMAC com assinatura secreta
- Parsing com MercadoPagoWebhookSchema (Zod)
- Log de pagamentos via PaymentRepository
- Enfileiramento de jobs via QStash

**❌ PROBLEMAS CRÍTICOS:**
- Webhook NÃO usa MercadoPagoService (chama API direta)
- Processamento SÍNCRONO (deveria ser apenas enfileiramento)
- Código duplicado com final-processor

**Correções Necessárias:**
```typescript
// ATUAL (INCORRETO):
const payment = await fetch('https://api.mercadopago.com/v1/payments/...');

// DEVERIA SER:
const payment = await mercadoPagoService.getPaymentDetails(webhookData.data.id);
```
- Validação obrigatória de assinatura HMAC
- Verificação de headers `x-signature` e `x-request-id`
- Processamento apenas de notificações `payment.updated`
- Logs detalhados com correlation ID
- Tratamento de erros específicos
- Processamento assíncrono de pagamentos aprovados

**Headers Obrigatórios:**
- `x-signature`: Assinatura HMAC do MercadoPago
- `x-request-id`: ID único da requisição

**Fluxo de Validação:**
1. Verificação do método POST
2. Validação da assinatura HMAC
3. Processamento apenas de `type: payment`
4. Busca de detalhes via API MercadoPago
5. Processamento de pagamentos aprovados

**Referência:** Consulte `mercadopago-integration-guide.md` para implementação completa

#### Busca de Perfil
```
GET /api/get-profile?id={uniqueUrl}
```

**Response:**
| Parâmetro | Tipo | Descrição |
|-----------|------|----------|
| success | boolean | Status da operação |
| data | MemorialData | Dados do perfil (se encontrado) |
| source | 'cache' \| 'database' | Origem dos dados |
| cached | boolean | Se veio do cache |
| correlationId | string | ID de correlação |

#### Verificação de Status
```
GET /api/check-status?id={uniqueUrl}
```

Verifica status do processamento via Redis.

## 5. Modelo de Dados

### 5.1 Diagrama de Entidades

```mermaid
erDiagram
    PENDING_PROFILES ||--|| PAYMENTS_LOG : references
    USER_PROFILES ||--|| PENDING_PROFILES : processes_from
    USER_PROFILES ||--o{ EMERGENCY_CONTACTS : contains
    
    PENDING_PROFILES {
        string id PK
        string name
        string email
        string phone
        number age
        string bloodType
        array allergies
        array medications
        array medicalConditions
        string healthPlan
        string preferredHospital
        string medicalNotes
        array emergencyContacts
        string selectedPlan
        number planPrice
        string uniqueUrl
        string preferenceId
        string correlationId
        string status
        timestamp createdAt
    }
    
    USER_PROFILES {
        string id PK
        string name
        string email
        string phone
        number age
        string bloodType
        array allergies
        array medications
        array medicalConditions
        string healthPlan
        string preferredHospital
        string medicalNotes
        string planType
        string qrCodeData
        string qrCodeImageUrl
        timestamp createdAt
        string correlationId
    }
    
    EMERGENCY_CONTACTS {
        string name
        string relationship
        string phone
        boolean isMain
    }
    
    PAYMENTS_LOG {
        string id PK
        string paymentId
        string status
        string statusDetail
        string externalReference
        object customerData
        number amount
        string correlationId
        timestamp processedAt
    }
```

### 5.2 Definições de Dados (DDL)

#### Coleção: pending_profiles
```javascript
// Firestore Collection: pending_profiles
{
  id: string, // uniqueUrl gerado
  name: string,
  email: string,
  phone: string,
  age: number,
  bloodType?: string,
  allergies: string[],
  medications: string[],
  medicalConditions: string[],
  healthPlan?: string,
  preferredHospital?: string,
  medicalNotes?: string,
  emergencyContacts: {
    name: string,
    relationship: string,
    phone: string,
    isMain: boolean
  }[],
  selectedPlan: 'basic' | 'premium',
  planPrice: number,
  uniqueUrl: string,
  preferenceId: string,
  correlationId: string,
  status: 'pending' | 'approved' | 'failed',
  createdAt: Timestamp,
  updatedAt?: Timestamp,
  paymentId?: string,
  paymentData?: object
}
```

#### Coleção: user_profiles
```javascript
// Firestore Collection: user_profiles
{
  id: string, // uniqueUrl
  name: string,
  email: string,
  phone: string,
  age: number,
  bloodType?: string,
  allergies: string[],
  medications: string[],
  medicalConditions: string[],
  healthPlan?: string,
  preferredHospital?: string,
  medicalNotes?: string,
  emergencyContacts: {
    name: string,
    relationship: string,
    phone: string,
    isMain: boolean
  }[],
  planType: 'basic' | 'premium',
  qrCodeData: string, // URL do memorial
  qrCodeImageUrl: string, // URL da imagem PNG
  createdAt: Timestamp,
  correlationId: string
}
```

#### Coleção: payments_log
```javascript
// Firestore Collection: payments_log
{
  id: string, // paymentId do MercadoPago
  paymentId: string,
  status: string,
  statusDetail: string,
  externalReference: string,
  customerData: {
    email?: string,
    identification?: object
  },
  amount: number,
  correlationId: string,
  processedAt: Timestamp
}
```

#### Cache Redis
```javascript
// Redis Key Pattern: qr_code:{uniqueUrl}
// TTL: 86400 segundos (24 horas)
{
  unique_url: string,
  name: string,
  phone: string,
  blood_type?: string,
  allergies: string[],
  medications: string[],
  medical_conditions: string[],
  emergency_contacts: {
    name: string,
    phone: string,
    relationship: string
  }[],
  age: number,
  email: string,
  health_plan?: string,
  preferred_hospital?: string,
  medical_notes?: string,
  plan_type: 'basic' | 'premium',
  created_at: string,
  qr_code_data?: string,
  qr_code_image_url?: string
}
```

## 6. Arquitetura de Serviços

### 6.1 Estrutura Atual

```
api/
├── create-payment.ts     # Múltiplas responsabilidades
├── mercadopago-webhook.ts # Processamento webhook
├── get-profile.ts        # Busca perfis
└── check-status.ts       # Verificação status

lib/
├── services/
│   ├── firebase.ts       # Serviço Firebase
│   └── redis.ts          # Serviço Redis
├── utils/
│   ├── validation.ts     # Validações
│   ├── logger.ts         # Sistema de logs
│   └── ids.ts           # Geração de IDs
└── types/
    └── index.ts         # Definições de tipos
```

### 6.2 Estrutura Proposta (Refatoração)

```
api/
├── create-payment.ts
├── mercadopago-webhook.ts
├── get-profile.ts
├── check-status.ts
└── processors/
    ├── final-processor.ts    # Processamento assíncrono
    └── email-sender.ts       # Envio de emails

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
├── repositories/
│   ├── profile.repository.ts
│   └── payment.repository.ts
└── domain/
    ├── profile/
    ├── payment/
    └── notification/
```

## 7. Fluxo de Dados Detalhado

### 7.1 Fluxo de Criação de Perfil

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant API as create-payment
    participant MP as MercadoPago
    participant FB as Firestore
    participant FS as Firebase Storage
    participant W as Webhook
    participant R as Redis
    participant E as AWS SES
    
    U->>F: Preenche formulário
    F->>API: POST /create-payment
    
    Note over API: Validação Zod
    API->>MP: Cria preferência
    MP-->>API: preferenceId
    
    API->>FB: Salva pending_profile
    API-->>F: preferenceId + uniqueUrl
    
    F->>F: Abre checkout modal
    U->>F: Confirma pagamento
    
    MP->>W: Webhook notification
    W->>MP: Busca dados pagamento
    MP-->>W: Payment data
    
    W->>FB: Log payment
    
    alt Pagamento Aprovado
        W->>API: processApprovedPayment()
        API->>FB: Busca pending_profile
        API->>API: Gera QR Code
        API->>FS: Upload QR Code PNG
        API->>FB: Salva user_profile
        API->>R: Cache perfil (TTL 24h)
        API->>E: Envia email confirmação
        API->>FB: Atualiza pending_profile
    end
```

### 7.2 Fluxo de Leitura de QR Code

```mermaid
sequenceDiagram
    participant S as Socorrista
    participant F as Frontend
    participant API as get-profile
    participant R as Redis
    participant FB as Firestore
    
    S->>S: Escaneia QR Code
    S->>F: Acessa /memorial/{id}
    F->>API: GET /get-profile?id={id}
    
    API->>R: Busca cache
    
    alt Cache Hit
        R-->>API: Dados do perfil
        API-->>F: Response (cached: true)
    else Cache Miss
        API->>FB: Busca Firestore
        FB-->>API: Dados do perfil
        API->>R: Atualiza cache
        API-->>F: Response (cached: false)
    end
    
    F->>F: Exibe informações médicas
```

## 8. Sistema de Filas Proposto (QStash)

### 8.1 Configuração QStash

```typescript
// lib/services/queue/qstash.service.ts
import { Client } from '@upstash/qstash';

class QStashService {
  private client: Client;
  
  constructor() {
    this.client = new Client({
      token: process.env.QSTASH_TOKEN!,
    });
  }
  
  async enqueueProcessingJob(data: ProcessingJobData) {
    return await this.client.publishJSON({
      url: `${process.env.FRONTEND_URL}/api/processors/final-processor`,
      body: data,
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_SIGNING_KEY}`
      }
    });
  }
  
  async enqueueEmailJob(data: EmailJobData) {
    return await this.client.publishJSON({
      url: `${process.env.FRONTEND_URL}/api/processors/email-sender`,
      body: data,
      delay: 30, // 30 segundos de delay
      headers: {
        'Authorization': `Bearer ${process.env.QSTASH_SIGNING_KEY}`
      }
    });
  }
}
```

### 8.2 Processadores de Jobs

```typescript
// api/processors/final-processor.ts
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Validar assinatura QStash
  const isValid = await verifyQStashSignature(req);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  const { profileId, paymentData } = req.body;
  
  try {
    // 1. Processar pagamento
    await paymentProcessor.process(profileId, paymentData);
    
    // 2. Gerar e salvar QR Code
    await qrCodeService.generateAndSave(profileId);
    
    // 3. Atualizar cache
    await cacheService.updateProfile(profileId);
    
    // 4. Enfileirar job de email
    await qstashService.enqueueEmailJob({ profileId });
    
    res.status(200).json({ status: 'processed' });
  } catch (error) {
    // Log error e retry automático pelo QStash
    console.error('Processing failed:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
}
```

## 9. Monitoramento e Observabilidade

### 9.1 Sistema de Logs

```typescript
// lib/utils/logger.ts
export function logInfo(message: string, metadata?: object) {
  console.log(JSON.stringify({
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    ...metadata
  }));
}

export function logError(message: string, error: Error, metadata?: object) {
  console.error(JSON.stringify({
    level: 'error',
    message,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    timestamp: new Date().toISOString(),
    ...metadata
  }));
}
```

### 9.2 Métricas Importantes

- **Taxa de conversão**: Formulários → Pagamentos aprovados
- **Tempo de resposta**: APIs e cache hits
- **Taxa de erro**: Falhas por endpoint
- **Cache hit rate**: Eficiência do Redis
- **Tempo de processamento**: Webhook → Perfil ativo

## 10. Segurança e Validação

### 10.1 Validação de Entrada

```typescript
// lib/schemas/payment.ts
import { z } from 'zod';

export const PaymentSchema = z.object({
  selectedPlan: z.enum(['basic', 'premium']),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\d{10,11}$/),
  age: z.number().min(1).max(120),
  bloodType: z.string().optional(),
  allergies: z.array(z.string()).default([]),
  medications: z.array(z.string()).default([]),
  medicalConditions: z.array(z.string()).default([]),
  emergencyContacts: z.array(z.object({
    name: z.string().min(1),
    relationship: z.string().min(1),
    phone: z.string().regex(/^\d{10,11}$/),
    isMain: z.boolean().default(false)
  })).default([])
});
```

### 10.2 Validação HMAC (Webhooks)

```typescript
// lib/utils/validation.ts
import crypto from 'crypto';

export function validateHMACSignature(
  requestId: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(requestId)
    .digest('hex');
    
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
```

## 11. Configuração de Ambiente

### 11.1 Variáveis de Ambiente

```bash
# Firebase
FIREBASE_PROJECT_ID=moto-sos-guardian-app-78272
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@xxx.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# MercadoPago
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxx
MERCADOPAGO_WEBHOOK_SECRET=xxx
VITE_MERCADOPAGO_PUBLIC_KEY=APP_USR-xxx

# Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# QStash (Proposto)
QSTASH_TOKEN=xxx
QSTASH_SIGNING_KEY=xxx

# AWS SES
AWS_SES_REGION=sa-east-1
AWS_SES_ACCESS_KEY_ID=xxx
AWS_SES_SECRET_ACCESS_KEY=xxx

# URLs
FRONTEND_URL=https://memoryys.com
VITE_FRONTEND_URL=https://memoryys.com
```

## 12. Deploy e CI/CD

### 12.1 Vercel Configuration

```json
// vercel.json
{
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "env": {
    "FIREBASE_PROJECT_ID": "@firebase-project-id",
    "MERCADOPAGO_ACCESS_TOKEN": "@mercadopago-access-token"
  }
}
```

### 12.2 Build Configuration

```json
// package.json scripts
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "build:dev": "vite build --mode development",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

Esta documentação técnica complementa a documentação principal, fornecendo detalhes específicos de implementação, estruturas de dados e configurações necessárias para o desenvolvimento e manutenção do sistema SOS Moto.